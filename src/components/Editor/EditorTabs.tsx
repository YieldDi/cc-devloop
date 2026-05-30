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
    <div className="flex bg-mantle border-b border-surface1 overflow-x-auto">
      {files.map((file) => {
        const name = file.path.split("/").pop() || file.path;
        const isActive = file.path === activeFilePath;
        return (
          <div
            key={file.path}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-surface1 shrink-0 ${
              isActive
                ? "bg-base text-text border-t-2 border-t-blue"
                : "text-overlay0 hover:text-text hover:bg-surface0"
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span>{name}</span>
            {file.isDirty && <span className="w-2 h-2 rounded-full bg-orange-400" />}
            <button
              className="ml-1 text-overlay0 hover:text-text text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(file.path);
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
