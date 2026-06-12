import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "@xterm/xterm/css/xterm.css";
import { useThemeStore } from "../../stores/themeStore";
import { useProjectStore } from "../../stores/projectStore";
import { useTerminalStore } from "../../stores/terminalStore";

const TERMINAL_THEMES = {
  dark: {
    background: "#0b0e15",
    foreground: "#d4daf0",
    cursor: "#00e5ff",
    cursorAccent: "#0f1219",
    selectionBackground: "#00e5ff25",
    black: "#0b0e15",
    red: "#ff4d6a",
    green: "#3df5a0",
    yellow: "#f0c050",
    blue: "#4da6ff",
    magenta: "#8b9cf7",
    cyan: "#00e5ff",
    white: "#d4daf0",
    brightBlack: "#4a5270",
    brightRed: "#ff7a8a",
    brightGreen: "#3df5a0",
    brightYellow: "#f0c050",
    brightBlue: "#4da6ff",
    brightMagenta: "#8b9cf7",
    brightCyan: "#00e5ff",
    brightWhite: "#d4daf0",
  },
  light: {
    background: "#eef0f5",
    foreground: "#1a1e36",
    cursor: "#0060c0",
    selectionBackground: "#0060c020",
    black: "#1a1e36",
    red: "#d01040",
    green: "#009a58",
    yellow: "#c08800",
    blue: "#0060e0",
    magenta: "#5060e8",
    cyan: "#0090b8",
    white: "#1a1e36",
    brightBlack: "#6b7294",
    brightRed: "#e0335a",
    brightGreen: "#00b868",
    brightYellow: "#d8a020",
    brightBlue: "#2080ff",
    brightMagenta: "#6070f0",
    brightCyan: "#00a8d0",
    brightWhite: "#1a1e36",
  },
};

let tabCounter = 1;

/** A single terminal instance — receives a stable ID from parent */
function TermInstance({ tabId, active }: { tabId: string; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous content (handles React strict mode re-mount)
    container.innerHTML = "";

    const theme = useThemeStore.getState().theme;
    const term = new Terminal({
      theme: TERMINAL_THEMES[theme],
      fontSize: 13,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    const ptyId = `pty-${tabId}`;

    let unlisten: (() => void) | undefined;
    let unlistenExit: (() => void) | undefined;
    let alive = true;

    (async () => {
      // 1. Register listeners first
      const outputUnlisten = await listen<{ id: string; data: string }>("terminal:output", (event) => {
        if (event.payload.id === ptyId) {
          term.write(event.payload.data);
        }
      });
      if (!alive) { outputUnlisten(); return; }
      unlisten = outputUnlisten;

      const exitUnlisten = await listen<{ id: string }>("terminal:exit", (event) => {
        if (event.payload.id === ptyId) {
          term.writeln("\r\n\x1b[33m[Process exited]\x1b[0m");
        }
      });
      if (!alive) { exitUnlisten(); return; }
      unlistenExit = exitUnlisten;

      // 2. Start PTY
      const projectRoot = useProjectStore.getState().projectRoot;
      try {
        await invoke<string>("start_terminal", { id: ptyId, cwd: projectRoot });
        // Extract number from tabId (e.g. "tab-1" → "1")
        const num = tabId.split("-")[1] || tabCounter;
        useTerminalStore.getState().updateTab(tabId, `Terminal ${num}`, ptyId);
      } catch (e) {
        term.writeln(`\x1b[31mFailed to start terminal: ${e}\x1b[0m`);
      }
    })();

    // Send user input to PTY
    const inputDisposable = term.onData((data) => {
      invoke("write_terminal", { id: ptyId, data }).catch(() => {});
    });

    const handleResize = () => {
      if (container.offsetParent) fitAddon.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      alive = false;
      inputDisposable.dispose();
      unlisten?.();
      unlistenExit?.();
      window.removeEventListener("resize", handleResize);
      invoke("close_terminal", { id: ptyId }).catch(() => {});
      term.dispose();
      container.innerHTML = "";
    };
  }, [tabId]);

  // Subscribe to theme changes
  useEffect(() => {
    const unsub = useThemeStore.subscribe((state) => {
      if (termRef.current) {
        termRef.current.options.theme = TERMINAL_THEMES[state.theme];
      }
    });
    return unsub;
  }, []);

  // Fit when becoming active
  useEffect(() => {
    if (active && fitRef.current) {
      setTimeout(() => fitRef.current?.fit(), 0);
    }
  }, [active]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ display: active ? "block" : "none" }}
    />
  );
}

/** Multi-tab terminal panel */
export default function TerminalPanel() {
  const { tabs, activeId, setActive, addTab, removeTab } = useTerminalStore();

  // Create initial tab on first render
  const initializedRef = useRef(false);
  if (!initializedRef.current && tabs.length === 0) {
    initializedRef.current = true;
    const id = `tab-${tabCounter++}`;
    addTab(id, "Terminal 1");
  }

  const handleAdd = useCallback(() => {
    const id = `tab-${tabCounter++}`;
    addTab(id, `Terminal ${tabCounter - 1}`);
  }, [addTab]);

  const handleClose = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeTab(id);
    },
    [removeTab],
  );

  const effectiveActive = activeId ?? tabs[0]?.id;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center bg-surface0/30 border-b border-surface1/40 shrink-0 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] cursor-pointer border-r border-surface1/30 shrink-0 transition-all ${
              tab.id === effectiveActive
                ? "bg-mantle text-text"
                : "text-overlay0 hover:text-text"
            }`}
          >
            <span>{tab.title}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => handleClose(tab.id, e)}
                className="text-overlay0 hover:text-red transition-colors ml-0.5"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAdd}
          className="px-2 py-1 text-[11px] text-overlay0 hover:text-cyan transition-colors shrink-0"
          title="New Terminal"
        >
          +
        </button>
      </div>

      {/* Terminal instances — keyed by stable tab ID */}
      <div className="flex-1 min-h-0">
        {tabs.map((tab) => (
          <TermInstance
            key={tab.id}
            tabId={tab.id}
            active={tab.id === effectiveActive}
          />
        ))}
      </div>
    </div>
  );
}
