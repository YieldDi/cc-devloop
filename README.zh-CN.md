中文 | **[English](./README.md)**

# cc-devloop

AI 驱动的全生命周期开发桌面应用 — 基于 Claude Agent SDK 构建。

## cc-devloop 是什么？

cc-devloop（Claude Code Dev Loop）是一款面向 Mac 和 Windows 的本地桌面应用，驱动完整的软件开发生命周期：

**需求分析 → 技术设计 → 代码实现 → 测试验证 → 部署上线**

通过可插拔的 Project Profile 系统，支持多种编程语言、框架和项目类型。

## 功能特性

- **AI Agent 工作流** — 基于 Claude Agent SDK 的多阶段 Agent 流水线（PM → 架构师 → 程序员 → QA → DevOps）
- **内置代码编辑器** — Monaco Editor（VS Code 内核），支持 60+ 语言语法高亮、多标签页、Diff 视图
- **文件浏览器** — 递归文件树，支持展开/折叠、文件图标、点击打开
- **流式 Agent 对话** — 实时 Token 流式输出、工具调用可视化、发送/停止控制
- **嵌入式终端** — 基于 xterm.js 的终端面板，可运行命令
- **项目配置文件** — 自动检测语言/框架，为 Agent 注入项目上下文

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri 2.0 (Rust) |
| 前端 | React 19 + TypeScript + Tailwind CSS v4 |
| 状态管理 | Zustand |
| 代码编辑器 | Monaco Editor |
| Agent 运行时 | Node.js sidecar (Claude Agent SDK) |
| 终端 | xterm.js |

## 系统架构

```
┌──────────────────────────────────────────────────────┐
│                    桌面 UI (React)                     │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │  文件树    │  │  Monaco   │  │  Agent 对话面板   │ │
│  │  侧边栏   │  │  编辑器    │  │  + 工具调用展示   │ │
│  └─────┬────┘  └─────┬─────┘  └────────┬──────────┘ │
│        └──────────────┴─────────────────┘            │
│              Tauri IPC (invoke / events)              │
├──────────────────────────────────────────────────────┤
│                 Rust 后端 (Tauri)                     │
│     文件操作 · Agent 进程管理 · 事件桥接               │
├──────────────────────────────────────────────────────┤
│              Node.js Agent 进程                       │
│       Claude Agent SDK · stdin/stdout JSON IPC        │
└──────────────────────────────────────────────────────┘
```

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/)（推荐 v22+，支持 `--experimental-strip-types`）
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/)（最新稳定版）
- [Anthropic API Key](https://console.anthropic.com/)（或兼容的 API 端点）

### 安装

```bash
git clone https://github.com/YieldDi/cc-devloop.git
cd cc-devloop
pnpm install
```

### 开发

```bash
pnpm tauri dev
```

启动 Vite 开发服务器（端口 1420）并打开 Tauri 窗口。

### 构建

```bash
pnpm tauri build
```

在 `src-tauri/target/release/bundle/` 生成平台原生安装包。

### 环境变量

通过环境变量设置 API Key：

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

或配置自定义 API 端点：

```bash
export ANTHROPIC_AUTH_TOKEN="your-token"
export ANTHROPIC_BASE_URL="https://your-proxy.example.com/api/anthropic"
```

## 项目结构

```
cc-devloop/
├── agent/                  # Node.js Agent sidecar
│   ├── index.ts            # Agent 入口（Claude Agent SDK query()）
│   └── bridge.ts           # stdin/stdout JSON IPC 通信协议
├── src/                    # React 前端
│   ├── components/
│   │   ├── Layout.tsx      # 三栏网格布局
│   │   ├── Sidebar/        # 文件树、项目选择器
│   │   ├── Editor/         # Monaco 编辑器、标签页、Diff
│   │   ├── AgentPanel/     # 对话、流式输出、工具调用
│   │   └── Terminal/       # xterm.js 终端
│   ├── stores/             # Zustand 状态管理（项目、编辑器、Agent、UI）
│   ├── hooks/              # useAgent、useFileSystem
│   └── utils/              # 语言检测、辅助工具
├── src-tauri/              # Rust 后端（Tauri 2.0）
│   ├── src/
│   │   ├── lib.rs          # 应用初始化、命令注册
│   │   └── commands/
│   │       ├── fs.rs       # 文件系统操作
│   │       └── agent.rs    # Agent 进程生命周期管理
│   ├── capabilities/       # Tauri 2.0 权限配置
│   └── tauri.conf.json     # Tauri 配置
├── docs/                   # 设计文档
│   ├── SOLUTION.md         # 架构总览
│   ├── phase1-mvp.md       # 第一阶段计划
│   ├── phase2-v1.md        # 第二阶段计划
│   ├── phase3-v2.md        # 第三阶段计划
│   ├── agent-design.md     # Agent 定义与工作流
│   ├── profile-system.md   # Project Profile 方案
│   ├── ui-layout.md        # UI 布局设计
│   └── PROGRESS.md         # 实时进度追踪
└── package.json
```

## 路线图

### 第一阶段 — MVP（当前）
- [x] Tauri 2.0 脚手架 + React + TypeScript
- [x] 三栏布局（文件树 | 编辑器 | Agent）
- [x] Monaco Editor 多标签页 + 语言自动检测
- [x] 递归文件树浏览器
- [x] Agent 对话面板 + 流式输出
- [x] Node.js Agent sidecar（Claude Agent SDK）
- [x] 嵌入式终端（xterm.js）
- [ ] Agent 通信链路调试
- [ ] Diff 编辑器（Agent 变更预览）

### 第二阶段 — V1
- [ ] 多 Agent 工作流引擎（PM → 架构师 → 程序员 → QA → DevOps）
- [ ] Project Profile 系统 + 语言/框架自动检测
- [ ] Git 集成（Diff、提交、分支）
- [ ] 阶段审查 UI
- [ ] SQLite 持久化

### 第三阶段 — V2
- [ ] QA Agent（测试生成、执行）
- [ ] DevOps Agent（Docker、CI/CD、部署）
- [ ] 插件系统
- [ ] 多项目工作区

## 许可证

ISC
