import Editor, { type OnMount } from "@monaco-editor/react";
import { useRef } from "react";
import { useEditorStore } from "../../stores/editorStore";

export default function CodeEditor() {
  const editorRef = useRef<OnMount>(null);
  const { openFiles, activeFilePath, updateContent } = useEditorStore();

  const file = activeFilePath ? openFiles.get(activeFilePath) : null;

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
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
      theme="vs-dark"
      onChange={(value) => updateContent(file.path, value || "")}
      options={{
        fontSize: 14,
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
