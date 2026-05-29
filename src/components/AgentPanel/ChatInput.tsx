import { useRef, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAgentStore } from "../../stores/agentStore";
import { useProjectStore } from "../../stores/projectStore";

let currentMessageId: string | null = null;
let listenerSetup = false;
// Track Tauri listener for cleanup
let _unlistenFn: (() => void) | null = null;

export default function ChatInput() {
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const currentStream = useAgentStore((s) => s.currentStream);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");

  const effectivelyStreaming = isStreaming && currentStream.length > 0;

  // Set up Tauri event listener once
  useEffect(() => {
    if (listenerSetup) return;
    listenerSetup = true;

    listen<string>("agent:message", (event) => {
      try {
        const msg = JSON.parse(event.payload);
        handleEventMessage(msg);
      } catch {
        // ignore
      }
    }).then((fn) => {
      _unlistenFn = fn;
    }).catch(() => {});
  }, []);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  };

  const handleSend = async (text?: string) => {
    const msg = (text || value).trim();
    if (!msg) return;
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const store = useAgentStore.getState();
    const projectRoot = useProjectStore.getState().projectRoot;

    if (!projectRoot) {
      store.addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: "Please open a project first",
        timestamp: Date.now(),
      });
      return;
    }

    const msgId = crypto.randomUUID();
    currentMessageId = msgId;

    store.addMessage({
      id: msgId,
      role: "user",
      content: msg,
      timestamp: Date.now(),
    });

    store.clearStream();
    store.setStreaming(true);

    try {
      // Ensure agent started
      const running = await invoke<boolean>("is_agent_running").catch(() => false);
      if (!running) {
        store.setStreaming(false);
        console.log("[Agent] Starting...");
        await invoke("start_agent", { projectPath: projectRoot });
        store.setStreaming(true);
        await new Promise((r) => setTimeout(r, 500));
      }

      // Send message
      await invoke("send_agent_message", { content: msg });
    } catch (e) {
      store.addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `Failed: ${e}`,
        timestamp: Date.now(),
      });
      store.setStreaming(false);
      currentMessageId = null;
    }
  };

  const handleStop = async () => {
    try {
      await invoke("stop_agent");
    } catch {
      // ignore
    }
    useAgentStore.getState().finishStream();
    currentMessageId = null;
  };

  // Listen for suggestion clicks from EmptyState
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent).detail as string;
      handleSend(text);
    };
    window.addEventListener("agent-send", handler);
    return () => window.removeEventListener("agent-send", handler);
  }, []);

  return (
    <div className="px-3 pb-3 pt-2">
      <div className="relative flex items-end bg-[#313244] rounded-2xl border border-[#45475a] focus-within:border-[#89b4fa] transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            adjustHeight();
          }}
          rows={1}
          placeholder="Message the agent..."
          className="flex-1 bg-transparent text-sm text-[#cdd6f4] placeholder-[#6c7086] px-4 py-3 resize-none outline-none max-h-[150px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="flex items-center pr-2 pb-2">
          {effectivelyStreaming ? (
            <button
              onClick={handleStop}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f38ba8] hover:bg-[#eba0ac] text-[#11111b] transition-colors"
              title="Stop"
            >
              ■
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!value.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#89b4fa] hover:bg-[#b4befe] disabled:opacity-30 disabled:cursor-not-allowed text-[#11111b] transition-colors"
              title="Send (⌘+Enter)"
            >
              ↑
            </button>
          )}
        </div>
      </div>
      <div className="text-center mt-1">
        <span className="text-[10px] text-[#6c7086]">⌘+Enter to send</span>
      </div>
    </div>
  );
}

function handleEventMessage(msg: Record<string, unknown>) {
  const { appendStream, finishStream, addMessage, addToolCall, updateToolCallById } =
    useAgentStore.getState();

  switch (msg.type) {
    case "stream":
      if (msg.content) appendStream(msg.content as string);
      break;
    case "assistant_text":
      if (msg.content) appendStream(msg.content as string);
      break;
    case "tool_use":
      addToolCall({
        id: crypto.randomUUID(),
        messageId: currentMessageId ?? undefined,
        name: (msg.name as string) || "unknown",
        input: (msg.input as Record<string, unknown>) || {},
        status: "running",
        timestamp: Date.now(),
      });
      break;
    case "tool_result":
      if (msg.toolUseId) {
        updateToolCallById(msg.toolUseId as string, (msg.content as string) || "", "completed");
      }
      break;
    case "warning":
      if (msg.content) appendStream(`\n⚠️ ${msg.content}\n`);
      break;
    case "done":
      finishStream();
      currentMessageId = null;
      break;
    case "error":
      addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `❌ ${msg.content}`,
        timestamp: Date.now(),
      });
      finishStream();
      currentMessageId = null;
      break;
  }
}
