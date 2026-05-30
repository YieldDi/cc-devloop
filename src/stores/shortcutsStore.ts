import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ShortcutBinding {
  id: string;
  keys: string;
  label: string;
  category: string;
  defaultKeys: string;
}

const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { id: "save", keys: "⌘S", label: "Save file", category: "File", defaultKeys: "⌘S" },
  { id: "quickOpen", keys: "⌘P", label: "Quick open file", category: "File", defaultKeys: "⌘P" },
  { id: "globalSearch", keys: "⌘⇧F", label: "Global search", category: "Search", defaultKeys: "⌘⇧F" },
  { id: "toggleTerminal", keys: "⌘`", label: "Toggle terminal", category: "View", defaultKeys: "⌘`" },
  { id: "showShortcuts", keys: "⌘/", label: "Keyboard shortcuts", category: "Help", defaultKeys: "⌘/" },
];

interface ShortcutsStore {
  bindings: ShortcutBinding[];
  setBinding: (id: string, keys: string) => void;
  resetBinding: (id: string) => void;
  resetAll: () => void;
  getBinding: (id: string) => string;
}

export const useShortcutsStore = create<ShortcutsStore>()(
  persist(
    (set, get) => ({
      bindings: DEFAULT_SHORTCUTS,

      setBinding: (id, keys) =>
        set((s) => ({
          bindings: s.bindings.map((b) =>
            b.id === id ? { ...b, keys } : b,
          ),
        })),

      resetBinding: (id) =>
        set((s) => ({
          bindings: s.bindings.map((b) =>
            b.id === id ? { ...b, keys: b.defaultKeys } : b,
          ),
        })),

      resetAll: () =>
        set({
          bindings: DEFAULT_SHORTCUTS.map((b) => ({ ...b })),
        }),

      getBinding: (id) => {
        const b = get().bindings.find((b) => b.id === id);
        return b?.keys || "";
      },
    }),
    { name: "cc-devloop-shortcuts" },
  ),
);
