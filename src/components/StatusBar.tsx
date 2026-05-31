import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAgentStore } from "../stores/agentStore";
import { useEditorStore } from "../stores/editorStore";
import { useProjectStore } from "../stores/projectStore";
import GitChanges from "./GitChanges";

interface GitInfo {
  branch: string;
  staged: number;
  unstaged: number;
  untracked: number;
  ahead: number;
  behind: number;
}

export default function StatusBar() {
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const activeFilePath = useEditorStore((s) => s.activeFilePath);
  const openFiles = useEditorStore((s) => s.openFiles);
  const showTerminal = useEditorStore((s) => s.showTerminal);
  const toggleTerminal = useEditorStore((s) => s.toggleTerminal);
  const projectRoot = useProjectStore((s) => s.projectRoot);

  const activeFile = activeFilePath ? openFiles.get(activeFilePath) : null;
  const langLabel = activeFile?.language?.toUpperCase() || "";
  const projectName = projectRoot ? projectRoot.split("/").pop() : "";

  const [git, setGit] = useState<GitInfo | null>(null);
  const [showCommit, setShowCommit] = useState(false);
  const [message, setMessage] = useState("");
  const [committing, setCommitting] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    if (!projectRoot) return;
    invoke<GitInfo>("git_status").then(setGit).catch(() => setGit(null));
  };

  useEffect(() => {
    if (!projectRoot) { setGit(null); return; }
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [projectRoot]);

  useEffect(() => {
    if (projectRoot) {
      invoke("git_set_project", { projectPath: projectRoot }).catch(() => {});
    }
  }, [projectRoot]);

  useEffect(() => {
    if (showCommit && inputRef.current) inputRef.current.focus();
  }, [showCommit]);

  const totalChanges = git ? git.staged + git.unstaged + git.untracked : 0;

  const handleCommit = async () => {
    if (!message.trim() || committing) return;
    setCommitting(true);
    try {
      await invoke("git_commit", { message: message.trim() });
      setMessage("");
      setShowCommit(false);
      refresh();
    } catch (e) {
      console.error("Commit failed:", e);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="shrink-0 border-t border-surface1">
      {showCommit && (
        <div className="flex items-center gap-2 h-7 px-2 bg-surface0 border-b border-surface1">
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCommit();
              if (e.key === "Escape") { setShowCommit(false); setMessage(""); }
            }}
            placeholder="Commit message... (⌘+Enter to commit)"
            className="flex-1 bg-mantle border border-surface1 rounded px-2 py-0.5 text-[11px] text-text placeholder-overlay0 outline-none focus:border-blue transition-colors"
            disabled={committing}
          />
          <button
            onClick={handleCommit}
            disabled={!message.trim() || committing || totalChanges === 0}
            className="px-2 py-0.5 text-[11px] bg-blue hover:bg-lavender disabled:opacity-30 disabled:cursor-not-allowed text-crust rounded transition-colors shrink-0"
          >
            {committing ? "..." : "Commit"}
          </button>
          <button
            onClick={() => { setShowCommit(false); setMessage(""); }}
            className="text-[11px] text-overlay0 hover:text-text transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex items-center justify-between h-6 px-2 bg-surface0 text-[11px] text-overlay0 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? "bg-yellow animate-pulse" : "bg-green"}`} />
            <span>{isStreaming ? "Agent working..." : "Agent ready"}</span>
          </span>

          <button
            onClick={toggleTerminal}
            className={`flex items-center gap-1 px-1.5 rounded transition-colors ${showTerminal ? "text-text bg-surface1" : "text-overlay0 hover:text-text hover:bg-surface1"}`}
            title={showTerminal ? "Hide Terminal (⌘`)" : "Show Terminal (⌘`)"}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3.75A.75.75 0 0 1 2.75 3h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75zm0 4a.75.75 0 0 1 .22-.53l2.5-2.5a.75.75 0 0 1 1.06 1.06L4.06 7.5l1.72 1.72a.75.75 0 0 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1-.22-.53zM8 7.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 8 7.25zm0 4a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75zM2 11.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75z"/>
            </svg>
            <span>Term</span>
          </button>

          {git && (
            <button
              onClick={() => setShowCommit(!showCommit)}
              className="flex items-center gap-1.5 px-1.5 rounded hover:text-text hover:bg-surface1 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-blue">
                <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.12V6A2.5 2.5 0 0 1 10 8.5H6A1 1 0 0 0 5 9.5v.879a2.25 2.25 0 1 1-1.5 0V9.5A2.5 2.5 0 0 1 6 7h4A1 1 0 0 0 11 6V5.37a2.25 2.25 0 0 1-1.5-2.12zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z"/>
              </svg>
              <span className="text-blue">{git.branch}</span>
              {git.ahead > 0 && <span className="text-green">↑{git.ahead}</span>}
              {git.behind > 0 && <span className="text-red">↓{git.behind}</span>}
              {totalChanges > 0 && <span className="text-yellow">●{totalChanges}</span>}
            </button>
          )}

          {/* View changes button */}
          {git && totalChanges > 0 && (
            <button
              onClick={() => setShowChanges(true)}
              className="flex items-center gap-1 px-1.5 rounded text-overlay0 hover:text-text hover:bg-surface1 transition-colors"
              title="View uncommitted changes"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5V7H1V3.5zM1 8.5v4A1.5 1.5 0 0 0 2.5 14h11A1.5 1.5 0 0 0 15 12.5V8.5H1z"/>
              </svg>
              <span>Diff</span>
            </button>
          )}

          {!git && projectName && (
            <span className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
                <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
              </svg>
              {projectName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {langLabel && <span>{langLabel}</span>}
        </div>
      </div>

      {showChanges && <GitChanges onClose={() => setShowChanges(false)} />}
    </div>
  );
}
