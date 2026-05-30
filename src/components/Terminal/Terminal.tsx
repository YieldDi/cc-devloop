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
    background: "#181825",
    foreground: "#cdd6f4",
    cursor: "#f5e0dc",
  },
  light: {
    background: "#e6e9ef",
    foreground: "#4c4f69",
    cursor: "#dc8a78",
  },
};

let tabCounter = 1;

/** A single terminal instance — receives a stable ID from parent */
function TermInstance({ tabId, active }: { tabId: string; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const ptyIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || startedRef.current) return;
    startedRef.current = true;

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
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    // Start PTY
    const projectRoot = useProjectStore.getState().projectRoot;
    invoke<string>("start_terminal", { cwd: projectRoot })
      .then((ptyId) => {
        ptyIdRef.current = ptyId;
        // Update tab title
        useTerminalStore.getState().updateTab(tabId, `Terminal ${ptyId.split("-")[1]}`, ptyId);
      })
      .catch((e) => {
        term.writeln(`\x1b[31mFailed to start terminal: ${e}\x1b[0m`);
      });

    // Send user input to PTY
    const inputDisposable = term.onData((data) => {
      const pid = ptyIdRef.current;
      if (pid) invoke("write_terminal", { id: pid, data }).catch(() => {});
    });

    // Listen for PTY output — filter by this terminal's PTY ID
    let unlisten: (() => void) | undefined;
    listen<{ id: string; data: string }>("terminal:output", (event) => {
      if (event.payload.id === ptyIdRef.current) {
        term.write(event.payload.data);
      }
    }).then((fn) => {
      unlisten = fn;
    });

    // Listen for terminal exit
    let unlistenExit: (() => void) | undefined;
    listen<{ id: string }>("terminal:exit", (event) => {
      if (event.payload.id === ptyIdRef.current) {
        term.writeln("\r\n\x1b[33m[Process exited]\x1b[0m");
      }
    }).then((fn) => {
      unlistenExit = fn;
    });

    const handleResize = () => {
      if (containerRef.current?.offsetParent) fitAddon.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      inputDisposable.dispose();
      unlisten?.();
      unlistenExit?.();
      window.removeEventListener("resize", handleResize);
      const pid = ptyIdRef.current;
      if (pid) invoke("close_terminal", { id: pid }).catch(() => {});
      term.dispose();
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
      <div className="flex items-center bg-surface0 border-b border-surface1 shrink-0 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] cursor-pointer border-r border-surface1 shrink-0 ${
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
                x
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAdd}
          className="px-2 py-1 text-[11px] text-overlay0 hover:text-text transition-colors shrink-0"
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
