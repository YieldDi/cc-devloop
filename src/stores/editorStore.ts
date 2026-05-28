import { create } from "zustand";

export interface OpenFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

interface EditorStore {
  openFiles: Map<string, OpenFile>;
  activeFilePath: string | null;
  openFile: (path: string, content: string, language: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateContent: (path: string, content: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  openFiles: new Map(),
  activeFilePath: null,

  openFile: (path, content, language) =>
    set((state) => {
      const next = new Map(state.openFiles);
      next.set(path, { path, content, language, isDirty: false });
      return { openFiles: next, activeFilePath: path };
    }),

  closeFile: (path) =>
    set((state) => {
      const next = new Map(state.openFiles);
      next.delete(path);
      const paths = Array.from(next.keys());
      const newActive =
        state.activeFilePath === path
          ? paths.length > 0
            ? paths[paths.length - 1]
            : null
          : state.activeFilePath;
      return { openFiles: next, activeFilePath: newActive };
    }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateContent: (path, content) =>
    set((state) => {
      const next = new Map(state.openFiles);
      const file = next.get(path);
      if (file) {
        next.set(path, { ...file, content, isDirty: true });
      }
      return { openFiles: next };
    }),
}));
