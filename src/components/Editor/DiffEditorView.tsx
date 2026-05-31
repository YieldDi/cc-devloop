import { useEffect } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { useThemeStore } from "../../stores/themeStore";

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
  const theme = useThemeStore((s) => s.theme);
  const fontSize = useThemeStore((s) => s.fontSize);
  const monacoTheme = theme === "dark" ? "vs-dark" : "vs";

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onReject(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onReject]);

  return (
    <div className="flex flex-col h-full">
      {/* Diff header */}
      <div className="flex items-center justify-between px-4 py-2 bg-mantle border-b border-surface1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow">⟳</span>
          <span className="text-sm text-text">{fileName}</span>
          <span className="text-xs text-overlay0">— Changes</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="px-3 py-1 text-xs bg-green hover:bg-green-light text-crust rounded-lg font-medium transition-colors"
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="px-3 py-1 text-xs bg-surface1 hover:bg-surface2 text-text rounded-lg font-medium transition-colors"
          >
            Close
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
          theme={monacoTheme}
          options={{
            readOnly: true,
            renderSideBySide: true,
            fontSize,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
