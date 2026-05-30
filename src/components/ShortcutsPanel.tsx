import { useEffect, useRef } from "react";
import { SHORTCUTS } from "../hooks/useKeyboardShortcuts";

export default function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Group shortcuts by category
  const categories = SHORTCUTS.reduce<Record<string, typeof SHORTCUTS>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={panelRef}
        className="bg-mantle border border-surface1 rounded-xl shadow-2xl w-[380px] max-h-[80vh] overflow-auto"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface1">
          <h2 className="text-sm font-semibold text-text">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-overlay0 hover:text-text transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"/>
            </svg>
          </button>
        </div>

        <div className="px-4 py-3 space-y-4">
          {Object.entries(categories).map(([category, shortcuts]) => (
            <div key={category}>
              <div className="text-[10px] uppercase tracking-wider text-overlay0 mb-1.5">{category}</div>
              <div className="space-y-1">
                {shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1">
                    <span className="text-xs text-subtext0">{s.label}</span>
                    <kbd className="text-[11px] px-1.5 py-0.5 bg-surface0 rounded border border-surface1 text-text font-mono">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
