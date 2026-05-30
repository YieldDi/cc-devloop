import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useProjectStore } from "../stores/projectStore";
import { useEditorStore } from "../stores/editorStore";
import FileTree from "./Sidebar/FileTree";
import SettingsPanel from "./Sidebar/SettingsPanel";
import EditorTabs from "./Editor/EditorTabs";
import Breadcrumbs from "./Editor/Breadcrumbs";
import CodeEditor from "./Editor/CodeEditor";
import DiffEditorView from "./Editor/DiffEditorView";
import ChatPanel from "./AgentPanel/ChatPanel";
import TerminalPanel from "./Terminal/Terminal";
import StatusBar from "./StatusBar";
import ShortcutsPanel from "./ShortcutsPanel";
import CommandPalette from "./CommandPalette";
import GlobalSearch from "./GlobalSearch";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

export default function Layout({ onBackToWelcome }: { onBackToWelcome: () => void }) {
  const { projectRoot, tree, setProjectRoot, setTree, refreshRoot, addRecentProject } = useProjectStore();
  const { activeDiffId, pendingDiffs, acceptDiff, rejectDiff, setActiveDiff, showTerminal } =
    useEditorStore();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  useKeyboardShortcuts(() => setShowShortcuts((v) => !v));

  // Listen for open-palette event from keyboard shortcuts
  useEffect(() => {
    const paletteHandler = () => setShowPalette(true);
    const searchHandler = () => setShowSearch(true);
    window.addEventListener("open-palette", paletteHandler);
    window.addEventListener("open-search", searchHandler);
    return () => {
      window.removeEventListener("open-palette", paletteHandler);
      window.removeEventListener("open-search", searchHandler);
    };
  }, []);

  // Intercept window close → go back to welcome instead of quitting
  useEffect(() => {
    const unlisten = getCurrentWindow().onCloseRequested(async (event) => {
      event.preventDefault();
      onBackToWelcome();
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [onBackToWelcome]);

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
      addRecentProject(path);
      const tree = await invoke("read_project_tree", { path });
      setTree(tree as []);
    }
  };

  // Find the active diff if any
  const activeDiff = activeDiffId
    ? pendingDiffs.find((d) => d.id === activeDiffId)
    : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base text-text">
      {/* Main content area: sidebar | editor | agent */}
      <div className="flex-1 min-h-0 grid grid-cols-[240px_1fr_360px]">
        {/* Sidebar */}
        <div className="flex flex-col h-full overflow-hidden border-r border-surface1 bg-mantle">
          {/* Sidebar header: project icon + name + settings */}
          <div className="flex items-center justify-between p-2 border-b border-surface1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={onBackToWelcome}
                className="flex items-center gap-1 p-1.5 rounded-md text-overlay0 hover:text-text hover:bg-surface0 transition-colors shrink-0 group"
                title="Switch Project"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
                </svg>
                <svg className="group-hover:block hidden" width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 8h12M9 3l5 5-5 5"/>
                </svg>
              </button>
              {projectRoot && (
                <span className="text-sm font-semibold text-subtext1 truncate">
                  {projectRoot.split("/").pop()}
                </span>
              )}
            </div>
            <SettingsPanel />
          </div>
          <FileTree />
        </div>

        {/* Editor Area */}
        <div className="flex flex-col h-full min-w-0 overflow-hidden">
          {/* Show pending diff badges in tabs */}
          {pendingDiffs.length > 0 && !activeDiff && (
            <div className="flex items-center gap-1 px-2 py-1 bg-mantle border-b border-surface1">
              {pendingDiffs.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setActiveDiff(diff.id)}
                  className="flex items-center gap-1.5 px-2 py-0.5 text-xs bg-yellow/10 text-yellow rounded-md hover:bg-yellow/20 transition-colors"
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
              <Breadcrumbs />
              <div className="flex-1 min-h-0 overflow-hidden">
                <CodeEditor />
              </div>
            </>
          )}

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 bg-mantle border-t border-surface1">
              <TerminalPanel />
            </div>
          )}
        </div>

        {/* Agent Panel */}
        <div className="flex flex-col h-full overflow-hidden border-l border-surface1 bg-mantle">
          <ChatPanel />
        </div>
      </div>

      {/* Status Bar — full width at bottom */}
      <StatusBar />

      {/* Shortcuts help overlay */}
      {showShortcuts && (
        <ShortcutsPanel onClose={() => setShowShortcuts(false)} />
      )}

      {/* Quick open palette */}
      {showPalette && (
        <CommandPalette onClose={() => setShowPalette(false)} />
      )}

      {/* Global search */}
      {showSearch && (
        <GlobalSearch onClose={() => setShowSearch(false)} />
      )}
    </div>
  );
}
