import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useProjectStore, type FileNode } from "../../stores/projectStore";
import { useEditorStore } from "../../stores/editorStore";
import { detectLanguage } from "../../utils/languageDetect";

function FileIcon({ name, isDir }: { name: string; isDir: boolean }) {
  if (isDir) return <span className="text-blue-400 mr-1.5">📁</span>;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const colorMap: Record<string, string> = {
    ts: "text-blue-400", tsx: "text-blue-400",
    js: "text-yellow-400", jsx: "text-yellow-400",
    json: "text-yellow-300",
    css: "text-pink-400", scss: "text-pink-400",
    html: "text-orange-400",
    py: "text-green-400",
    rs: "text-orange-500",
    go: "text-cyan-400",
    java: "text-red-400",
    md: "text-gray-400",
    toml: "text-gray-400", yaml: "text-gray-400", yml: "text-gray-400",
  };
  const color = colorMap[ext] || "text-gray-500";
  return <span className={`${color} mr-1.5 text-xs`}>◆</span>;
}

function TreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const { expandedDirs, toggleDir, setChildren } = useProjectStore();
  const { openFile } = useEditorStore();
  const [loading, setLoading] = useState(false);
  const isExpanded = expandedDirs.has(node.path);

  const handleClick = useCallback(async () => {
    if (node.is_dir) {
      if (!isExpanded && !node.children) {
        // Lazy load children on first expand
        setLoading(true);
        try {
          const children = await invoke<FileNode[]>("read_dir_children", { path: node.path });
          setChildren(node.path, children);
        } catch (e) {
          console.error("Failed to load directory:", e);
        } finally {
          setLoading(false);
        }
      }
      toggleDir(node.path);
    } else {
      const content = await invoke<string>("read_file", { path: node.path });
      openFile(node.path, content, detectLanguage(node.path));
    }
  }, [node, isExpanded]);

  return (
    <div>
      <div
        className="flex items-center cursor-pointer hover:bg-white/5 px-2 py-0.5 text-sm truncate"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.is_dir && (
          <span className="text-gray-500 mr-1 text-xs">
            {loading ? "⟳" : isExpanded ? "▾" : "▸"}
          </span>
        )}
        <FileIcon name={node.name} isDir={node.is_dir} />
        <span className="truncate">{node.name}</span>
      </div>
      {node.is_dir && isExpanded && node.children?.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function FileTree() {
  const { tree, refreshRoot } = useProjectStore();

  if (tree.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4 text-center">
        No project opened
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1">
      <div className="flex justify-end px-1 py-0.5 border-b border-white/5">
        <button
          onClick={() => refreshRoot()}
          className="text-xs text-gray-500 hover:text-white px-1.5 py-0.5 hover:bg-white/5 rounded"
          title="Refresh file tree"
        >
          ⟳
        </button>
      </div>
      {tree.map((node) => (
        <TreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}
