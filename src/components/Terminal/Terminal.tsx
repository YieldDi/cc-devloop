import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "@xterm/xterm/css/xterm.css";
import { useThemeStore } from "../../stores/themeStore";
import { useProjectStore } from "../../stores/projectStore";

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

export default function TerminalPanel() {
  const termRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!termRef.current || termInstance.current) return;

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
    term.open(termRef.current);
    fitAddon.fit();

    termInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Start PTY
    const projectRoot = useProjectStore.getState().projectRoot;
    invoke("start_terminal", { cwd: projectRoot }).catch((e) => {
      term.writeln(`\x1b[31mFailed to start terminal: ${e}\x1b[0m`);
    });

    // Send user input to PTY
    const inputDisposable = term.onData((data) => {
      invoke("write_terminal", { data }).catch(() => {});
    });

    // Listen for PTY output
    let unlisten: (() => void) | undefined;
    listen<string>("terminal:output", (event) => {
      term.write(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      inputDisposable.dispose();
      unlisten?.();
      window.removeEventListener("resize", handleResize);
      term.dispose();
      termInstance.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Subscribe to theme changes
  useEffect(() => {
    const unsub = useThemeStore.subscribe((state) => {
      if (termInstance.current) {
        termInstance.current.options.theme = TERMINAL_THEMES[state.theme];
      }
    });
    return unsub;
  }, []);

  return <div ref={termRef} className="h-full w-full" />;
}
