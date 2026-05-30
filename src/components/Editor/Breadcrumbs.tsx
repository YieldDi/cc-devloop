import { useEditorStore } from "../../stores/editorStore";
import { useProjectStore } from "../../stores/projectStore";

export default function Breadcrumbs() {
  const activeFilePath = useEditorStore((s) => s.activeFilePath);
  const projectRoot = useProjectStore((s) => s.projectRoot);

  if (!activeFilePath || !projectRoot) return null;

  const relative = activeFilePath.startsWith(projectRoot + "/")
    ? activeFilePath.slice(projectRoot.length + 1)
    : activeFilePath;

  const segments = relative.split("/");

  return (
    <div className="flex items-center gap-0.5 px-3 py-1 bg-base border-b border-surface1 text-[11px] text-overlay0 select-none overflow-hidden shrink-0">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-0.5">
          {i > 0 && (
            <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor" className="text-surface1 opacity-60">
              <path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <span className={i === segments.length - 1 ? "text-text" : "hover:text-text cursor-default transition-colors"}>
            {seg}
          </span>
        </span>
      ))}
    </div>
  );
}
