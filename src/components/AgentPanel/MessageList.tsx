import { useEffect, useRef } from "react";
import { useAgentStore } from "../../stores/agentStore";
import EmptyState from "./EmptyState";
import MessageBubble from "./MessageBubble";
import StreamingMessage from "./StreamingMessage";

export default function MessageList() {
  const { messages, isStreaming, currentStream } = useAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, currentStream]);

  if (messages.length === 0 && !isStreaming) {
    return <EmptyState />;
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto agent-scroll px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isStreaming && currentStream && (
        <StreamingMessage content={currentStream} />
      )}
      {isStreaming && !currentStream && (
        <div className="flex justify-start py-1">
          <div className="flex items-center gap-2 text-xs text-[#6c7086]">
            <span className="animate-spin">⟳</span> Thinking...
          </div>
        </div>
      )}
    </div>
  );
}
