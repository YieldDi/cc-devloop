# Phase 1 — MVP

**Duration:** 2-3 weeks
**Goal:** Tauri + React scaffold, Monaco editor, single Coder Agent, file read/write

## Scope

- Tauri 2.0 project init with React + TypeScript + Tailwind
- Monaco Editor integration with multi-tab, syntax highlighting for 10+ languages
- File tree sidebar (read project directory from local filesystem)
- Node.js sidecar process running Claude Agent SDK
- Single Coder Agent: read file, write file, search code, run terminal commands
- Tauri IPC bridge: agent stream → UI real-time update
- SQLite for project metadata persistence
- Basic workflow status bar (no full workflow engine yet)

## Project Structure

```
yielddi/
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/           # Tauri IPC commands
│   │   │   ├── fs.rs           # file read/write/tree
│   │   │   ├── project.rs      # project CRUD
│   │   │   └── agent.rs        # sidecar lifecycle
│   │   └── sidecar/            # Node.js agent runner
│   │       ├── index.ts        # entry point
│   │       ├── agent.ts        # Coder Agent definition
│   │       ├── tools/
│   │       │   ├── readFile.ts
│   │       │   ├── writeFile.ts
│   │       │   ├── searchCode.ts
│   │       │   └── runCommand.ts
│   │       └── bridge.ts       # Tauri event emit to UI
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                        # React frontend
│   ├── App.tsx
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Sidebar/
│   │   │   ├── FileTree.tsx
│   │   │   └── WorkflowStatus.tsx
│   │   ├── Editor/
│   │   │   ├── CodeEditor.tsx      # Monaco wrapper
│   │   │   ├── DiffEditor.tsx      # Monaco diff view
│   │   │   └── EditorTabs.tsx
│   │   ├── AgentPanel/
│   │   │   ├── ChatPanel.tsx       # agent conversation UI
│   │   │   └── StreamOutput.tsx    # streaming token display
│   │   └── Terminal/
│   │       └── Terminal.tsx        # xterm.js embedded terminal
│   ├── stores/
│   │   ├── projectStore.ts
│   │   ├── editorStore.ts
│   │   └── agentStore.ts
│   ├── hooks/
│   │   ├── useAgent.ts
│   │   └── useFileSystem.ts
│   └── utils/
│       └── languageDetect.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Key Implementations

### 1. Tauri + Sidecar Communication

```
React UI ←→ Tauri IPC ←→ Rust Commands ←→ Node.js Sidecar (Agent SDK)
                ↑
          Tauri Events (agent stream push to UI)
```

- Sidecar runs as a managed child process via Tauri
- Agent SDK streams tokens → sidecar writes to stdout → Rust parses → Tauri event → React state update
- File operations go through Tauri IPC commands (security: scoped to project directory)

### 2. Monaco Editor

- `@monaco-editor/react` wrapper
- Multi-tab: file path as Monaco model key, switch tabs without losing state
- `automaticLayout: true` for panel resize
- Diff view for agent changes: user sees before/after, accept or reject
- Agent writes: real-time model update + auto-scroll to bottom

### 3. Coder Agent (single agent for MVP)

```typescript
const coderAgent = new Agent({
  name: "coder",
  model: "claude-sonnet-4-6",
  systemPrompt: `You are a senior software engineer...`,
  tools: [
    readFileTool,      // read file content from project dir
    writeFileTool,     // write/create file in project dir
    searchCodeTool,    // grep/ripgrep across project
    runCommandTool,    // execute build/test/lint commands
  ],
  // all tools are scoped to the project root directory
})
```

## Deliverables

- [ ] Tauri app launches on Mac
- [ ] User can open/select a local project directory
- [ ] File tree shows project structure
- [ ] Click file → opens in Monaco with correct language highlighting
- [ ] Agent chat panel: user describes what to build
- [ ] Agent generates code, files appear in file tree
- [ ] Editor auto-updates as agent writes
- [ ] Diff view for changes to existing files
- [ ] Basic terminal panel for build/test output
