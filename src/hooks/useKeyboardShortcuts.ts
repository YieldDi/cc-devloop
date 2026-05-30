import { useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";

export interface ShortcutDef {
  keys: string;
  label: string;
  category: string;
}

// Central shortcut registry — consumed by shortcut help panel
export const SHORTCUTS: ShortcutDef[] = [
  { keys: "⌘S", label: "Save file", category: "File" },
  { keys: "⌘P", label: "Quick open file", category: "File" },
  { keys: "⌘⇧F", label: "Global search", category: "Search" },
  { keys: "⌘`", label: "Toggle terminal", category: "View" },
  { keys: "⌘/", label: "Keyboard shortcuts", category: "Help" },
];

export function useKeyboardShortcuts(onToggleShortcuts?: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘S — save current file
      if (mod && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        const { activeFilePath, saveFile } = useEditorStore.getState();
        if (activeFilePath) saveFile(activeFilePath);
      }

      // ⌘` — toggle terminal
      if (mod && e.key === "`") {
        e.preventDefault();
        useEditorStore.getState().toggleTerminal();
      }

      // ⌘P — quick open (dispatch custom event for Palette component to pick up)
      if (mod && e.key === "p" && !e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-palette"));
      }

      // ⌘⇧F — global search
      if (mod && e.shiftKey && e.key === "F") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-search"));
      }

      // ⌘/ — keyboard shortcuts
      if (mod && e.key === "/") {
        e.preventDefault();
        onToggleShortcuts?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onToggleShortcuts]);
}
