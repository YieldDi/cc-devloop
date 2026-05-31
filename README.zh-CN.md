中文 | **[English](./README.md)**

# cc-devloop

AI 驱动的全生命周期开发桌面应用 — 基于 Claude Agent SDK 构建。

**[下载 v0.1.0 macOS 版 (Apple Silicon)](https://github.com/YieldDi/cc-devloop/releases/tag/v0.1.0)**

## cc-devloop 是什么？

cc-devloop（Claude Code Dev Loop）是一款面向 Mac 和 Windows 的本地桌面应用，驱动完整的软件开发生命周期：

**需求分析 → 技术设计 → 代码实现 → 测试验证 → 部署上线**

通过可插拔的 Project Profile 系统，支持多种编程语言、框架和项目类型。

## 功能特性

- **AI Agent 对话** — 流式输出、工具调用可视化、Markdown 渲染
- **代码编辑器** — Monaco Editor（VS Code 内核），支持 60+ 语言、多标签页、Diff 视图
- **文件浏览器** — 懒加载文件树、右键菜单（新建/重命名/删除）、可拖拽调整宽度
- **嵌入式终端** — 多 Tab 终端，基于 xterm.js + PTY
- **Git Diff 查看器** — 目录树 + 并排对比 + 行数统计 + 导航 + 跳转编辑
- **Agent Diff 审核** — Agent 写文件后弹出 Accept/Reject diff
- **快捷键** — ⌘P 快速打开、⌘⇧F 全局搜索、⌘` 终端切换、⌘/ 快捷键帮助
- **自定义设置** — 主题、字体大小、快捷键绑定
- **欢迎界面** — 最近项目列表，一键切换项目
- **文件监听** — 自动检测外部修改并刷新

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
│   │   ├── WelcomeScreen.tsx # 欢迎界面 + 历史项目
│   │   ├── Sidebar/        # 文件树、设置面板
│   │   ├── Editor/         # Monaco 编辑器、标签页、Diff
│   │   ├── AgentPanel/     # 对话、流式输出、工具调用
│   │   ├── Terminal/       # xterm.js 多 Tab 终端
│   │   ├── GitChanges.tsx  # Git Diff 查看器弹窗
│   │   ├── CommandPalette.tsx # 快速打开（⌘P）
│   │   └── GlobalSearch.tsx   # 全局搜索（⌘⇧F）
│   ├── stores/             # Zustand 状态管理（项目、编辑器、Agent、终端、快捷键、主题）
│   ├── hooks/              # useAgent、useKeyboardShortcuts、useThemeEffect
│   └── utils/              # 语言检测、辅助工具
├── src-tauri/              # Rust 后端（Tauri 2.0）
│   ├── src/
│   │   ├── lib.rs          # 应用初始化、命令注册
│   │   └── commands/
│   │       ├── fs.rs       # 文件系统操作
│   │       ├── agent.rs    # Agent 进程生命周期管理
│   │       ├── terminal.rs # 多终端 PTY 管理
│   │       ├── git.rs      # Git 状态、Diff、提交
│   │       └── watcher.rs  # 文件系统监听
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

### 第一阶段 — MVP ✅ 已完成
- [x] Tauri 2.0 脚手架 + React + TypeScript
- [x] 三栏布局（文件树 | 编辑器 | Agent）
- [x] Monaco Editor 多标签页 + 语言自动检测
- [x] 懒加载文件树 + 右键菜单
- [x] Agent 对话面板 + 流式输出
- [x] Node.js Agent sidecar（Claude Agent SDK）
- [x] 多 Tab 终端（xterm.js）
- [x] Git Diff 查看器弹窗 + 导航
- [x] Agent Diff 审核（Accept/Reject）
- [x] 快捷键系统 + 自定义绑定
- [x] 欢迎界面 + 历史项目
- [x] 设置面板（主题、编辑器、快捷键）
- [x] 文件监听自动刷新
- [x] Agent 崩溃通知

### 第二阶段 — V1（下一步）
- [ ] 多 Agent 工作流引擎（PM → 架构师 → 程序员 → QA → DevOps）
- [ ] Project Profile 系统 + 语言/框架自动检测
- [ ] Git 集成增强（分支管理、历史记录）
- [ ] 阶段审查 UI
- [ ] SQLite 持久化

### 第三阶段 — V2
- [ ] QA Agent（测试生成、执行）
- [ ] DevOps Agent（Docker、CI/CD、部署）
- [ ] 插件系统
- [ ] 多项目工作区

## 许可证

[MIT](./LICENSE)
