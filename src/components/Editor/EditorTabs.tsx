import { useEditorStore } from "../../stores/editorStore";
import { invoke } from "@tauri-apps/api/core";

export default function EditorTabs() {
  const { openFiles, activeFilePath, setActiveFile, closeFile, saveFile } = useEditorStore();
  const files = Array.from(openFiles.values());

  if (files.length === 0) return null;

  const handleClose = async (path: string) => {
    const file = openFiles.get(path);
    if (file?.isDirty) {
      const name = path.split("/").pop() || path;
      const ok = window.confirm(`Save changes to "${name}" before closing?`);
      if (ok) {
        await saveFile(path);
      }
    }
    closeFile(path);
  };

  return (
    <div className="flex bg-mantle border-b border-surface1/60 overflow-x-auto">
      {files.map((file) => {
        const name = file.path.split("/").pop() || file.path;
        const isActive = file.path === activeFilePath;
        return (
          <div
            key={file.path}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-surface1/40 shrink-0 transition-all ${
              isActive
                ? "bg-base text-text"
                : "text-overlay0 hover:text-text hover:bg-surface0/40"
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            {/* Active indicator — sharp cyan line */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-cyan shadow-[0_0_6px_rgba(0,229,255,0.4)]" />
            )}
            <span className={isActive ? "text-text" : ""}>{name}</span>
            {file.isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow shadow-[0_0_4px_rgba(240,192,80,0.5)]" />
            )}
            <button
              className={`ml-1 text-xs transition-opacity ${isActive ? "text-overlay0 hover:text-red opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:!text-red"}`}
              onClick={(e) => {
                e.stopPropagation();
                handleClose(file.path);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
