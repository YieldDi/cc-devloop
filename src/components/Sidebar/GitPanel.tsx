import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useProjectStore } from "../../stores/projectStore";

interface GitInfo {
  branch: string;
  staged: number;
  unstaged: number;
  untracked: number;
  ahead: number;
  behind: number;
}

export default function GitPanel() {
  const projectRoot = useProjectStore((s) => s.projectRoot);
  const [git, setGit] = useState<GitInfo | null>(null);
  const [message, setMessage] = useState("");
  const [committing, setCommitting] = useState(false);

  const refresh = () => {
    if (!projectRoot) return;
    invoke<GitInfo>("git_status").then(setGit).catch(() => setGit(null));
  };

  useEffect(() => { refresh(); }, [projectRoot]);

  const handleCommit = async () => {
    if (!message.trim() || committing) return;
    setCommitting(true);
    try {
      await invoke("git_commit", { message: message.trim() });
      setMessage("");
      refresh();
    } catch (e) {
      console.error("Commit failed:", e);
    } finally {
      setCommitting(false);
    }
  };

  if (!git) return null;

  const totalChanges = git.staged + git.unstaged + git.untracked;

  return (
    <div className="border-t border-surface1 px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-blue">
            <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.12V6A2.5 2.5 0 0 1 10 8.5H6A1 1 0 0 0 5 9.5v.879a2.25 2.25 0 1 1-1.5 0V9.5A2.5 2.5 0 0 1 6 7h4A1 1 0 0 0 11 6V5.37a2.25 2.25 0 0 1-1.5-2.12zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z"/>
          </svg>
          <span className="text-xs font-medium text-blue">{git.branch}</span>
        </div>
        {totalChanges > 0 && (
          <span className="text-[10px] text-yellow">{totalChanges} change{totalChanges > 1 ? "s" : ""}</span>
        )}
      </div>

      {totalChanges > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-1 text-[10px]">
            {git.staged > 0 && <span className="text-green">+{git.staged} staged</span>}
            {git.unstaged > 0 && <span className="text-yellow">~{git.unstaged} modified</span>}
            {git.untracked > 0 && <span className="text-overlay0">?{git.untracked} new</span>}
          </div>
        </div>
      )}

      <div className="flex gap-1.5">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCommit(); }}
          placeholder="Commit message..."
          className="flex-1 bg-surface0 border border-surface1 rounded-md px-2 py-1 text-xs text-text placeholder-overlay0 outline-none focus:border-blue transition-colors"
          disabled={committing}
        />
        <button
          onClick={handleCommit}
          disabled={!message.trim() || committing || totalChanges === 0}
          className="px-2 py-1 text-xs bg-blue hover:bg-lavender disabled:opacity-30 disabled:cursor-not-allowed text-crust rounded-md transition-colors shrink-0"
        >
          {committing ? "..." : "Commit"}
        </button>
      </div>
    </div>
  );
}
