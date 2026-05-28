# cc-devloop 项目进度记录

> 最后更新：2026-05-27
> 项目命名：cc-devloop (Claude Code Dev Loop)
> 项目路径：/Users/txx/Desktop/YieldDi/cc-devloop
> GitHub：https://github.com/YieldDi/cc-devloop
> 当前阶段：Phase 1 MVP 主体完成，可运行

---

## 当前进度总览

| 阶段 | 状态 | 说明 |
|------|------|------|
| 方案设计 | ✅ 已完成 | 6 份设计文档已落盘 |
| Phase 1 MVP 编码 | ✅ 主体完成 | Tauri+React+Monaco+Agent IPC 已跑通 |
| Phase 2 V1 | ⬜ 未开始 | - |
| Phase 3 V2 | ⬜ 未开始 | - |

## 已完成事项

### 2026-05-27 Phase 1 MVP 编码

- [x] 初始化 Tauri 2.0 项目（React + TypeScript + Vite）
- [x] 安装全部前端依赖（Tailwind v4, Zustand, Monaco, xterm, Tauri plugins）
- [x] 三栏布局：Sidebar(240px) | Editor(flex) | Agent Panel(360px)
- [x] Rust 文件操作 Commands：read_project_tree, read_file, write_file, select_directory
- [x] FileTree 组件：递归渲染、展开/折叠、文件图标、点击打开
- [x] Monaco Editor：多 tab、语言自动检测、自动布局
- [x] Agent Panel：聊天界面、流式输出、Send/Stop 按钮
- [x] Node.js Agent 进程：stdin/stdout JSON 协议、Rust spawn 管理
- [x] Agent 流式事件接通：Tauri event → agentStore → React UI
- [x] 终端面板：xterm.js 集成、可折叠
- [x] 应用在 Mac 上成功启动运行

### 2026-05-25 方案设计

- [x] 确定技术栈：Tauri 2.0 + React + TypeScript + Tailwind + Monaco Editor
- [x] 确定桌面架构：Rust 后端 + Node.js sidecar (Agent SDK)
- [x] 设计五阶段 Agent 工作流：PM → Architect → Coder → QA → DevOps
- [x] 设计 Project Profile 系统，支持多语言/框架自动检测
- [x] 设计 UI 布局：文件树 + Monaco 编辑器 + Agent 面板 + 终端
- [x] 设计 Agent 间 Handoff 协议（结构化 JSON 传递上下文）
- [x] 定义三阶段交付计划（MVP → V1 → V2）

## 已落盘文件

| 文件 | 内容 |
|------|------|
| [docs/SOLUTION.md](docs/SOLUTION.md) | 项目总览、架构图、技术栈选型、分阶段索引 |
| [docs/phase1-mvp.md](docs/phase1-mvp.md) | Phase 1 详细计划、项目目录结构、核心实现方案 |
| [docs/phase2-v1.md](docs/phase2-v1.md) | Phase 2 多 Agent、Workflow Engine、Git 集成 |
| [docs/phase3-v2.md](docs/phase3-v2.md) | Phase 3 插件系统、DevOps、安全沙箱 |
| [docs/profile-system.md](docs/profile-system.md) | Profile 完整 schema、内置 15+ 语言/框架、自动扫描 |
| [docs/ui-layout.md](docs/ui-layout.md) | 主界面布局、各面板功能、阶段 Review 界面 |
| [docs/agent-design.md](docs/agent-design.md) | 五个 Agent 完整定义、Workflow Engine、通信流 |

## 关键决策记录

| 决策 | 选择 | 原因 | 时间 |
|------|------|------|------|
| 桌面框架 | Tauri 2.0 | 包体小、原生性能、安全模型好 | 2026-05-25 |
| 代码编辑器 | Monaco Editor | VS Code 内核、60+ 语言内置 | 2026-05-25 |
| Agent 运行时 | Node.js sidecar | Claude Agent SDK 原生支持 | 2026-05-25 |
| 多语言适配 | Project Profile 动态注入 | Agent 本身多语言，靠 Profile 注入上下文和工具 | 2026-05-25 |
| 项目接入 | 三模式（新建/导入/克隆） | 覆盖从零开始和已有项目两种场景 | 2026-05-25 |
| Agent 通信 | 结构化 JSON + stage gate | 阶段间解耦，用户可在每步审查 | 2026-05-25 |
| 项目命名 | cc-devloop | Claude Code Dev Loop，需求→上线→迭代永不停歇 | 2026-05-25 |

## 下一步行动（Phase 1 MVP 启动）

按优先级排序：

1. **初始化 Tauri 项目**
   - `npm create tauri-app@latest`
   - 选择 React + TypeScript
   - 配置 Tailwind CSS

2. **搭建基础 UI 框架**
   - 三栏布局：Sidebar + Editor + Agent Panel
   - FileTree 组件（读取本地目录）
   - Monaco Editor 集成（多 tab、语言检测）

3. **实现 Tauri 文件操作 Commands**
   - `read_project_tree` — 读取目录结构
   - `read_file` — 读取文件内容
   - `write_file` — 写入文件
   - 范围限定在项目根目录

4. **Node.js sidecar 搭建**
   - Agent SDK 基础框架
   - 单个 Coder Agent 定义
   - 4 个基础 tools：readFile, writeFile, searchCode, runCommand
   - stdout 输出桥接到 Tauri event

5. **Agent 面板 UI**
   - 聊天界面（用户输入 + Agent 流式输出）
   - 工具调用展示
   - 变更 diff 预览 + 接受/拒绝

6. **嵌入式终端**
   - xterm.js 集成
   - Agent 可运行命令，用户也可手动输入

## 待讨论/待决策

- [ ] 是否需要用户登录/Anthropic API Key 管理？（本地存储 vs 云同步）
- [ ] Agent 执行命令的安全边界：白名单还是用户每次确认？
- [ ] 是否需要离线模式？（Agent SDK 必须联网调用 Claude API）
- [ ] 最低支持的 macOS / Windows 版本？
- [ ] 侧边栏终端 vs 底部终端，用户偏好？

---

## 更新日志

### 2026-05-25
- 项目启动，完成全部方案设计
- 6 份设计文档落盘
- 项目命名：cc-devloop (Claude Code Dev Loop)
- 项目目录初始化（仅 docs/）
