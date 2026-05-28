import { useEffect, useRef } from "react";
import { useAgentStore } from "../../stores/agentStore";
import { useAgent } from "../../hooks/useAgent";

export default function ChatPanel() {
  const { messages, isStreaming, currentStream } = useAgentStore();
  const { sendMessage, stopAgent } = useAgent();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, currentStream]);

  const handleSend = () => {
    const input = inputRef.current;
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm rounded-lg p-2.5 ${
              msg.role === "user"
                ? "bg-blue-600/20 ml-6"
                : msg.role === "system"
                  ? "bg-red-900/20 border border-red-800/30"
                  : "bg-white/5 mr-2"
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          </div>
        ))}
        {isStreaming && currentStream && (
          <div className="text-sm bg-white/5 rounded-lg p-2.5 mr-2 whitespace-pre-wrap break-words">
            {currentStream}
            <span className="animate-pulse">▊</span>
          </div>
        )}
        {!isStreaming && messages.length === 0 && (
          <div className="text-gray-500 text-sm text-center mt-8">
            Describe what you want to build...
            <br />
            <span className="text-xs">⌘+Enter to send</span>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 p-2">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="flex-1 bg-white/5 text-white text-sm rounded-lg p-2.5 resize-none border border-white/10 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Ask the agent..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleSend}
              disabled={isStreaming}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded"
            >
              Send
            </button>
            {isStreaming && (
              <button
                onClick={stopAgent}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 rounded"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
