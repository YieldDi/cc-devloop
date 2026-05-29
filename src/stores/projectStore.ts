import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

interface ProjectStore {
  projectRoot: string | null;
  tree: FileNode[];
  expandedDirs: Set<string>;
  setProjectRoot: (path: string) => void;
  setTree: (tree: FileNode[]) => void;
  setChildren: (dirPath: string, children: FileNode[]) => void;
  toggleDir: (path: string) => void;
  /** Refresh a specific directory's children (e.g. after agent writes a file) */
  refreshDir: (dirPath: string) => Promise<void>;
  /** Refresh the root tree */
  refreshRoot: () => Promise<void>;
  reset: () => void;
}

/** Recursively set children on the matching directory node */
function setChildrenInTree(nodes: FileNode[], dirPath: string, children: FileNode[]): FileNode[] {
  return nodes.map((node) => {
    if (node.path === dirPath) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: setChildrenInTree(node.children, dirPath, children) };
    }
    return node;
  });
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projectRoot: null,
      tree: [],
      expandedDirs: new Set(),

      setProjectRoot: (path) => set({ projectRoot: path }),
      setTree: (tree) => set({ tree }),
      setChildren: (dirPath, children) =>
        set((state) => ({
          tree: setChildrenInTree(state.tree, dirPath, children),
        })),
      toggleDir: (path) =>
        set((state) => {
          const next = new Set(state.expandedDirs);
          if (next.has(path)) {
            next.delete(path);
          } else {
            next.add(path);
          }
          return { expandedDirs: next };
        }),
      refreshDir: async (dirPath: string) => {
        try {
          const children = await invoke<FileNode[]>("read_dir_children", { path: dirPath });
          set((state) => {
            const newTree = setChildrenInTree(state.tree, dirPath, children);
            // If the dir wasn't in the tree yet (never expanded), find the parent
            // and inject it. This handles agent-created files in unexpanded dirs.
            const treeChanged = newTree !== state.tree;
            if (treeChanged) return { tree: newTree };

            // Dir not found in tree — try to inject under its parent
            const lastSep = Math.max(dirPath.lastIndexOf("/"), dirPath.lastIndexOf("\\"));
            const parentPath = dirPath.substring(0, lastSep);
            const dirName = dirPath.substring(lastSep + 1);
            if (!parentPath) return state;

            const injectIntoParent = (nodes: FileNode[]): FileNode[] => {
              for (const node of nodes) {
                if (node.path === parentPath && node.is_dir) {
                  const newChild: FileNode = { name: dirName, path: dirPath, is_dir: true, children };
                  const existing = node.children?.find(c => c.path === dirPath);
                  if (existing) {
                    // Already listed but had no children set — update it
                    return nodes.map(n =>
                      n.path === parentPath
                        ? { ...n, children: n.children!.map(c => c.path === dirPath ? { ...c, children } : c) }
                        : n
                    );
                  }
                  return nodes.map(n =>
                    n.path === parentPath
                      ? { ...n, children: [...(n.children || []), newChild] }
                      : n
                  );
                }
                if (node.children) {
                  const result = injectIntoParent(node.children);
                  if (result !== node.children) {
                    return nodes.map(n => n === node ? { ...n, children: result } : n);
                  }
                }
              }
              return nodes;
            };

            const injected = injectIntoParent(state.tree);
            return injected !== state.tree ? { tree: injected } : state;
          });
        } catch {
          // ignore
        }
      },
      refreshRoot: async () => {
        const { projectRoot } = get();
        if (!projectRoot) return;
        try {
          const newRoot = await invoke<FileNode[]>("read_project_tree", { path: projectRoot });
          set((state) => ({
            // Merge: keep existing children for nodes that were already expanded
            tree: newRoot.map((newNode) => {
              const existing = state.tree.find((n) => n.path === newNode.path);
              if (existing?.children) {
                return { ...newNode, children: existing.children };
              }
              return newNode;
            }),
          }));
        } catch {
          // ignore
        }
      },
      reset: () => set({ projectRoot: null, tree: [], expandedDirs: new Set() }),
    }),
    {
      name: "cc-devloop-project",
      partialize: (state) => ({ projectRoot: state.projectRoot }),
    },
  ),
);
