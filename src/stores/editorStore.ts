import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface OpenFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export interface PendingDiff {
  id: string;
  path: string;
  original: string;
  modified: string;
  language: string;
}

interface EditorStore {
  openFiles: Map<string, OpenFile>;
  activeFilePath: string | null;
  pendingDiffs: PendingDiff[];
  activeDiffId: string | null;
  openFile: (path: string, content: string, language: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  refreshFile: (path: string) => Promise<void>;
  addPendingDiff: (diff: PendingDiff) => void;
  acceptDiff: (diffId: string) => Promise<void>;
  rejectDiff: (diffId: string) => void;
  setActiveDiff: (id: string | null) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  openFiles: new Map(),
  activeFilePath: null,
  pendingDiffs: [],
  activeDiffId: null,

  openFile: (path, content, language) =>
    set((state) => {
      const next = new Map(state.openFiles);
      next.set(path, { path, content, language, isDirty: false });
      return { openFiles: next, activeFilePath: path, activeDiffId: null };
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

  setActiveFile: (path) => set({ activeFilePath: path, activeDiffId: null }),

  updateContent: (path, content) =>
    set((state) => {
      const next = new Map(state.openFiles);
      const file = next.get(path);
      if (file) {
        next.set(path, { ...file, content, isDirty: true });
      }
      return { openFiles: next };
    }),

  refreshFile: async (path: string) => {
    const { openFiles } = get();
    const file = openFiles.get(path);
    if (!file) return;
    try {
      const content = await invoke<string>("read_file", { path });
      set((state) => {
        const next = new Map(state.openFiles);
        next.set(path, { ...file, content, isDirty: false });
        return { openFiles: next };
      });
    } catch {
      // File might not exist yet
    }
  },

  addPendingDiff: (diff) =>
    set((state) => ({
      pendingDiffs: [...state.pendingDiffs, diff],
      activeDiffId: diff.id,
    })),

  acceptDiff: async (diffId) => {
    const { pendingDiffs } = get();
    const diff = pendingDiffs.find((d) => d.id === diffId);
    if (!diff) return;

    // Write the modified content to disk
    try {
      await invoke("write_file", { path: diff.path, content: diff.modified });
    } catch {
      // ignore
    }

    // Update the open file if it's in the editor
    const { openFiles } = get();
    const file = openFiles.get(diff.path);
    if (file) {
      set((state) => {
        const next = new Map(state.openFiles);
        next.set(diff.path, { ...file, content: diff.modified, isDirty: false });
        return { openFiles: next };
      });
    }

    // Remove the diff
    set((state) => ({
      pendingDiffs: state.pendingDiffs.filter((d) => d.id !== diffId),
      activeDiffId: null,
    }));
  },

  rejectDiff: (diffId) =>
    set((state) => ({
      pendingDiffs: state.pendingDiffs.filter((d) => d.id !== diffId),
      activeDiffId: null,
    })),

  setActiveDiff: (id) => set({ activeDiffId: id }),
}));
