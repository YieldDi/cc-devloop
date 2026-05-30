import Editor from "@monaco-editor/react";
import { useEditorStore } from "../../stores/editorStore";
import { useThemeStore } from "../../stores/themeStore";

export default function CodeEditor() {
  const { openFiles, activeFilePath, updateContent } = useEditorStore();
  const theme = useThemeStore((s) => s.theme);
  const fontSize = useThemeStore((s) => s.fontSize);
  const monacoTheme = theme === "dark" ? "vs-dark" : "vs";

  const file = activeFilePath ? openFiles.get(activeFilePath) : null;

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-overlay0 text-sm">
        Open a file to start editing
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language={file.language}
      value={file.content}
      path={file.path}
      theme={monacoTheme}
      onChange={(value) => updateContent(file.path, value || "")}
      options={{
        fontSize,
        minimap: { enabled: true },
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        padding: { top: 8 },
      }}
    />
  );
}
