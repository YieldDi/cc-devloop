# Phase 3 — V2

**Duration:** Ongoing
**Goal:** Production-grade, extensible, enterprise-ready

## Scope

### 1. Advanced Agent Capabilities

- **RAG integration**: Agent reads project docs, wiki, previous PRDs for context
- **Learning from feedback**: User corrections improve agent suggestions over time
- **Parallel agents**: Multiple Coder Agents working on independent tasks
- **Agent retry & rollback**: Failed stages auto-retry with adjusted context

### 2. DevOps Agent Full Support

- Dockerfile generation (auto from Project Profile)
- Docker Compose for multi-service projects
- Kubernetes manifest generation
- CI/CD pipeline generation (GitHub Actions, GitLab CI, Jenkins)
- Cloud deployment (AWS, GCP, Azure) via cloud CLI tools
- SSH remote deployment for traditional servers

### 3. QA Agent Deep Testing

- Unit test generation (per language/framework conventions)
- Integration test scaffolding
- API test generation (OpenAPI spec based)
- Performance test templates
- Security scan integration (OWASP dependency check)
- Test coverage reporting

### 4. Plugin System

```typescript
interface YieldDiPlugin {
  name: string
  version: string

  // Register custom project profiles
  profiles?: ProjectProfile[]

  // Register custom agent tools
  tools?: AgentTool[]

  // Register custom workflow stages
  stages?: WorkflowStage[]

  // Hook into agent lifecycle
  hooks?: {
    beforeAgentRun?: (context: AgentContext) => AgentContext
    afterAgentRun?: (result: AgentResult) => AgentResult
    onToolUse?: (tool: ToolCall) => ToolCall | null  // null = block
  }
}
```

Plugin examples:
- Company internal framework profile plugin
- Custom CI/CD pipeline template plugin
- Code style enforcement plugin (company lint rules)
- Database migration plugin (Flyway/Liquibase integration)

### 5. Collaboration Features

- Multi-project workspace (related microservices)
- Shared Project Profiles across team
- Export workflow run as reproducible template
- Agent conversation history with search

### 6. Security & Sandboxing

- Agent file operations scoped to project directory (Tauri security)
- Command execution allowlist per profile
- Sensitive file protection (.env, credentials)
- Audit log of all agent actions
- Optional: containerized agent execution (Docker sandbox)

### 7. Performance & UX

- Agent response caching (similar requests)
- Background agent runs with notification
- Keyboard shortcuts for power users
- Dark/light theme
- i18n (中文/English)
- Auto-update via Tauri updater

## Deliverables

- [ ] Plugin API and plugin loading mechanism
- [ ] Docker/K8s deployment support
- [ ] CI/CD pipeline generation (GitHub Actions first)
- [ ] Advanced QA: integration tests, security scans
- [ ] Multi-project workspace
- [ ] Command sandboxing and audit log
- [ ] i18n support (中文/English)
- [ ] Auto-update mechanism
