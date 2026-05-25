# Project Profile System

## Purpose

Decouple agents from specific languages/frameworks. Each project type has a profile that defines:
- File structure conventions
- Build/test/lint commands
- Agent system prompt hints
- Tool configuration

Agents are language-agnostic. The profile injects the right context.

## Profile Schema

```typescript
interface ProjectProfile {
  id: string                    // "java-spring-boot-maven"
  name: string                  // "Java Spring Boot (Maven)"
  language: string              // "java"
  framework?: string            // "spring-boot"
  buildTool: string             // "maven"
  tags: string[]                // ["web", "api", "microservice"]

  // File structure conventions
  conventions: {
    entryFile: string           // "src/main/java/com/example/App.java"
    configFiles: string[]       // ["pom.xml", "application.yml"]
    sourceDir: string           // "src/main/java"
    resourceDir: string         // "src/main/resources"
    testDir: string             // "src/test/java"
    testResourceDir: string     // "src/test/resources"
    buildOutputDir: string      // "target/"
    envFile?: string            // ".env"
  }

  // Executable commands
  commands: {
    init: string                // "mvn archetype:generate -D..."
    install: string             // "mvn install"
    build: string               // "mvn package -DskipTests"
    test: string                // "mvn test"
    lint: string | null         // null if not commonly used
    dev: string                 // "mvn spring-boot:run"
    format: string | null       // "mvn spotless:apply"
    clean: string               // "mvn clean"
  }

  // Language-specific dependencies
  runtime: {
    version?: string            // "17+" (Java), "3.11+" (Python)
    runtimeCommand: string      // "java", "node", "python3"
    packageManager: string      // "mvn", "npm", "pip", "cargo"
    lockFile: string            // "pom.xml" (Maven has no lock), "package-lock.json"
  }

  // Agent prompt fragments (injected into system prompt)
  agentHints: {
    coder: string               // "Use Spring Boot conventions. Prefer constructor injection..."
    qa: string                  // "Use JUnit 5 + Mockito. Test slices with @WebMvcTest..."
    devops: string              // "Build Docker image with Eclipse Temurin JDK 17 base..."
  }

  // Default dependencies for new projects
  starterDependencies?: {
    [key: string]: string       // "spring-boot-starter-web": "3.2.x"
  }

  // Docker config
  docker?: {
    baseImage: string           // "eclipse-temurin:17-jdk"
    exposePort: number          // 8080
    buildStageCmd: string       // "mvn package -DskipTests"
  }
}
```

## Built-in Profiles

### Java

| ID | Framework | Build Tool | Project Type |
|----|-----------|------------|-------------|
| `java-spring-boot-maven` | Spring Boot | Maven | Web API / Microservice |
| `java-spring-boot-gradle` | Spring Boot | Gradle | Web API / Microservice |
| `java-maven` | None | Maven | CLI / Library |
| `java-gradle` | None | Gradle | CLI / Library |

### Python

| ID | Framework | Project Type |
|----|-----------|-------------|
| `python-fastapi` | FastAPI | API Service |
| `python-django` | Django | Web App |
| `python-flask` | Flask | Web App |
| `python-script` | None | Script / CLI |
| `python-ml` | None | Data Science / ML |

### Node.js / TypeScript

| ID | Framework | Project Type |
|----|-----------|-------------|
| `node-nextjs` | Next.js | Full-stack Web |
| `node-react` | React | Frontend SPA |
| `node-vue` | Vue | Frontend SPA |
| `node-express` | Express | API Server |
| `node-nestjs` | NestJS | API Server |
| `node-cli` | None | CLI Tool |
| `node-library` | None | Library / Package |

### Go

| ID | Framework | Project Type |
|----|-----------|-------------|
| `go-gin` | Gin | Web Service |
| `go-echo` | Echo | Web Service |
| `go-cli` | None | CLI Tool |
| `go-microservice` | None | Microservice |

### Rust

| ID | Framework | Project Type |
|----|-----------|-------------|
| `rust-actix` | Actix Web | Web Service |
| `rust-axum` | Axum | Web Service |
| `rust-cli` | None | CLI Tool |

### C# / .NET

| ID | Framework | Project Type |
|----|-----------|-------------|
| `dotnet-webapi` | ASP.NET Core | Web API |
| `dotnet-mvc` | ASP.NET Core MVC | Web App |
| `dotnet-console` | None | CLI / Console |

### PHP

| ID | Framework | Project Type |
|----|-----------|-------------|
| `php-laravel` | Laravel | Web App |
| `php-symfony` | Symfony | Web App |

## Project Scanner (Auto-detection)

Fingerprints for identifying existing projects:

```typescript
type Fingerprint = {
  file: string                   // File that must exist
  contains?: string              // Optional content match
  absent?: string[]              // Files that must NOT exist
}

const FINGERPRINTS: Record<string, Fingerprint[]> = {
  // Language + Build Tool
  "java-maven":    [{ file: "pom.xml" }],
  "java-gradle":   [{ file: "build.gradle" }, { file: "build.gradle.kts" }],
  "node-npm":      [{ file: "package.json", absent: ["yarn.lock", "pnpm-lock.yaml"] }],
  "node-yarn":     [{ file: "package.json" }],  // + yarn.lock present
  "node-pnpm":     [{ file: "package.json" }],  // + pnpm-lock.yaml present
  "python-pip":    [{ file: "requirements.txt" }],
  "python-poetry": [{ file: "pyproject.toml", contains: "[tool.poetry]" }],
  "python-uv":     [{ file: "pyproject.toml" }], // + uv.lock present
  "go":            [{ file: "go.mod" }],
  "rust":          [{ file: "Cargo.toml" }],
  "dotnet":        [{ file: "*.csproj" }],        // glob match
  "php-composer":  [{ file: "composer.json" }],

  // Framework layer (checked after language)
  "spring-boot":   [{ file: "pom.xml", contains: "spring-boot" }],
  "nextjs":        [{ file: "package.json", contains: '"next"' }],
  "react":         [{ file: "package.json", contains: '"react"' }],
  "vue":           [{ file: "package.json", contains: '"vue"' }],
  "nestjs":        [{ file: "package.json", contains: '"@nestjs/core"' }],
  "django":        [{ file: "manage.py" }],
  "fastapi":       [{ file: "pyproject.toml", contains: "fastapi" }],
  "laravel":       [{ file: "artisan" }],
}
```

Scan flow:
1. Check root directory files → detect language + build tool
2. Check config file contents → detect framework
3. Combine results → match profile ID
4. If no exact match → generate dynamic profile from detected signals
5. User can adjust detected profile before confirming

## Dynamic Tool Assembly

```typescript
function buildToolsForProfile(profile: ProjectProfile): AgentTool[] {
  // Base tools (always available)
  const base: AgentTool[] = [
    readFileTool,
    writeFileTool,
    searchCodeTool,
    gitTool,
  ]

  // Language-specific tools
  const languageToolMap: Record<string, AgentTool[]> = {
    java:     [mavenTool],
    nodejs:   [npmTool],
    python:   [pipTool],
    go:       [goTool],
    rust:     [cargoTool],
    csharp:   [dotnetTool],
    php:      [composerTool],
  }

  // Project type tools (framework-specific)
  const frameworkToolMap: Record<string, AgentTool[]> = {
    "spring-boot": [springBootTool],
    "nextjs":      [nextjsTool],
    "django":      [djangoTool],
  }

  // Deploy target tools
  const deployToolMap: Record<string, AgentTool[]> = {
    docker:      [dockerTool],
    kubernetes:  [kubectlTool, helmTool],
    serverless:  [serverlessTool],
  }

  return [
    ...base,
    ...(languageToolMap[profile.language] || []),
    ...(profile.framework ? frameworkToolMap[profile.framework] || [] : []),
    ...(profile.docker ? deployToolMap.docker : []),
  ]
}
```

## Dynamic Prompt Injection

```typescript
function buildCoderSystemPrompt(profile: ProjectProfile): string {
  return `You are a senior ${profile.language} developer.

## Project Context
- Framework: ${profile.framework || "None (vanilla)"}
- Build tool: ${profile.buildTool}
- Source directory: ${profile.conventions.sourceDir}
- Test directory: ${profile.conventions.testDir}

## Coding Guidelines
${profile.agentHints.coder}

## Available Commands
- Install deps: ${profile.commands.install}
- Run tests: ${profile.commands.test}
- Build: ${profile.commands.build}
- Format: ${profile.commands.format || "N/A"}
- Dev server: ${profile.commands.dev}

## Conventions
- Config files: ${profile.conventions.configFiles.join(", ")}
- Resources: ${profile.conventions.resourceDir}
- Build output: ${profile.conventions.buildOutputDir}

Follow the project's existing patterns and conventions. Write idiomatic ${profile.language} code.`
}
```

## Three Project Access Modes

### Mode A: New Project
```
User describes requirement
  → Architect Agent selects tech stack
  → Generates Project Profile
  → Coder Agent runs init command
  → Empty project scaffolded with correct structure
```

### Mode B: Import Local Project
```
User points to local directory
  → Scanner reads directory structure
  → Fingerprints detected → Profile matched or generated
  → User reviews/adjusts profile
  → Workspace connected
```

### Mode C: Clone Git Repo
```
User provides Git URL
  → Clone to local workspace
  → Same scan flow as Mode B
  → Git history preserved for context
```
