import { useState, useCallback, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useProjectStore, type FileNode } from "../../stores/projectStore";
import { useEditorStore } from "../../stores/editorStore";
import { detectLanguage } from "../../utils/languageDetect";

function FileIcon({ name, isDir }: { name: string; isDir: boolean }) {
  if (isDir) return <span className="text-blue mr-1.5">📁</span>;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const colorMap: Record<string, string> = {
    ts: "text-blue", tsx: "text-blue",
    js: "text-yellow", jsx: "text-yellow",
    json: "text-yellow",
    css: "text-pink", scss: "text-pink",
    html: "text-orange",
    py: "text-green", rs: "text-peach",
    go: "text-teal", java: "text-red",
    md: "text-overlay0", toml: "text-overlay0",
    yaml: "text-overlay0", yml: "text-overlay0",
  };
  const color = colorMap[ext] || "text-overlay0";
  return <span className={`${color} mr-1.5 text-xs`}>◆</span>;
}

interface ContextMenuState {
  x: number;
  y: number;
  node: FileNode;
}

function ContextMenu({
  menu,
  onClose,
  onAction,
}: {
  menu: ContextMenuState;
  onClose: () => void;
  onAction: (action: string, node: FileNode) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  // Clamp position to viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: menu.x,
    top: menu.y,
    zIndex: 100,
  };

  const items = [
    ...(menu.node.is_dir
      ? [
          { id: "newFile", label: "New File" },
          { id: "newFolder", label: "New Folder" },
        ]
      : []),
    { id: "rename", label: "Rename" },
    { id: "delete", label: "Delete", danger: true },
  ];

  return (
    <div
      ref={ref}
      style={style}
      className="bg-mantle border border-surface1 rounded-lg shadow-xl py-1 min-w-[140px]"
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => { onAction(item.id, menu.node); onClose(); }}
          className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
            item.danger
              ? "text-red hover:bg-red/10"
              : "text-text hover:bg-surface0"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function RenameInput({
  path,
  depth,
  onConfirm,
  onCancel,
}: {
  path: string;
  depth: number;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(path.split("/").pop() || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  return (
    <div style={{ paddingLeft: `${depth * 16 + 8}px` }} className="flex items-center px-2 py-0.5">
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => { if (name.trim()) onConfirm(name.trim()); else onCancel(); }}
        className="flex-1 bg-surface0 border border-blue rounded px-1.5 py-0.5 text-xs text-text outline-none"
      />
    </div>
  );
}

function NewItemInput({
  basePath,
  isDir,
  depth,
  onConfirm,
  onCancel,
}: {
  basePath: string;
  isDir: boolean;
  depth: number;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }} className="flex items-center px-2 py-0.5">
      <span className="text-xs mr-1.5">{isDir ? "📁" : "◆"}</span>
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => { if (name.trim()) onConfirm(name.trim()); else onCancel(); }}
        placeholder={isDir ? "folder name..." : "file name..."}
        className="flex-1 bg-surface0 border border-blue rounded px-1.5 py-0.5 text-xs text-text placeholder-overlay0 outline-none"
      />
    </div>
  );
}

function TreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const { expandedDirs, toggleDir, setChildren, refreshDir } = useProjectStore();
  const { openFile } = useEditorStore();
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newItemType, setNewItemType] = useState<"file" | "folder" | null>(null);
  const isExpanded = expandedDirs.has(node.path);

  const handleClick = useCallback(async () => {
    if (renaming || newItemType) return;
    if (node.is_dir) {
      if (!isExpanded && !node.children) {
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
  }, [node, isExpanded, renaming, newItemType]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, [node]);

  const handleAction = useCallback(async (action: string, target: FileNode) => {
    const projectRoot = useProjectStore.getState().projectRoot;
    switch (action) {
      case "rename":
        setRenaming(true);
        break;
      case "delete":
        if (!window.confirm(`Delete "${target.name}"?`)) return;
        await invoke("delete_path", { path: target.path });
        if (target.path.startsWith(projectRoot || "")) {
          refreshDir(target.path.substring(0, target.path.lastIndexOf("/")));
        }
        break;
      case "newFile":
        setNewItemType("file");
        if (!isExpanded) toggleDir(target.path);
        break;
      case "newFolder":
        setNewItemType("folder");
        if (!isExpanded) toggleDir(target.path);
        break;
    }
  }, [isExpanded]);

  const handleRenameConfirm = useCallback(async (newName: string) => {
    const dir = node.path.substring(0, node.path.lastIndexOf("/"));
    const newPath = `${dir}/${newName}`;
    if (newPath !== node.path) {
      try {
        await invoke("rename_path", { oldPath: node.path, newPath });
        const projectRoot = useProjectStore.getState().projectRoot;
        if (dir.startsWith(projectRoot || "")) refreshDir(dir);
      } catch (e) {
        console.error("Rename failed:", e);
      }
    }
    setRenaming(false);
  }, [node.path]);

  const handleNewConfirm = useCallback(async (name: string) => {
    const isDir = newItemType === "folder";
    try {
      await invoke("create_file", { path: `${node.path}/${name}`, isDir });
      refreshDir(node.path);
    } catch (e) {
      console.error("Create failed:", e);
    }
    setNewItemType(null);
  }, [node.path, newItemType]);

  return (
    <div>
      {renaming ? (
        <RenameInput
          path={node.path}
          depth={depth}
          onConfirm={handleRenameConfirm}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <div
          className="flex items-center cursor-pointer hover:bg-surface0 px-2 py-0.5 text-sm truncate"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        >
          {node.is_dir && (
            <span className="text-overlay0 mr-1 text-xs">
              {loading ? "⟳" : isExpanded ? "▾" : "▸"}
            </span>
          )}
          <FileIcon name={node.name} isDir={node.is_dir} />
          <span className="truncate">{node.name}</span>
        </div>
      )}
      {node.is_dir && isExpanded && (
        <>
          {node.children?.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
          {newItemType && (
            <NewItemInput
              basePath={node.path}
              isDir={newItemType === "folder"}
              depth={depth}
              onConfirm={handleNewConfirm}
              onCancel={() => setNewItemType(null)}
            />
          )}
        </>
      )}
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

export default function FileTree() {
  const { tree, refreshRoot, projectRoot } = useProjectStore();
  const [showNewRoot, setShowNewRoot] = useState<"file" | "folder" | null>(null);

  const handleNewRoot = useCallback(async (name: string) => {
    if (!projectRoot) return;
    const isDir = showNewRoot === "folder";
    try {
      await invoke("create_file", { path: `${projectRoot}/${name}`, isDir });
      refreshRoot();
    } catch (e) {
      console.error("Create failed:", e);
    }
    setShowNewRoot(null);
  }, [projectRoot, showNewRoot]);

  if (tree.length === 0) {
    return (
      <div className="text-overlay0 text-sm p-4 text-center">
        No project opened
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1">
      <div className="flex items-center justify-end gap-1 px-1.5 py-0.5 border-b border-surface1">
        <button
          onClick={() => setShowNewRoot("file")}
          className="text-[10px] text-overlay0 hover:text-text px-1.5 py-0.5 hover:bg-surface0 rounded transition-colors"
          title="New File"
        >
          +File
        </button>
        <button
          onClick={() => setShowNewRoot("folder")}
          className="text-[10px] text-overlay0 hover:text-text px-1.5 py-0.5 hover:bg-surface0 rounded transition-colors"
          title="New Folder"
        >
          +Folder
        </button>
        <button
          onClick={() => refreshRoot()}
          className="text-[10px] text-overlay0 hover:text-text px-1.5 py-0.5 hover:bg-surface0 rounded transition-colors"
          title="Refresh"
        >
          ⟳
        </button>
      </div>
      {tree.map((node) => (
        <TreeNode key={node.path} node={node} depth={0} />
      ))}
      {showNewRoot && (
        <NewItemInput
          basePath={projectRoot || ""}
          isDir={showNewRoot === "folder"}
          depth={-1}
          onConfirm={handleNewRoot}
          onCancel={() => setShowNewRoot(null)}
        />
      )}
    </div>
  );
}
