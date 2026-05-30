import { useState } from "react";
import { useThemeStore } from "../../stores/themeStore";

export default function SettingsPanel({ trigger }: { trigger?: React.ReactNode }) {
  const { theme, setTheme, fontSize, setFontSize } = useThemeStore();
  const [open, setOpen] = useState(false);

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
          <div
            className="w-80 rounded-xl bg-base border border-surface1 shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-text">Settings</h2>
              <button onClick={() => setOpen(false)} className="text-overlay0 hover:text-text transition-colors text-sm p-1 rounded hover:bg-surface0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13"/>
                </svg>
              </button>
            </div>

            {/* Theme */}
            <div className="mb-5">
              <label className="text-xs text-overlay0 mb-2 block font-medium">Theme</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${
                    theme === "light"
                      ? "bg-blue text-crust border-blue font-medium"
                      : "bg-surface0 text-text border-surface1 hover:border-surface2"
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${
                    theme === "dark"
                      ? "bg-blue text-crust border-blue font-medium"
                      : "bg-surface0 text-text border-surface1 hover:border-surface2"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-xs text-overlay0 mb-2 block font-medium">Font Size</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface0 border border-surface1 text-text hover:border-surface2 transition-colors text-sm"
                >
                  -
                </button>
                <span className="text-sm text-text w-12 text-center tabular-nums">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface0 border border-surface1 text-text hover:border-surface2 transition-colors text-sm"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-overlay0 mt-1.5">Range: 12px - 20px</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
