import { useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";
import { useProjectStore } from "../stores/projectStore";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘S — save current file
      if (mod && e.key === "s") {
        e.preventDefault();
        const { activeFilePath, saveFile } = useEditorStore.getState();
        if (activeFilePath) saveFile(activeFilePath);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
