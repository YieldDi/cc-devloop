import { create } from "zustand";
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

export const useProjectStore = create<ProjectStore>((set, get) => ({
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
      set((state) => ({
        tree: setChildrenInTree(state.tree, dirPath, children),
      }));
    } catch {
      // ignore
    }
  },
  refreshRoot: async () => {
    const { projectRoot } = get();
    if (!projectRoot) return;
    try {
      const tree = await invoke<FileNode[]>("read_project_tree", { path: projectRoot });
      set({ tree });
    } catch {
      // ignore
    }
  },
  reset: () => set({ projectRoot: null, tree: [], expandedDirs: new Set() }),
}));
