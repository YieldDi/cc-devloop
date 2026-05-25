# cc-devloop — AI-Driven Full-Lifecycle Development Desktop App

## Vision

cc-devloop (Claude Code Dev Loop) — A local desktop application (Mac & Windows) powered by Claude Agent SDK that drives the complete software development lifecycle: requirements → technical design → coding → testing → deployment.

Supports multiple programming languages, frameworks, and project types.

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Desktop UI (React)                 │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ │
│  │项目选择器│ │需求编辑器 │ │Monaco   │ │运行面板   │ │
│  │新建/导入 │ │Markdown  │ │编辑器    │ │终端/日志  │ │
│  └────┬────┘ └────┬─────┘ └────┬────┘ └────┬─────┘ │
│       └───────────┴───────────┴────────────┘        │
│                   Workflow Engine                     │
├──────────────────────────────────────────────────────┤
│              Profile Layer                            │
│  Scanner → Matcher → Profile Registry → Injector     │
├──────────────────────────────────────────────────────┤
│           Agent SDK Layer (multi-agent)               │
│                                                      │
│  PM Agent → Architect Agent → Coder Agent            │
│                                  ↑ dynamic tools     │
│              QA Agent → DevOps Agent                  │
├──────────────────────────────────────────────────────┤
│           Runtime Layer (Language Runtimes)           │
│  JVM │ Node │ Python │ Go │ Rust │ .NET │ PHP        │
├──────────────────────────────────────────────────────┤
│           Infrastructure Layer                        │
│  Git │ Docker │ K8s │ SSH │ Cloud CLI                │
└──────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Desktop | Tauri 2.0 | ~10MB bundle, native performance, Mac+Windows |
| Frontend | React + TypeScript + Tailwind + Zustand | Ecosystem, Monaco integration |
| Code Editor | Monaco Editor | VS Code engine, 60+ languages built-in |
| Agent Runtime | Node.js sidecar | Claude Agent SDK runs in Node |
| Agent SDK | Claude Agent SDK (@anthropic-ai/agent-sdk) | Multi-agent orchestration |
| Storage | SQLite (Tauri plugin) | Project state, workflow history |
| IPC | Tauri Event System | Stream agent output to UI |

## Phased Plan

- [Phase 1 - MVP](./phase1-mvp.md) (2-3 weeks): Single Coder Agent, Tauri scaffold, Monaco editor, basic file ops
- [Phase 2 - V1](./phase2-v1.md) (4-6 weeks): Full multi-agent workflow, Project Profile system, Git integration
- [Phase 3 - V2](./phase3-v2.md) (ongoing): QA/DevOps agents, Docker, CI/CD integration, plugin system
