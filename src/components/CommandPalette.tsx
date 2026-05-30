import { useState, useEffect, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../stores/editorStore";
import { useProjectStore } from "../stores/projectStore";

interface FileEntry {
  path: string;
  name: string;
}

function fuzzyMatch(query: string, name: string): number {
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes(q)) return 2;
  let qi = 0;
  for (let i = 0; i < n.length && qi < q.length; i++) {
    if (n[i] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : 0;
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const projectRoot = useProjectStore((s) => s.projectRoot);
  const { openFile } = useEditorStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!projectRoot) return;
    type FN = { name: string; path: string; is_dir: boolean; children?: FN[] };
    const flatten = (nodes: FN[], acc: FileEntry[] = []) => {
      for (const n of nodes) {
        if (n.is_dir) {
          if (n.children) flatten(n.children, acc);
        } else {
          acc.push({ path: n.path, name: n.name });
        }
      }
      return acc;
    };
    invoke<FN[]>("read_project_tree_full", { path: projectRoot })
      .then((tree) => setFiles(flatten(tree)))
      .catch(() => {});
  }, [projectRoot]);

  const filtered = useMemo(() => {
    if (!query.trim()) return files.slice(0, 50);
    const scored = files
      .map((f) => ({ ...f, score: fuzzyMatch(query, f.name) }))
      .filter((f) => f.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return scored.slice(0, 50);
  }, [files, query]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleSelect = async (path: string) => {
    try {
      const content = await invoke<string>("read_file", { path });
      const ext = path.split(".").pop() || "";
      const langMap: Record<string, string> = {
        ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
        rs: "rust", py: "python", go: "go", css: "css", html: "html",
        json: "json", md: "markdown", yaml: "yaml", yml: "yaml", toml: "toml",
      };
      openFile(path, content, langMap[ext] || "plaintext");
    } catch {
      // ignore
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selected]) handleSelect(filtered[selected].path);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-[520px] bg-mantle border border-surface1 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-3 py-2 border-b border-surface1">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-overlay0 shrink-0">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files by name..."
            className="flex-1 bg-transparent px-2 py-1 text-sm text-text placeholder-overlay0 outline-none"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 bg-surface0 rounded border border-surface1 text-overlay0 shrink-0">Esc</kbd>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-xs text-overlay0 text-center">No files found</div>
          )}
          {filtered.map((file, i) => {
            const relative = projectRoot ? file.path.slice(projectRoot.length + 1) : file.path;
            const dir = relative.split("/").slice(0, -1).join("/");
            return (
              <div
                key={file.path}
                onClick={() => handleSelect(file.path)}
                className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs ${
                  i === selected ? "bg-surface0 text-text" : "text-subtext0 hover:bg-surface0/50"
                }`}
                onMouseEnter={() => setSelected(i)}
              >
                <span className="truncate">{file.name}</span>
                {dir && <span className="text-overlay0 truncate ml-2 text-[10px] shrink-0">{dir}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
