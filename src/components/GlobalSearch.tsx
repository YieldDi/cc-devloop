import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../stores/editorStore";
import { useProjectStore } from "../stores/projectStore";

interface SearchResult {
  path: string;
  line: number;
  column: number;
  text: string;
}

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const projectRoot = useProjectStore((s) => s.projectRoot);
  const { openFile } = useEditorStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(
    (q: string) => {
      if (!projectRoot || q.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      invoke<SearchResult[]>("search_files", { path: projectRoot, query: q.trim() })
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    },
    [projectRoot],
  );

  useEffect(() => {
    setLoading(true);
    setSelected(0);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(timerRef.current);
  }, [query, doSearch]);

  const handleSelect = async (r: SearchResult) => {
    try {
      const content = await invoke<string>("read_file", { path: r.path });
      const ext = r.path.split(".").pop() || "";
      const langMap: Record<string, string> = {
        ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
        rs: "rust", py: "python", go: "go", css: "css", html: "html",
        json: "json", md: "markdown", yaml: "yaml", yml: "yaml", toml: "toml",
      };
      openFile(r.path, content, langMap[ext] || "plaintext");
    } catch {
      // ignore
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      handleSelect(results[selected]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Group results by file
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.path] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-[600px] bg-mantle border border-surface1 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-3 py-2 border-b border-surface1">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-overlay0 shrink-0">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in project files..."
            className="flex-1 bg-transparent px-2 py-1 text-sm text-text placeholder-overlay0 outline-none"
          />
          {loading && <span className="text-[10px] text-overlay0">...</span>}
          <kbd className="text-[10px] px-1.5 py-0.5 bg-surface0 rounded border border-surface1 text-overlay0 shrink-0">Esc</kbd>
        </div>

        <div className="max-h-[350px] overflow-y-auto">
          {query.trim().length >= 2 && results.length === 0 && !loading && (
            <div className="px-3 py-4 text-xs text-overlay0 text-center">No results found</div>
          )}

          {Object.entries(grouped).map(([filePath, matches]) => {
            const fileName = filePath.split("/").pop() || filePath;
            const relative = projectRoot ? filePath.slice(projectRoot.length + 1) : filePath;
            const dir = relative.split("/").slice(0, -1).join("/");

            return (
              <div key={filePath}>
                <div className="flex items-center gap-2 px-3 py-1 bg-surface0/50 text-[11px] text-subtext0 sticky top-0">
                  <span className="text-text font-medium">{fileName}</span>
                  {dir && <span className="text-overlay0 truncate">{dir}</span>}
                  <span className="text-overlay0 ml-auto">{matches.length}</span>
                </div>
                {matches.map((m, mi) => {
                  const idx = selected;
                  // Compute flat index
                  let flatIdx = 0;
                  for (const [, ms] of Object.entries(grouped)) {
                    if (ms === matches) {
                      flatIdx += mi;
                      break;
                    }
                    flatIdx += ms.length;
                  }
                  return (
                    <div
                      key={`${m.path}:${m.line}`}
                      onClick={() => handleSelect(m)}
                      className={`flex items-start gap-2 px-3 py-1 cursor-pointer text-xs ${
                        flatIdx === idx ? "bg-blue/20 text-text" : "text-subtext0 hover:bg-surface0/50"
                      }`}
                      onMouseEnter={() => setSelected(flatIdx)}
                    >
                      <span className="text-overlay0 shrink-0 w-6 text-right">{m.line}</span>
                      <span className="truncate flex-1">{m.text}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
