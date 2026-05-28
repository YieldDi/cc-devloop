# cc-devloop

AI-Driven Full-Lifecycle Development Desktop App — powered by Claude Agent SDK.

## What is cc-devloop?

cc-devloop (Claude Code Dev Loop) is a local desktop application for Mac & Windows that drives the complete software development lifecycle:

**Requirements → Technical Design → Coding → Testing → Deployment**

It supports multiple programming languages, frameworks, and project types through a pluggable Project Profile system.

## Features

- **AI Agent Workflow** — Multi-stage agent pipeline (PM → Architect → Coder → QA → DevOps) powered by Claude Agent SDK
- **Built-in Code Editor** — Monaco Editor (VS Code engine) with 60+ language support, multi-tab, diff view
- **File Explorer** — Recursive file tree with expand/collapse, file icons, click-to-open
- **Streaming Agent Chat** — Real-time token streaming, tool call visualization, send/stop controls
- **Embedded Terminal** — xterm.js terminal for running commands
- **Project Profiles** — Auto-detect language/framework and inject context for the agent

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | Tauri 2.0 (Rust) |
| Frontend | React 19 + TypeScript + Tailwind CSS v4 |
| State Management | Zustand |
| Code Editor | Monaco Editor |
| Agent Runtime | Node.js sidecar (Claude Agent SDK) |
| Terminal | xterm.js |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Desktop UI (React)                 │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │ FileTree  │  │  Monaco   │  │  Agent Chat Panel │ │
│  │ Sidebar   │  │  Editor   │  │  + Tool Display   │ │
│  └─────┬────┘  └─────┬─────┘  └────────┬──────────┘ │
│        └──────────────┴─────────────────┘            │
│                 Tauri IPC (invoke / events)           │
├──────────────────────────────────────────────────────┤
│                  Rust Backend (Tauri)                 │
│    File Ops · Agent Process Manager · Event Bridge    │
├──────────────────────────────────────────────────────┤
│              Node.js Agent Process                    │
│         Claude Agent SDK · stdin/stdout JSON IPC      │
└──────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22+ recommended, for `--experimental-strip-types`)
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/) (latest stable)
- [Anthropic API Key](https://console.anthropic.com/) (or compatible endpoint)

### Install

```bash
git clone https://github.com/YieldDi/cc-devloop.git
cd cc-devloop
pnpm install
```

### Development

```bash
pnpm tauri dev
```

This starts the Vite dev server (port 1420) and launches the Tauri window.

### Build

```bash
pnpm tauri build
```

Produces a platform-native installer in `src-tauri/target/release/bundle/`.

### Environment Variables

Set your API key via environment variable:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Or configure a custom endpoint:

```bash
export ANTHROPIC_AUTH_TOKEN="your-token"
export ANTHROPIC_BASE_URL="https://your-proxy.example.com/api/anthropic"
```

## Project Structure

```
cc-devloop/
├── agent/                  # Node.js Agent sidecar
│   ├── index.ts            # Agent entry point (Claude Agent SDK query())
│   └── bridge.ts           # stdin/stdout JSON IPC protocol
├── src/                    # React frontend
│   ├── components/
│   │   ├── Layout.tsx      # Three-panel grid layout
│   │   ├── Sidebar/        # FileTree, project selector
│   │   ├── Editor/         # Monaco editor, tabs, diff
│   │   ├── AgentPanel/     # Chat, streaming output, tool calls
│   │   └── Terminal/       # xterm.js terminal
│   ├── stores/             # Zustand state (project, editor, agent, UI)
│   ├── hooks/              # useAgent, useFileSystem
│   └── utils/              # Language detection, helpers
├── src-tauri/              # Rust backend (Tauri 2.0)
│   ├── src/
│   │   ├── lib.rs          # App setup, command registration
│   │   └── commands/
│   │       ├── fs.rs       # File system operations
│   │       └── agent.rs    # Agent process lifecycle
│   ├── capabilities/       # Tauri 2.0 permissions
│   └── tauri.conf.json     # Tauri configuration
├── docs/                   # Design documents
│   ├── SOLUTION.md         # Architecture overview
│   ├── phase1-mvp.md       # Phase 1 plan
│   ├── phase2-v1.md        # Phase 2 plan
│   ├── phase3-v2.md        # Phase 3 plan
│   ├── agent-design.md     # Agent definitions & workflow
│   ├── profile-system.md   # Project Profile schema
│   ├── ui-layout.md        # UI layout design
│   └── PROGRESS.md         # Live progress tracking
└── package.json
```

## Roadmap

### Phase 1 — MVP (Current)
- [x] Tauri 2.0 scaffold + React + TypeScript
- [x] Three-panel layout (FileTree | Editor | Agent)
- [x] Monaco Editor with multi-tab and language detection
- [x] File tree with recursive browsing
- [x] Agent chat panel with streaming output
- [x] Node.js agent sidecar with Claude Agent SDK
- [x] Embedded terminal (xterm.js)
- [ ] Agent communication debugging
- [ ] Diff editor for agent changes

### Phase 2 — V1
- [ ] Multi-agent workflow engine (PM → Architect → Coder → QA → DevOps)
- [ ] Project Profile system with auto-detection
- [ ] Git integration (diff, commit, branch)
- [ ] Stage gate review UI
- [ ] SQLite persistence

### Phase 3 — V2
- [ ] QA Agent (test generation, execution)
- [ ] DevOps Agent (Docker, CI/CD, deploy)
- [ ] Plugin system
- [ ] Multi-project workspace

## License

ISC
