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
  toggleDir: (path: string) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projectRoot: null,
  tree: [],
  expandedDirs: new Set(),

  setProjectRoot: (path) => set({ projectRoot: path }),
  setTree: (tree) => set({ tree }),
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
