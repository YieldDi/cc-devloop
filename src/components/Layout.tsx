import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useProjectStore } from "../stores/projectStore";
import { useEditorStore } from "../stores/editorStore";
import FileTree from "./Sidebar/FileTree";
import EditorTabs from "./Editor/EditorTabs";
import CodeEditor from "./Editor/CodeEditor";
import DiffEditorView from "./Editor/DiffEditorView";
import ChatPanel from "./AgentPanel/ChatPanel";
import TerminalPanel from "./Terminal/Terminal";

export default function Layout() {
  const { projectRoot, tree, setProjectRoot, setTree, refreshRoot } = useProjectStore();
  const { activeDiffId, pendingDiffs, acceptDiff, rejectDiff, setActiveDiff } =
    useEditorStore();
  const [showTerminal, setShowTerminal] = useState(false);

  // Auto-restore tree when projectRoot is persisted but tree is empty
  useEffect(() => {
    if (projectRoot && tree.length === 0) {
      refreshRoot();
    }
  }, [projectRoot]);

  const handleOpenProject = async () => {
    const path = await invoke<string | null>("select_directory");
    if (path) {
      setProjectRoot(path);
      const tree = await invoke("read_project_tree", { path });
      setTree(tree as []);
    }
  };

  // Find the active diff if any
  const activeDiff = activeDiffId
    ? pendingDiffs.find((d) => d.id === activeDiffId)
    : null;

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
        {/* Show pending diff badges in tabs */}
        {pendingDiffs.length > 0 && !activeDiff && (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#181825] border-b border-white/5">
            {pendingDiffs.map((diff) => (
              <button
                key={diff.id}
                onClick={() => setActiveDiff(diff.id)}
                className="flex items-center gap-1.5 px-2 py-0.5 text-xs bg-[#f9e2af]/10 text-[#f9e2af] rounded-md hover:bg-[#f9e2af]/20 transition-colors"
              >
                <span>⟳</span>
                <span>{diff.path.split("/").pop()}</span>
              </button>
            ))}
          </div>
        )}

        {activeDiff ? (
          <DiffEditorView
            original={activeDiff.original}
            modified={activeDiff.modified}
            language={activeDiff.language}
            path={activeDiff.path}
            onAccept={() => acceptDiff(activeDiff.id)}
            onReject={() => rejectDiff(activeDiff.id)}
          />
        ) : (
          <>
            <EditorTabs />
            <div className="flex-1 min-h-0 overflow-hidden">
              <CodeEditor />
            </div>
          </>
        )}

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
