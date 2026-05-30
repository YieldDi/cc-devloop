import { useState } from "react";
import { useThemeStore } from "../../stores/themeStore";
import { useShortcutsStore } from "../../stores/shortcutsStore";

type Section = "appearance" | "editor" | "shortcuts" | "about";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "appearance", label: "Appearance", icon: "theme" },
  { id: "editor", label: "Editor", icon: "editor" },
  { id: "shortcuts", label: "Shortcuts", icon: "shortcuts" },
  { id: "about", label: "About", icon: "about" },
];

function SectionIcon({ type }: { type: string }) {
  switch (type) {
    case "theme":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12.5V2.5a5.5 5.5 0 0 1 0 11z"/>
        </svg>
      );
    case "editor":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 2h12v12H2z"/>
          <path d="M5 2v12M2 5h12M2 8h12"/>
        </svg>
      );
    case "shortcuts":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="3" width="14" height="10" rx="2"/>
          <path d="M4 6h1M7 6h2M11 6h1M4 9h2M8 9h1M11 9h1"/>
        </svg>
      );
    case "about":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm6.5-.25A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75zM8 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
      );
    default:
      return null;
  }
}

function AppearanceSection() {
  const { theme, setTheme } = useThemeStore();
  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-subtext0 mb-2 block">Theme</label>
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 px-3 py-2.5 text-xs rounded-lg border transition-colors capitalize ${
                theme === t
                  ? "bg-blue text-crust border-blue font-medium"
                  : "bg-surface0 text-text border-surface1 hover:border-surface2"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorSection() {
  const { fontSize, setFontSize } = useThemeStore();
  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-subtext0 mb-2 block">Font Size</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={12}
            max={20}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="flex-1 accent-blue"
          />
          <span className="text-xs text-text w-10 text-right tabular-nums">{fontSize}px</span>
        </div>
        <p className="text-[10px] text-overlay0 mt-1">Controls code editor font size</p>
      </div>
    </div>
  );
}

function ShortcutsSection() {
  const { bindings, setBinding, resetBinding, resetAll } = useShortcutsStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = bindings.reduce<Record<string, typeof bindings>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape") { setEditingId(null); return; }
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    let keys = "⌘";
    if (e.shiftKey) keys += "⇧";
    if (["META", "CONTROL", "SHIFT", "ALT"].includes(e.key)) return;
    keys += e.key.toUpperCase();
    setBinding(id, keys);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={resetAll} className="text-[10px] text-overlay0 hover:text-text transition-colors px-1.5 py-0.5 rounded hover:bg-surface0">
          Reset All
        </button>
      </div>
      <p className="text-[10px] text-overlay0">Click a shortcut to rebind. Press new combination with ⌘.</p>

      {Object.entries(categories).map(([category, shortcuts]) => (
        <div key={category}>
          <div className="text-[10px] uppercase tracking-wider text-overlay0 mb-1.5">{category}</div>
          <div className="space-y-1">
            {shortcuts.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1">
                <span className="text-xs text-subtext0">{s.label}</span>
                <div className="flex items-center gap-1.5">
                  {editingId === s.id ? (
                    <input
                      autoFocus
                      readOnly
                      onKeyDown={(e) => handleKeyDown(e, s.id)}
                      onBlur={() => setEditingId(null)}
                      value="Press shortcut..."
                      className="px-1.5 py-0.5 bg-blue/20 text-blue rounded border border-blue/40 text-[11px] font-mono outline-none w-24 text-center"
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
                    <button onClick={() => resetBinding(s.id)} className="text-[10px] text-overlay0 hover:text-text transition-colors" title="Reset">
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
  );
}

function AboutSection() {
  return (
    <div className="space-y-3">
      <div className="text-lg font-bold text-text">cc-devloop</div>
      <p className="text-xs text-subtext0">AI-driven development environment</p>
      <div className="text-[10px] text-overlay0 space-y-0.5">
        <div>Version 0.1.0</div>
        <div>Built with Tauri + React + Rust</div>
      </div>
    </div>
  );
}

export default function SettingsPanel({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("appearance");

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger || (
          <button
            className="p-1.5 rounded-md text-overlay0 hover:text-text hover:bg-surface0 transition-colors"
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="2.5"/>
              <path d="M13.1 10a1.2 1.2 0 0 0 .24 1.32l.04.04a1.45 1.45 0 1 1-2.06 2.06l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.73 1.1v.11a1.45 1.45 0 0 1-2.9 0v-.06a1.2 1.2 0 0 0-.79-1.1 1.2 1.2 0 0 0-1.32.24l-.04.04a1.45 1.45 0 1 1-2.06-2.06l.04-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.73h-.11a1.45 1.45 0 0 1 0-2.9h.06a1.2 1.2 0 0 0 1.1-.79 1.2 1.2 0 0 0-.24-1.32l-.04-.04a1.45 1.45 0 1 1 2.06-2.06l.04.04a1.2 1.2 0 0 0 1.32.24H6a1.2 1.2 0 0 0 .73-1.1v-.11a1.45 1.45 0 0 1 2.9 0v.06a1.2 1.2 0 0 0 .79 1.1 1.2 1.2 0 0 0 1.32-.24l.04-.04a1.45 1.45 0 1 1 2.06 2.06l-.04.04a1.2 1.2 0 0 0-.24 1.32v.01a1.2 1.2 0 0 0 1.1.73h.11a1.45 1.45 0 0 1 0 2.9h-.06a1.2 1.2 0 0 0-1.1.79z"/>
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          {/* Settings modal — centered */}
          <div
            className="w-[520px] h-[480px] bg-mantle border border-surface1 rounded-xl flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface1 shrink-0">
              <h2 className="text-sm font-semibold text-text">Settings</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-overlay0 hover:text-text transition-colors p-1 rounded hover:bg-surface0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13"/>
                </svg>
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Left nav */}
              <div className="w-[130px] border-r border-surface1 py-2 shrink-0">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      section === s.id
                        ? "text-text bg-surface0"
                        : "text-overlay0 hover:text-text hover:bg-surface0/50"
                    }`}
                  >
                    <SectionIcon type={s.icon} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Right content */}
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                {section === "appearance" && <AppearanceSection />}
                {section === "editor" && <EditorSection />}
                {section === "shortcuts" && <ShortcutsSection />}
                {section === "about" && <AboutSection />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
