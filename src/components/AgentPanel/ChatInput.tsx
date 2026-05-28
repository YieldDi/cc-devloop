import { useRef, useState, useEffect } from "react";
import { useAgentStore } from "../../stores/agentStore";
import { useAgent } from "../../hooks/useAgent";

export default function ChatInput() {
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const { sendMessage, stopAgent } = useAgent();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  };

  const handleSend = (text?: string) => {
    const msg = (text || value).trim();
    if (!msg) return;
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendMessage(msg);
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
          {isStreaming ? (
            <button
              onClick={stopAgent}
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
