**[中文](./README.zh-CN.md)** | English

# cc-devloop

AI-Driven Full-Lifecycle Development Desktop App — powered by Claude Agent SDK.

**[Download v0.1.0 for macOS (Apple Silicon)](https://github.com/YieldDi/cc-devloop/releases/tag/v0.1.0)**

## What is cc-devloop?

cc-devloop (Claude Code Dev Loop) is a local desktop application for Mac & Windows that drives the complete software development lifecycle:

**Requirements → Technical Design → Coding → Testing → Deployment**

It supports multiple programming languages, frameworks, and project types through a pluggable Project Profile system.

## Features

- **AI Agent Chat** — Streaming output, tool call visualization, Markdown rendering
- **Code Editor** — Monaco Editor (VS Code engine) with 60+ language support, multi-tab, diff view
- **File Explorer** — Lazy-loaded file tree with context menu (new/rename/delete), resizable sidebar
- **Embedded Terminal** — Multi-tab terminal powered by xterm.js + PTY
- **Git Diff Viewer** — Directory-organized file tree + side-by-side diff + line stats + navigation + jump-to-edit
- **Agent Diff Review** — Accept/Reject diffs when agent writes files
- **Keyboard Shortcuts** — ⌘P quick open, ⌘⇧F global search, ⌘` terminal toggle, ⌘/ shortcuts help
- **Customizable Settings** — Theme, font size, keyboard bindings
- **Welcome Screen** — Recent projects list, one-click project switching
- **File Watcher** — Auto-detect external file changes and refresh

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
│   │   ├── WelcomeScreen.tsx # Welcome screen with recent projects
│   │   ├── Sidebar/        # FileTree, SettingsPanel
│   │   ├── Editor/         # Monaco editor, tabs, diff
│   │   ├── AgentPanel/     # Chat, streaming output, tool calls
│   │   ├── Terminal/       # xterm.js multi-tab terminal
│   │   ├── GitChanges.tsx  # Git diff viewer modal
│   │   ├── CommandPalette.tsx # Quick open (⌘P)
│   │   └── GlobalSearch.tsx   # Global search (⌘⇧F)
│   ├── stores/             # Zustand state (project, editor, agent, terminal, shortcuts, theme)
│   ├── hooks/              # useAgent, useKeyboardShortcuts, useThemeEffect
│   └── utils/              # Language detection, helpers
├── src-tauri/              # Rust backend (Tauri 2.0)
│   ├── src/
│   │   ├── lib.rs          # App setup, command registration
│   │   └── commands/
│   │       ├── fs.rs       # File system operations
│   │       ├── agent.rs    # Agent process lifecycle
│   │       ├── terminal.rs # Multi-terminal PTY management
│   │       ├── git.rs      # Git status, diff, commit
│   │       └── watcher.rs  # File system watcher
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

### Phase 1 — MVP ✅ Completed
- [x] Tauri 2.0 scaffold + React + TypeScript
- [x] Three-panel layout (FileTree | Editor | Agent)
- [x] Monaco Editor with multi-tab and language detection
- [x] Lazy-loaded file tree with context menu
- [x] Agent chat panel with streaming output
- [x] Node.js agent sidecar with Claude Agent SDK
- [x] Multi-tab terminal (xterm.js)
- [x] Git diff viewer modal with navigation
- [x] Agent diff review (Accept/Reject)
- [x] Keyboard shortcuts + customizable bindings
- [x] Welcome screen with recent projects
- [x] Settings panel (theme, editor, shortcuts)
- [x] File watcher auto-refresh
- [x] Agent crash notification

### Phase 2 — V1 (Next)
- [ ] Multi-agent workflow engine (PM → Architect → Coder → QA → DevOps)
- [ ] Project Profile system with auto-detection
- [ ] Git integration enhancement (branch management, history)
- [ ] Stage gate review UI
- [ ] SQLite persistence

### Phase 3 — V2
- [ ] QA Agent (test generation, execution)
- [ ] DevOps Agent (Docker, CI/CD, deploy)
- [ ] Plugin system
- [ ] Multi-project workspace

## License

[MIT](./LICENSE)
