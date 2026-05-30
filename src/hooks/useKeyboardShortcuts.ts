import { useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";
import { useShortcutsStore, ShortcutBinding } from "../stores/shortcutsStore";

// Re-export for ShortcutsPanel
export type { ShortcutBinding };
export { useShortcutsStore };

/** Parse shortcut string like "⌘S" or "⌘⇧F" into modifier flags + key */
function parseShortcut(shortcut: string): { mod: boolean; shift: boolean; key: string } {
  let mod = false;
  let shift = false;
  let key = shortcut;

  if (key.includes("⌘")) {
    mod = true;
    key = key.replace("⌘", "");
  }
  if (key.includes("⇧")) {
    shift = true;
    key = key.replace("⇧", "");
  }

  return { mod, shift, key: key.toLowerCase() };
}

export function useKeyboardShortcuts(onToggleShortcuts?: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const store = useShortcutsStore.getState();
      const bindings = store.bindings;

      for (const binding of bindings) {
        const parsed = parseShortcut(binding.keys);

        if (
          mod === parsed.mod &&
          e.shiftKey === parsed.shift &&
          e.key.toLowerCase() === parsed.key
        ) {
          switch (binding.id) {
            case "save":
              e.preventDefault();
              const { activeFilePath, saveFile } = useEditorStore.getState();
              if (activeFilePath) saveFile(activeFilePath);
              break;
            case "toggleTerminal":
              e.preventDefault();
              useEditorStore.getState().toggleTerminal();
              break;
            case "quickOpen":
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("open-palette"));
              break;
            case "globalSearch":
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("open-search"));
              break;
            case "showShortcuts":
              e.preventDefault();
              onToggleShortcuts?.();
              break;
          }
          return; // Only match first binding
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onToggleShortcuts]);
}
