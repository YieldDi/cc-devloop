# Agent Design

## Agent Architecture

All agents built on Claude Agent SDK with:
- Structured output (JSON schema) for inter-agent communication
- Streaming output to UI via Tauri events
- Scoped tools (file ops limited to project directory)
- Stage gate: user reviews output before next agent starts

## Agent Definitions

### PM Agent — 需求立项

```yaml
name: PM Agent
model: claude-sonnet-4-6
purpose: Analyze user requirements, generate PRD

input:
  type: free-text
  description: User's natural language requirement description

output:
  format: markdown
  artifacts:
    - docs/PRD.md

systemPrompt: |
  You are a senior product manager. Analyze the user's requirement and produce a PRD that includes:
  1. Project overview and goals
  2. Target users and scenarios
  3. Feature list with priorities (P0/P1/P2)
  4. User stories with acceptance criteria
  5. Non-functional requirements (performance, security, scalability)
  6. Assumptions and constraints
  Output as structured Markdown.

tools:
  - webSearch (research similar products/solutions)
  - documentWrite (write PRD.md)

outputSchema:
  type: object
  properties:
    projectName: { type: string }
    overview: { type: string }
    features:
      type: array
      items:
        type: object
        properties:
          name: { type: string }
          priority: { enum: [P0, P1, P2] }
          description: { type: string }
          userStories:
            type: array
            items:
              type: object
              properties:
                story: { type: string }
                acceptanceCriteria: { type: array, items: { type: string } }
    constraints: { type: array, items: { type: string } }
```

### Architect Agent — 技术方案

```yaml
name: Architect Agent
model: claude-sonnet-4-6
purpose: Design technical architecture, select tech stack, define API

input:
  - PRD from PM Agent (docs/PRD.md)
  - User's tech preferences (optional)

output:
  format: markdown
  artifacts:
    - docs/TECH_DESIGN.md
    - .yielddi/profile.json

systemPrompt: |
  You are a senior software architect. Based on the PRD, design the technical solution:
  1. Tech stack selection with justification
  2. System architecture (high-level diagram in Mermaid)
  3. Module breakdown and responsibilities
  4. API design (endpoints, request/response schemas)
  5. Database schema design (if applicable)
  6. Key technical decisions and trade-offs
  7. Security considerations
  8. Scalability and performance strategy
  Also generate a Project Profile (profile.json) for the selected tech stack.

tools:
  - webSearch (research best practices, library choices)
  - documentWrite (write TECH_DESIGN.md, profile.json)
  - readFile (read PRD)

outputSchema:
  type: object
  properties:
    techStack:
      type: object
      properties:
        language: { type: string }
        framework: { type: string }
        database: { type: string }
        buildTool: { type: string }
    modules:
      type: array
      items:
        type: object
        properties:
          name: { type: string }
          responsibility: { type: string }
    apis:
      type: array
      items:
        type: object
        properties:
          method: { type: string }
          path: { type: string }
          description: { type: string }
    profileId: { type: string }
    keyDecisions: { type: array, items: { type: string } }
```

### Coder Agent — 代码实现

```yaml
name: Coder Agent
model: claude-sonnet-4-6
purpose: Implement code based on tech design and profile

input:
  - Tech Design (docs/TECH_DESIGN.md)
  - Project Profile (.yielddi/profile.json)
  - Existing project files (if any)

output:
  format: source-code-files
  artifacts:
    - (variable, depends on tech stack)

systemPrompt: |
  Dynamically injected based on Project Profile.
  See profile-system.md → Dynamic Prompt Injection.

tools:
  - readFile
  - writeFile
  - searchCode
  - runCommand (build, test, lint, dev)
  - git (commit, branch)
```

### QA Agent — 测试验证

```yaml
name: QA Agent
model: claude-sonnet-4-6
purpose: Generate tests, run tests, review code

input:
  - Tech Design (docs/TECH_DESIGN.md)
  - Source code files
  - Project Profile

output:
  format: mixed
  artifacts:
    - test files (in profile.conventions.testDir)
    - docs/TEST_REPORT.md

systemPrompt: |
  Dynamically injected based on Project Profile qa hints.
  Your job:
  1. Review code for bugs, security issues, best practice violations
  2. Generate unit tests for core logic
  3. Generate integration tests for API endpoints
  4. Run all tests and report results
  5. Report code review findings

tools:
  - readFile
  - writeFile
  - runCommand (test, lint)
  - runTests (profile-specific test runner)

outputSchema:
  type: object
  properties:
    testResults:
      type: object
      properties:
        total: { type: number }
        passed: { type: number }
        failed: { type: number }
        coverage: { type: number }
    codeReviewFindings:
      type: array
      items:
        type: object
        properties:
          severity: { enum: [critical, warning, info] }
          file: { type: string }
          line: { type: number }
          message: { type: string }
```

### DevOps Agent — 上线部署

```yaml
name: DevOps Agent
model: claude-sonnet-4-6
purpose: Build, package, deploy

input:
  - Tested source code
  - Project Profile
  - Deploy target (user-specified)

output:
  format: mixed
  artifacts:
    - Dockerfile (if docker)
    - CI/CD config (.github/workflows/*.yml)
    - deploy scripts
    - docs/DEPLOY.md

systemPrompt: |
  Dynamically injected based on Project Profile devops hints.
  Your job:
  1. Generate Dockerfile (multi-stage build optimized for profile)
  2. Generate CI/CD pipeline config
  3. Generate deployment scripts
  4. Run build and verify artifact
  5. Document deployment procedure

tools:
  - readFile
  - writeFile
  - runCommand (build, docker, deploy)
  - git (push, tag)
```

## Workflow Engine

```typescript
interface WorkflowRun {
  id: string
  projectId: string
  stages: StageState[]
  currentStage: number
  status: "running" | "paused" | "completed" | "failed"
}

interface StageState {
  stage: "requirements" | "architecture" | "coding" | "testing" | "deployment"
  status: "pending" | "running" | "review" | "approved" | "rejected" | "failed"
  agentRunId?: string
  artifacts: string[]
  startedAt?: string
  completedAt?: string
  reviewNotes?: string
}

// Execution flow
class WorkflowEngine {
  async runStage(workflow: WorkflowRun, stageIndex: number) {
    const stage = workflow.stages[stageIndex]
    stage.status = "running"

    // 1. Gather context from previous stages
    const context = this.gatherContext(workflow, stageIndex)

    // 2. Get the right agent for this stage
    const agent = this.getAgentForStage(stage.stage)

    // 3. Run agent with context
    const result = await agent.run(context, {
      // Stream output to UI
      onToken: (token) => emit("agent:stream", { token }),
      onToolUse: (tool) => emit("agent:tool", { tool }),
    })

    // 4. Collect artifacts
    stage.artifacts = result.artifacts
    stage.status = "review"  // Pause for user review

    // 5. Wait for user approval
    // (UI calls approveStage() or rejectStage())
  }

  approveStage(workflow: WorkflowRun, stageIndex: number) {
    workflow.stages[stageIndex].status = "approved"
    // Auto-advance to next stage
    if (stageIndex < workflow.stages.length - 1) {
      this.runStage(workflow, stageIndex + 1)
    }
  }

  rejectStage(workflow: WorkflowRun, stageIndex: number, notes: string) {
    workflow.stages[stageIndex].status = "rejected"
    workflow.stages[stageIndex].reviewNotes = notes
    // Re-run current stage with feedback
    this.runStage(workflow, stageIndex)
  }
}
```

## Communication Flow

```
User Input (UI)
    │
    ▼
WorkflowEngine.runStage()
    │
    ▼
Agent.run(context)
    │
    ├── onToken ──────────► Tauri Event ──► React State Update (chat)
    ├── onToolUse ────────► Tauri Event ──► React State Update (tool display)
    ├── fileWrite ────────► Tauri Event ──► Monaco Model Update
    └── onComplete ───────► Stage Review Panel (approve/reject)
```
