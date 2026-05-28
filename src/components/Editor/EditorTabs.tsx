import { useEditorStore } from "../../stores/editorStore";

export default function EditorTabs() {
  const { openFiles, activeFilePath, setActiveFile, closeFile } = useEditorStore();
  const files = Array.from(openFiles.values());

  if (files.length === 0) return null;

  return (
    <div className="flex bg-[#181825] border-b border-white/5 overflow-x-auto">
      {files.map((file) => {
        const name = file.path.split("/").pop() || file.path;
        const isActive = file.path === activeFilePath;
        return (
          <div
            key={file.path}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-white/5 shrink-0 ${
              isActive
                ? "bg-[#1e1e2e] text-white border-t-2 border-t-blue-500"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span>{name}</span>
            {file.isDirty && <span className="w-2 h-2 rounded-full bg-orange-400" />}
            <button
              className="ml-1 text-gray-500 hover:text-white text-xs"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
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
