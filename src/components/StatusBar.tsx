import { useAgentStore } from "../stores/agentStore";
import { useEditorStore } from "../stores/editorStore";
import { useProjectStore } from "../stores/projectStore";

export default function StatusBar({ onToggleTerminal, showTerminal }: { onToggleTerminal: () => void; showTerminal: boolean }) {
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const activeFilePath = useEditorStore((s) => s.activeFilePath);
  const openFiles = useEditorStore((s) => s.openFiles);
  const projectRoot = useProjectStore((s) => s.projectRoot);

  const activeFile = activeFilePath ? openFiles.get(activeFilePath) : null;
  const langLabel = activeFile?.language?.toUpperCase() || "";
  const projectName = projectRoot ? projectRoot.split("/").pop() : "";

  return (
    <div className="flex items-center justify-between h-6 px-2 bg-surface0 text-[11px] text-overlay0 border-t border-surface1 select-none shrink-0">
      <div className="flex items-center gap-3">
        {/* Agent status */}
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? "bg-yellow animate-pulse" : "bg-green"}`} />
          <span>{isStreaming ? "Agent working..." : "Agent ready"}</span>
        </span>

        {/* Project name */}
        {projectName && (
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
            </svg>
            {projectName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Language */}
        {langLabel && <span>{langLabel}</span>}

        {/* Terminal toggle */}
        <button
          onClick={onToggleTerminal}
          className={`hover:text-text transition-colors ${showTerminal ? "text-text" : ""}`}
        >
          Terminal
        </button>
      </div>
    </div>
  );
}
