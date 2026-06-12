import { useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { useEditorStore } from "../../stores/editorStore";
import { useThemeStore } from "../../stores/themeStore";

// Custom cyberpunk dark theme for Monaco
const CYBER_DARK = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "comment", foreground: "4a5270", fontStyle: "italic" },
    { token: "keyword", foreground: "00e5ff" },
    { token: "string", foreground: "3df5a0" },
    { token: "number", foreground: "f0c050" },
    { token: "type", foreground: "8b9cf7" },
    { token: "function", foreground: "4da6ff" },
    { token: "variable", foreground: "d4daf0" },
    { token: "variable.predefined", foreground: "f0a0b8" },
    { token: "constant", foreground: "f0c050" },
    { token: "tag", foreground: "ff4d6a" },
    { token: "attribute.name", foreground: "00ffc8" },
    { token: "attribute.value", foreground: "3df5a0" },
    { token: "delimiter", foreground: "4a5270" },
    { token: "meta", foreground: "8b9cf7" },
  ],
  colors: {
    "editor.background": "#0f1219",
    "editor.foreground": "#d4daf0",
    "editor.lineHighlightBackground": "#171c2840",
    "editor.selectionBackground": "#00e5ff20",
    "editor.inactiveSelectionBackground": "#00e5ff10",
    "editorCursor.foreground": "#00e5ff",
    "editorWhitespace.foreground": "#4a527020",
    "editorIndentGuide.background": "#171c28",
    "editorIndentGuide.activeBackground": "#1e2436",
    "editorLineNumber.foreground": "#4a5270",
    "editorLineNumber.activeForeground": "#9ba3c0",
    "editor.selectionHighlightBackground": "#00e5ff15",
    "editor.wordHighlightBackground": "#00e5ff10",
    "editorBracketMatch.background": "#00e5ff15",
    "editorBracketMatch.border": "#00e5ff40",
    "scrollbarSlider.background": "#2a314840",
    "scrollbarSlider.hoverBackground": "#2a314880",
    "scrollbarSlider.activeBackground": "#00e5ff40",
    "minimap.background": "#0b0e15",
  },
};

let themeRegistered = false;

function ensureTheme() {
  if (themeRegistered) return;
  themeRegistered = true;
  loader.init().then((monaco) => {
    monaco.editor.defineTheme("cyber-dark", CYBER_DARK);
  });
}

export default function CodeEditor() {
  const { openFiles, activeFilePath, updateContent } = useEditorStore();
  const theme = useThemeStore((s) => s.theme);
  const fontSize = useThemeStore((s) => s.fontSize);

  useEffect(() => {
    if (theme === "dark") ensureTheme();
  }, [theme]);

  const monacoTheme = theme === "dark" ? "cyber-dark" : "vs";

  const file = activeFilePath ? openFiles.get(activeFilePath) : null;

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-overlay0/50 gap-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-30">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm">Open a file to start editing</span>
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
