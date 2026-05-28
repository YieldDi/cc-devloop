import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useProjectStore } from "../stores/projectStore";
import FileTree from "./Sidebar/FileTree";
import EditorTabs from "./Editor/EditorTabs";
import CodeEditor from "./Editor/CodeEditor";
import ChatPanel from "./AgentPanel/ChatPanel";
import TerminalPanel from "./Terminal/Terminal";

export default function Layout() {
  const { projectRoot, setProjectRoot, setTree } = useProjectStore();
  const [showTerminal, setShowTerminal] = useState(false);

  const handleOpenProject = async () => {
    const path = await invoke<string | null>("select_directory");
    if (path) {
      setProjectRoot(path);
      const tree = await invoke("read_project_tree", { path });
      setTree(tree as []);
    }
  };

  return (
    <div className="grid grid-cols-[240px_1fr_360px] h-screen overflow-hidden bg-[#1e1e2e] text-white">
      {/* Sidebar */}
      <div className="flex flex-col h-full overflow-hidden border-r border-white/5 bg-[#181825]">
        <div className="p-2 border-b border-white/5">
          <button
            onClick={handleOpenProject}
            className="w-full px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded text-center"
          >
            {projectRoot ? "切换项目" : "打开项目"}
          </button>
        </div>
        {projectRoot && (
          <div className="px-3 py-1 text-xs text-gray-400 truncate border-b border-white/5">
            {projectRoot.split("/").pop()}
          </div>
        )}
        <FileTree />
      </div>

      {/* Editor Area */}
      <div className="flex flex-col h-full min-w-0 overflow-hidden">
        <EditorTabs />
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodeEditor />
        </div>
        {/* Terminal toggle */}
        <div className="border-t border-white/5">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="w-full px-3 py-1 text-xs text-gray-400 hover:text-white bg-[#181825] hover:bg-white/5 flex items-center gap-2"
          >
            <span>{showTerminal ? "▾" : "▸"}</span>
            Terminal
          </button>
          {showTerminal && (
            <div className="h-48 bg-[#181825]">
              <TerminalPanel />
            </div>
          )}
        </div>
      </div>

      {/* Agent Panel */}
      <div className="flex flex-col h-full overflow-hidden border-l border-white/5 bg-[#181825]">
        <ChatPanel />
      </div>
    </div>
  );
}
