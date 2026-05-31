# cc-devloop 项目进度记录

> 最后更新：2026-05-31
> 项目命名：cc-devloop (Claude Code Dev Loop)
> 项目路径：/Users/txx/Desktop/YieldDi/cc-devloop
> GitHub：https://github.com/YieldDi/cc-devloop
> 当前阶段：Phase 1 MVP — 功能完善收尾中

---

## 当前进度总览

| 阶段 | 状态 | 说明 |
|------|------|------|
| 方案设计 | ✅ 已完成 | 6 份设计文档已落盘 |
| Phase 1 MVP 编码 | ✅ 主体完成 | 全部核心功能已实现，收尾打磨中 |
| Phase 2 V1 | ⬜ 未开始 | - |
| Phase 3 V2 | ⬜ 未开始 | - |

## 已完成事项

### 2026-05-31 MVP 完善 & Git Diff 查看器

- [x] Git diff 查看器：弹窗式 diff 界面
  - 左侧目录树（按文件目录组织，带 M/A/D/U 状态标识）
  - 右侧 Monaco DiffEditor 并排对比
  - 每个文件旁显示 +added/-deleted 行数统计
  - 上一个/下一个文件导航（与目录树排序一致）
  - 上一个/下一个 diff 块跳转
  - Edit 按钮直接跳转到源代码编辑器
- [x] 多终端 Tab 支持
  - 前端生成 PTY ID，解决 Tauri IPC 时序问题
  - Tab 名称自动编号（Terminal 1, Terminal 2...）
  - 终端内容通过 CSS height 切换保持，不再丢失历史输出
- [x] 快捷键系统
  - ⌘P 快速打开、⌘⇧F 全局搜索、⌘` 终端切换、⌘/ 快捷键帮助
  - 设置中支持自定义快捷键绑定
  - 持久化到 localStorage
- [x] 设置面板重构
  - 居中弹窗布局，左侧分类导航（外观、编辑器、快捷键、关于）
  - 快捷键管理：查看、修改、重置
- [x] 文件树增强
  - 右键上下文菜单（新建文件/文件夹、重命名、删除）
  - 工具栏新建按钮
  - 可拖拽调整侧边栏宽度（160-480px）
- [x] 文件监听器（notify crate）
  - 自动检测文件变化并刷新文件树
  - 已打开文件自动重载（非脏文件）
  - 300ms 防抖
- [x] 欢迎界面
  - 应用启动时显示欢迎页，支持选择项目
  - 最近项目列表（最多 10 个，持久化）
  - 从 Layout 返回欢迎页
- [x] 终端修复
  - 修复无法输入输出（listener 注册时序问题）
  - 修复 React strict mode 双重挂载问题
  - 修复隐藏后内容丢失（CSS 切换替代条件渲染）
  - 修复多 Tab 命名问题
- [x] 修复 git status porcelain 解析（trim() 截断路径首字符）
- [x] 修复 Tauri invoke 参数命名（camelCase 约定）
- [x] 移除窗口关闭拦截，应用正常关闭

### 2026-05-30 文件树自动刷新 & Agent 修复

- [x] 修复 Agent 写入文件后文件树不自动刷新的问题
  - 根因：ChatInput.tsx 有独立的 agent 消息处理，绕过了 useAgent hook
  - ChatInput 的 tool_use 处理缺少 id 透传（用 randomUUID 替代了真实 id），导致 tool_result 匹配不上
  - 文件在项目根目录时 parentDir === projectRoot，refreshDir 找不到树节点
- [x] ChatInput.tsx 添加完整的文件变更追踪逻辑（pendingFileChanges map）
- [x] projectStore.refreshRoot 改为增量合并，保留已展开目录的 children
- [x] projectStore.refreshDir 增加回退注入逻辑，处理目录首次展开场景
- [x] agent/index.ts 补充 tool_use 消息的 id 字段转发

### 2026-05-30 图标更新 & 项目配置

- [x] 重新设计应用图标：渐变圆环 + 中心金星 + 右上角小星点缀
- [x] 去掉旧图标的 "cc" 文字和箭头尖，整体居中
- [x] 重新生成全平台图标（PNG/ICNS/ICO/AppX/iOS/Android）
- [x] cargo clean + 全量重编译验证图标生效
- [x] 创建 CLAUDE.md 项目指引文件（架构、命令、协议说明）
- [x] 添加 MIT 开源协议

### 2026-05-29 Phase 1 MVP 功能完善

- [x] Agent 上下文管理（SDK resume session，支持多轮对话）
- [x] Agent 写文件后自动刷新（FileTree + Monaco 编辑器）
- [x] Diff Editor 集成（side-by-side 对比，Accept/Reject）
- [x] 聊天面板重构（Claude Desktop 风格：Markdown 渲染、工具调用卡片、胶囊输入框）

### 2026-05-28 Phase 1 MVP 修复与优化

- [x] 修复 Agent 通信链路：路径多策略解析、环境变量传递、启动/发送分离
- [x] 文件树改为懒加载（点击展开时才读取子目录）
- [x] 新增 Rust 命令：read_dir_children, read_project_tree_full, is_agent_running
- [x] agent model 从环境变量 ANTHROPIC_MODEL 读取（适配代理端点）
- [x] 修复 TypeScript 编译错误
- [x] 生成中英文 README 并推送
- [x] 集成测试：验证 Agent 能否正常对话

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

## 下一步行动（Phase 1 收尾 → Phase 2）

1. **Agent 稳定性增强**
   - Agent 进程异常退出时 UI 提示
   - 错误边界处理优化

2. **Phase 2 V1 规划启动**
   - 多 Agent 工作流引擎设计
   - Project Profile 自动检测系统
   - Git 集成增强（diff、commit、branch 管理）

## 待讨论/待决策

- [ ] 是否需要用户登录/Anthropic API Key 管理？（本地存储 vs 云同步）
- [ ] Agent 执行命令的安全边界：白名单还是用户每次确认？
- [ ] 是否需要离线模式？（Agent SDK 必须联网调用 Claude API）
- [ ] 最低支持的 macOS / Windows 版本？

---

## 更新日志

### 2026-05-31
- Git diff 查看器弹窗（目录树 + Monaco DiffEditor + 统计 + 导航 + 编辑跳转）
- 多终端 Tab 支持，修复终端输入输出和内容保持问题
- 快捷键系统（⌘P/⌘⇧F/⌘`/⌘/）+ 设置中自定义
- 设置面板重构为居中弹窗 + 分类导航
- 文件树右键菜单（新建/重命名/删除）+ 可拖拽侧边栏
- 文件监听器自动刷新
- 欢迎界面 + 最近项目列表
- 修复 git status porcelain 路径解析 bug
- 修复 Tauri invoke 参数命名约定
- 移除窗口关闭拦截

### 2026-05-30
- 重新设计应用图标（渐变圆环 + 中心金星）
- 全平台图标重新生成（PNG/ICNS/ICO/iOS/Android）
- 创建 CLAUDE.md 项目指引
- 修复 Agent 写入文件后文件树不自动刷新
  - 修复 ChatInput.tsx tool_use id 未透传问题
  - 修复 parentDir === projectRoot 时 refreshDir 无效问题
  - refreshRoot 改为增量合并保留已展开子树

### 2026-05-28
- 代码已推送到 GitHub (commit 5c00540)
- 安装 desktop-commander MCP，获得终端执行能力
- 确认 MVP 基本可运行，发现两个待修复问题
- Agent 通信链路修复

### 2026-05-27
- Phase 1 MVP 核心编码完成
- 全部基础功能跑通

### 2026-05-25
- 项目启动，完成全部方案设计
- 6 份设计文档落盘
- 项目命名：cc-devloop (Claude Code Dev Loop)
- 项目目录初始化（仅 docs/）
