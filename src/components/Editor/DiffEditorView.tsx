import { DiffEditor } from "@monaco-editor/react";

interface DiffEditorViewProps {
  original: string;
  modified: string;
  language: string;
  path: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function DiffEditorView({
  original,
  modified,
  language,
  path,
  onAccept,
  onReject,
}: DiffEditorViewProps) {
  const fileName = path.split("/").pop() || path;

  return (
    <div className="flex flex-col h-full">
      {/* Diff header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-[#45475a]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#f9e2af]">⟳</span>
          <span className="text-sm text-[#cdd6f4]">{fileName}</span>
          <span className="text-xs text-[#6c7086]">— Changes proposed</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="px-3 py-1 text-xs bg-[#a6e3a1] hover:bg-[#94d89a] text-[#11111b] rounded-lg font-medium transition-colors"
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="px-3 py-1 text-xs bg-[#45475a] hover:bg-[#585b70] text-[#cdd6f4] rounded-lg font-medium transition-colors"
          >
            Reject
          </button>
        </div>
      </div>

      {/* Diff editor */}
      <div className="flex-1">
        <DiffEditor
          height="100%"
          language={language}
          original={original}
          modified={modified}
          theme="vs-dark"
          options={{
            readOnly: true,
            renderSideBySide: true,
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
