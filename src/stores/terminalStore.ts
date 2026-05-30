import { create } from "zustand";

export interface TermTab {
  id: string;
  title: string;
  ptyId?: string;
}

interface TerminalStore {
  tabs: TermTab[];
  activeId: string | null;
  addTab: (id: string, title: string) => void;
  removeTab: (id: string) => void;
  setActive: (id: string) => void;
  updateTab: (id: string, title: string, ptyId: string) => void;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  tabs: [],
  activeId: null,

  addTab: (id, title) =>
    set((s) => ({
      tabs: [...s.tabs, { id, title }],
      activeId: id,
    })),

  removeTab: (id) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeId =
        s.activeId === id
          ? tabs.length > 0
            ? tabs[tabs.length - 1].id
            : null
          : s.activeId;
      return { tabs, activeId };
    }),

  setActive: (id) => set({ activeId: id }),

  updateTab: (id, title, ptyId) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, title, ptyId } : t,
      ),
    })),
}));
