import { useState, useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { DiffEditor } from "@monaco-editor/react";
import { useThemeStore } from "../stores/themeStore";
import { useProjectStore } from "../stores/projectStore";
import { useEditorStore } from "../stores/editorStore";

interface DiffFile {
  path: string;
  status: string;
  added: number;
  deleted: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  M: { label: "M", color: "text-yellow", bg: "bg-yellow/10" },
  A: { label: "A", color: "text-green", bg: "bg-green/10" },
  D: { label: "D", color: "text-red", bg: "bg-red/10" },
  "?": { label: "U", color: "text-overlay0", bg: "bg-surface0" },
};

interface FileTreeNode {
  name: string;
  fullPath?: string;
  status?: string;
  added?: number;
  deleted?: number;
  children?: FileTreeNode[];
}

function buildTree(files: DiffFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  for (const f of files) {
    const parts = f.path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      if (isFile) {
        current.push({ name: part, fullPath: f.path, status: f.status, added: f.added, deleted: f.deleted });
      } else {
        let dir = current.find((n) => n.name === part && n.children);
        if (!dir) {
          dir = { name: part, children: [] };
          current.push(dir);
        }
        current = dir.children!;
      }
    }
  }
  const sortNodes = (a: FileTreeNode, b: FileTreeNode) => {
    const aIsDir = !!a.children;
    const bIsDir = !!b.children;
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  };
  const sortTree = (nodes: FileTreeNode[]) => {
    nodes.sort(sortNodes);
    for (const n of nodes) {
      if (n.children) sortTree(n.children);
    }
  };
  sortTree(root);
  return root;
}

function FileTree({
  nodes,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        if (node.children) {
          return (
            <div key={node.name}>
              <div
                className="px-2 py-1 text-[11px] text-overlay0 truncate"
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
              >
                {node.name}/
              </div>
              <FileTree
                nodes={node.children}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            </div>
          );
        }
        const st = STATUS_MAP[node.status || "?"] || STATUS_MAP["?"];
        const isSelected = node.fullPath === selectedPath;
        return (
          <button
            key={node.fullPath}
            onClick={() => onSelect(node.fullPath!)}
            className={`w-full flex items-center gap-2 px-2 py-1 text-xs transition-colors ${
              isSelected ? "bg-blue/10 text-text" : "text-subtext0 hover:bg-surface0"
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            <span className={`w-4 text-center font-mono font-bold shrink-0 ${st.color} ${st.bg} rounded text-[9px]`}>
              {st.label}
            </span>
            <span className="truncate flex-1 text-left">{node.name}</span>
            <span className="shrink-0 text-[10px] font-mono space-x-1">
              {(node.added ?? 0) > 0 && <span className="text-green">+{node.added}</span>}
              {(node.deleted ?? 0) > 0 && <span className="text-red">-{node.deleted}</span>}
            </span>
          </button>
        );
      })}
    </>
  );
}

function flattenTree(nodes: FileTreeNode[]): string[] {
  const result: string[] = [];
  for (const n of nodes) {
    if (n.children) {
      result.push(...flattenTree(n.children));
    } else if (n.fullPath) {
      result.push(n.fullPath);
    }
  }
  return result;
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    rs: "rust", py: "python", go: "go", css: "css", html: "html",
    json: "json", md: "markdown", yaml: "yaml", yml: "yaml", toml: "toml",
  };
  return map[ext] || "plaintext";
}

export default function GitChanges({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<DiffFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const editorRef = useRef<any>(null);
  const theme = useThemeStore((s) => s.theme);
  const fontSize = useThemeStore((s) => s.fontSize);
  const monacoTheme = theme === "dark" ? "vs-dark" : "vs";
  const projectRoot = useProjectStore((s) => s.projectRoot);
  const openFile = useEditorStore((s) => s.openFile);

  useEffect(() => {
    invoke<DiffFile[]>("git_diff_summary")
      .then(setFiles)
      .catch(() => setFiles([]));
  }, []);

  const tree = useMemo(() => buildTree(files), [files]);

  // Auto-select first file
  useEffect(() => {
    if (files.length > 0 && !selectedPath) {
      handleSelect(files[0].path);
    }
  }, [files]);

  const handleSelect = async (path: string) => {
    setSelectedPath(path);
    setLoading(true);
    setError("");
    try {
      const result = await invoke<{ original: string; modified: string } | null>("git_diff_file", { filePath: path });
      if (result) {
        setOriginal(result.original);
        setModified(result.modified);
      } else {
        setOriginal("");
        setModified("");
        setError("No differences found");
      }
    } catch (e) {
      setError(String(e));
      setOriginal("");
      setModified("");
    } finally {
      setLoading(false);
    }
  };

  // Open selected file in the main editor
  const handleEditFile = async () => {
    if (!selectedPath || !projectRoot) return;
    const fullPath = `${projectRoot}/${selectedPath}`;
    try {
      const content = await invoke<string>("read_file", { path: fullPath });
      openFile(fullPath, content, detectLanguage(selectedPath));
      onClose();
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  };

  // Navigate to prev/next diff change
  const navigateDiff = (direction: "next" | "prev") => {
    const editor = editorRef.current;
    if (!editor) return;
    const modifiedEditor = editor.getModifiedEditor();
    if (!modifiedEditor) return;
    const action = direction === "next"
      ? modifiedEditor.getAction("editor.action.diffEditor.nextDiff")
      : modifiedEditor.getAction("editor.action.diffEditor.prevDiff");
    action?.run();
  };

  // Flattened tree order for navigation
  const orderedPaths = useMemo(() => flattenTree(tree), [tree]);
  const selectedIdx = orderedPaths.indexOf(selectedPath || "");
  const selectFile = (idx: number) => {
    if (idx >= 0 && idx < orderedPaths.length) handleSelect(orderedPaths[idx]);
  };

  const fileName = selectedPath?.split("/").pop() || "";
  const currentStats = files.find((f) => f.path === selectedPath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-[85vw] h-[80vh] bg-mantle border border-surface1 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface1 shrink-0">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-blue">
              <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.12V6A2.5 2.5 0 0 1 10 8.5H6A1 1 0 0 0 5 9.5v.879a2.25 2.25 0 1 1-1.5 0V9.5A2.5 2.5 0 0 1 6 7h4A1 1 0 0 0 11 6V5.37a2.25 2.25 0 0 1-1.5-2.12zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z"/>
            </svg>
            <h2 className="text-sm font-semibold text-text">Uncommitted Changes</h2>
            <span className="text-xs text-overlay0">{files.length} file{files.length !== 1 ? "s" : ""}</span>
          </div>
          <button onClick={onClose} className="text-overlay0 hover:text-text transition-colors p-1 rounded hover:bg-surface0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        {/* Body: file tree | diff */}
        <div className="flex flex-1 min-h-0">
          {/* Left: file tree */}
          <div className="w-[240px] border-r border-surface1 overflow-y-auto shrink-0 bg-surface0/30">
            <div className="py-1">
              <FileTree nodes={tree} selectedPath={selectedPath} onSelect={handleSelect} />
            </div>
          </div>

          {/* Right: diff view */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedPath ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface1 shrink-0 bg-surface0/30">
                  <span className="text-xs text-text font-medium">{fileName}</span>
                  <span className="text-[10px] text-overlay0 truncate flex-1">{selectedPath}</span>
                  {currentStats && (currentStats.added > 0 || currentStats.deleted > 0) && (
                    <span className="text-[10px] font-mono space-x-1 shrink-0">
                      {currentStats.added > 0 && <span className="text-green">+{currentStats.added}</span>}
                      {currentStats.deleted > 0 && <span className="text-red">-{currentStats.deleted}</span>}
                    </span>
                  )}
                  {/* Prev/Next file */}
                  <div className="flex items-center gap-0.5 shrink-0 border-l border-surface1 pl-2 ml-1">
                    <button
                      onClick={() => selectFile(selectedIdx - 1)}
                      disabled={selectedIdx <= 0}
                      className="p-1 text-overlay0 hover:text-text disabled:opacity-30 transition-colors"
                      title="Previous file"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M11 2L5 8l6 6"/></svg>
                    </button>
                    <span className="text-[10px] text-overlay0">{selectedIdx + 1}/{orderedPaths.length}</span>
                    <button
                      onClick={() => selectFile(selectedIdx + 1)}
                      disabled={selectedIdx >= orderedPaths.length - 1}
                      className="p-1 text-overlay0 hover:text-text disabled:opacity-30 transition-colors"
                      title="Next file"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2l6 6-6 6"/></svg>
                    </button>
                  </div>
                  {/* Prev/Next diff hunk */}
                  {!loading && original !== modified && (
                    <div className="flex items-center gap-0.5 shrink-0 border-l border-surface1 pl-2">
                      <button
                        onClick={() => navigateDiff("prev")}
                        className="p-1 text-overlay0 hover:text-text transition-colors"
                        title="Previous change (Shift+F7)"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 11l6-6 6 6"/></svg>
                      </button>
                      <button
                        onClick={() => navigateDiff("next")}
                        className="p-1 text-overlay0 hover:text-text transition-colors"
                        title="Next change (F7)"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 5l6 6 6-6"/></svg>
                      </button>
                    </div>
                  )}
                  {/* Edit file button */}
                  <button
                    onClick={handleEditFile}
                    className="shrink-0 px-2 py-0.5 text-[11px] bg-blue/20 text-blue rounded hover:bg-blue/30 transition-colors border-l border-surface1 pl-2 ml-1"
                    title="Open in editor"
                  >
                    Edit
                  </button>
                  {loading && <span className="text-overlay0 animate-spin text-xs ml-auto">⟳</span>}
                </div>
                <div className="flex-1 min-h-0">
                  {error && (
                    <div className="px-3 py-2 text-xs text-red bg-red/10 border-b border-surface1">
                      Error: {error}
                    </div>
                  )}
                  {!loading && (
                    <DiffEditor
                      height="100%"
                      language={detectLanguage(selectedPath)}
                      original={original}
                      modified={modified}
                      theme={monacoTheme}
                      onMount={(editor) => { editorRef.current = editor; }}
                      options={{
                        readOnly: true,
                        renderSideBySide: true,
                        fontSize,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-overlay0">
                Select a file to view changes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
