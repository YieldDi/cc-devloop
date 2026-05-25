# Phase 2 — V1

**Duration:** 4-6 weeks
**Goal:** Full multi-agent workflow, Project Profile system, Git integration

## Scope

### 1. Five-Stage Workflow Engine

```
需求立项 → 技术方案 → 代码实现 → 测试验证 → 上线部署
PM Agent   Architect   Coder      QA Agent   DevOps
```

Each stage:
- Has defined inputs/outputs (JSON schema)
- Produces artifacts stored in project workspace
- Handoff: previous stage output becomes next stage context
- User can review/approve at each stage gate

### 2. Multi-Agent Design

```typescript
// Stage agents and their responsibilities
const agents = {
  pm: {
    name: "PM Agent",
    input: "user requirement description",
    output: "PRD document (structured JSON/Markdown)",
    tools: ["webSearch", "documentWrite"],
  },
  architect: {
    name: "Architect Agent",
    input: "PRD from PM Agent",
    output: "Technical Design Doc + Project Profile",
    tools: ["webSearch", "documentWrite", "diagramGenerate"],
  },
  coder: {
    name: "Coder Agent",
    input: "Tech Design + Project Profile",
    output: "Source code files",
    tools: ["readFile", "writeFile", "searchCode", "runCommand"],
  },
  qa: {
    name: "QA Agent",
    input: "Tech Design + Source Code",
    output: "Test cases + Test results + Code review findings",
    tools: ["readFile", "writeFile", "runCommand", "runTests"],
  },
  devops: {
    name: "DevOps Agent",
    input: "Tested source code + Deploy config",
    output: "Build artifacts + Deploy scripts",
    tools: ["readFile", "writeFile", "runCommand", "docker", "gitPush"],
  },
}
```

### 3. Agent Handoff Protocol

```json
{
  "stage": "architecture",
  "status": "completed",
  "artifacts": [
    { "type": "document", "path": "docs/TECH_DESIGN.md" },
    { "type": "profile", "path": ".yielddi/profile.json" }
  ],
  "summary": "Designed as Spring Boot microservice with PostgreSQL...",
  "nextStage": "coding",
  "contextForNext": {
    "profileId": "java-spring-boot",
    "keyDecisions": ["REST API", "JPA entities", "Maven build"],
    "constraints": ["Java 17+", "PostgreSQL 15"]
  }
}
```

### 4. Project Profile System

See [profile-system.md](./profile-system.md) for full design.

Key additions in V1:
- Profile Registry with 15+ built-in profiles
- Auto-scanner for existing projects (file fingerprint detection)
- Profile editor for custom project types
- Dynamic tool/prompt injection based on profile

### 5. Git Integration

- Auto git init on new project creation
- Agent commits at each stage completion
- Branch management: feature branches per task
- Commit message generation by Agent
- Diff view in Monaco for reviewing agent changes
- PR creation support (via `gh` CLI)

### 6. UI Enhancements

- Workflow pipeline visualization (stage progress bar)
- Stage gate review panel (approve/reject/revise)
- Markdown renderer for PRD and Tech Design docs
- Artifact gallery (generated diagrams, schemas)
- Project dashboard (recent projects, status overview)

## Deliverables

- [ ] 5 agents with defined handoff protocol
- [ ] Workflow engine orchestrates stages sequentially
- [ ] User reviews/approves at each stage gate
- [ ] Profile auto-detection on project import
- [ ] 15+ built-in profiles (Java, Python, Go, Node, Rust, C#, PHP, etc.)
- [ ] Git operations: init, commit, branch, PR
- [ ] PRD and Tech Design rendered as Markdown in editor
- [ ] Workflow progress visualization
