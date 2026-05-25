# UI Layout Design

## Main Window Layout

```
┌─ Menu Bar: 项目(P) │ 工作流(W) │ 设置(S) ──────────────────────────┐
│                                                                      │
│ ┌─ Sidebar ─┬────────── Editor Area ────────────┬─── Agent Panel ──┐ │
│ │           │ Tab: UserService.java × │         │                  │ │
│ │ ▼ src     │ Tab: pom.xml         × │         │ 🤖 Coder Agent   │ │
│ │  ▼ main   │──────────────────────────│        │                  │ │
│ │   ▷ java  │                         │        │ 正在生成           │ │
│ │    App.j  │  public class App {     │        │ UserService...    │ │
│ │    Conf.  │    @Autowired           │        │                  │ │
│ │  ▷ res    │    private UserRepo repo│        │ ✓ 创建 3 个文件   │ │
│ │  ▷ test   │                         │        │ ✓ 修改 1 个文件   │ │
│ │           │    public User getUser( │        │                  │ │
│ │ ─────── │    String id) {          │        │ ┌─ 变更预览 ─────┐│ │
│ │           │      return repo        │        │ │ - import ...   ││ │
│ │ ● 需求    │        .findById(id)    │        │ │ + @Service     ││ │
│ │ ● 方案    │        .orElseThrow();  │        │ │ + public class ││ │
│ │ ○ 编码 ← │    }                    │        │ └────────────────┘│ │
│ │ ○ 测试   │  }                      │        │                  │ │
│ │ ○ 上线   │                         │        │ [接受变更] [拒绝] │ │
│ │           │──────────────────────────│        │                  │ │
│ │ ─────── │ ▶ Terminal              │        │ 💬 输入框...      │ │
│ │           │ $ mvn test              │        │                  │ │
│ │ Proj Info │ BUILD SUCCESS           │        │                  │ │
│ │ Java 17   │ Tests run: 12          │        │                  │ │
│ │ Spring 3. │ Failures: 0            │        │                  │ │
│ └───────────┴─────────────────────────┴──────────────────────────┘ │
│ ── Status: Java │ Spring Boot │ UTF-8 │ Ln 15, Col 8 │ Agent: Run ── │
└──────────────────────────────────────────────────────────────────────┘
```

## Sidebar Tabs

### File Tree Tab
- Expandable directory tree
- File icons by type (language-aware)
- Right-click context menu: New File, New Folder, Delete, Rename
- Modified files highlighted (git status)

### Workflow Tab
- 5-stage progress indicator: 需求 → 方案 → 编码 → 测试 → 上线
- Current stage highlighted
- Click stage to view artifacts
- Stage status: pending / in-progress / completed / needs-review

### Project Info Tab
- Project name, path
- Detected Profile (language, framework, build tool)
- Runtime version
- Git branch/status

## Editor Area

### Multi-Tab System
- Tabs for each open file
- Modified indicator (dot on tab)
- Close button per tab
- Right-click: Close Others, Close All, Close Saved

### Monaco Editor Features
- Syntax highlighting (60+ languages)
- Line numbers
- Minimap
- Bracket matching, auto-closing
- Code folding
- Search & replace (Ctrl+F / Ctrl+H)
- Go to definition (if applicable)
- Diff view (side-by-side or inline) for agent changes

### Bottom Panel (Terminal)
- xterm.js embedded terminal
- Tabs: Terminal, Problems, Output
- Agent can run commands and display output here
- User can also type commands manually

## Agent Panel

### Chat Interface
- Message history (user + agent)
- Agent streaming output (token by token)
- Tool use display (collapsible sections):
  ```
  📄 Reading file: src/main/java/UserService.java
  🔍 Searching: "UserRepository"
  ✏️ Writing file: src/main/java/UserService.java
  ▶ Running: mvn test
  ```
- Code blocks with syntax highlighting in chat

### Change Review
- When agent modifies files, show diff preview
- Accept / Reject buttons per file change
- Bulk accept/reject for all changes in a turn

### Input Area
- Multi-line text input
- Attach context: reference files, paste errors
- Quick actions: "继续", "重试", "回滚"

## Welcome / Dashboard

Shown when no project is open:

```
┌──────────────────────────────────────────────┐
│                                              │
│           YieldDi                            │
│     AI 驱动的全流程开发工具                    │
│                                              │
│   ┌──────────┐  ┌──────────┐                │
│   │  新建项目  │  │  打开项目  │               │
│   └──────────┘  └──────────┘                │
│   ┌──────────┐                               │
│   │ 克隆仓库  │                               │
│   └──────────┘                               │
│                                              │
│   最近项目:                                    │
│   📁 user-service-api    (Java Spring Boot)  │
│   📁 admin-dashboard     (Next.js)           │
│   📁 data-pipeline       (Python)            │
│                                              │
└──────────────────────────────────────────────┘
```

## Stage Review Panels

### Requirements Review (需求立项)
- Rendered Markdown view of PRD
- User stories list
- Acceptance criteria checklist
- Edit button → switch to Markdown editor mode

### Architecture Review (技术方案)
- Tech Design Document (Markdown rendered)
- Architecture diagram (if generated)
- API spec preview
- Database schema preview
- "确认方案，开始编码" button

### Testing Review (测试验证)
- Test results summary (pass/fail/skip counts)
- Coverage report
- Agent findings / code review notes
- "全部通过，准备上线" button

### Deployment Review (上线部署)
- Build artifacts list
- Deploy script preview
- Target environment info
- "确认部署" button
