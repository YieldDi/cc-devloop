import { useEffect, useRef, useState } from "react";
import { useShortcutsStore, ShortcutBinding } from "../hooks/useKeyboardShortcuts";

function KeyRecorder({
  current,
  onSave,
  onCancel,
}: {
  current: string;
  onSave: (keys: string) => void;
  onCancel: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      onCancel();
      return;
    }

    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return; // Require modifier key

    let keys = "⌘";
    if (e.shiftKey) keys += "⇧";
    const key = e.key.toUpperCase();
    // Ignore pure modifier keys
    if (["META", "CONTROL", "SHIFT", "ALT"].includes(e.key)) return;
    keys += key;

    onSave(keys);
  };

  return (
    <button
      ref={ref}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      className="px-1.5 py-0.5 bg-blue/20 text-blue rounded border border-blue/40 text-[11px] font-mono outline-none"
    >
      {recording ? "Press shortcut..." : current}
    </button>
  );
}

export default function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { bindings, setBinding, resetBinding, resetAll } = useShortcutsStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Group by category
  const categories = bindings.reduce<Record<string, ShortcutBinding[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={panelRef}
        className="bg-mantle border border-surface1 rounded-xl shadow-2xl w-[420px] max-h-[80vh] overflow-auto"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface1">
          <h2 className="text-sm font-semibold text-text">Keyboard Shortcuts</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="text-[10px] text-overlay0 hover:text-text transition-colors px-1.5 py-0.5 rounded hover:bg-surface0"
            >
              Reset All
            </button>
            <button
              onClick={onClose}
              className="text-overlay0 hover:text-text transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 py-3 space-y-4">
          <p className="text-[10px] text-overlay0">Click a shortcut to edit. Press a new key combination with ⌘ to rebind.</p>

          {Object.entries(categories).map(([category, shortcuts]) => (
            <div key={category}>
              <div className="text-[10px] uppercase tracking-wider text-overlay0 mb-1.5">{category}</div>
              <div className="space-y-1">
                {shortcuts.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1">
                    <span className="text-xs text-subtext0">{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      {editingId === s.id ? (
                        <KeyRecorder
                          current={s.keys}
                          onSave={(keys) => {
                            setBinding(s.id, keys);
                            setEditingId(null);
                          }}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingId(s.id)}
                          className="text-[11px] px-1.5 py-0.5 bg-surface0 rounded border border-surface1 text-text font-mono hover:border-blue transition-colors"
                        >
                          {s.keys}
                        </button>
                      )}
                      {s.keys !== s.defaultKeys && (
                        <button
                          onClick={() => resetBinding(s.id)}
                          className="text-[10px] text-overlay0 hover:text-text transition-colors"
                          title="Reset to default"
                        >
                          ↺
                        </button>
                      )}
                    </div>
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
