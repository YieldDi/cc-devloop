import { create } from "zustand";

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

export const useProjectStore = create<ProjectStore>((set) => ({
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
  reset: () => set({ projectRoot: null, tree: [], expandedDirs: new Set() }),
}));
