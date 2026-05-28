import type { AgentMessage } from "../../stores/agentStore";
import { useAgentStore } from "../../stores/agentStore";
import MarkdownRenderer from "./MarkdownRenderer";
import ToolCallCard from "./ToolCallCard";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function UserBubble({ message }: { message: AgentMessage }) {
  return (
    <div className="flex justify-end group">
      <div className="max-w-[85%]">
        <div className="bg-[#313244] rounded-2xl rounded-br-sm px-4 py-2.5">
          <div className="text-sm text-[#cdd6f4] whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        <div className="text-[10px] text-[#6c7086] mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: AgentMessage }) {
  const toolCalls = useAgentStore((s) => s.getToolCallsForMessage(message.id));

  return (
    <div className="flex justify-start group">
      <div className="max-w-[95%] py-1">
        <MarkdownRenderer content={message.content} />
        {toolCalls.length > 0 && (
          <div className="mt-2">
            {toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
        <div className="text-[10px] text-[#6c7086] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function SystemBubble({ message }: { message: AgentMessage }) {
  return (
    <div className="flex justify-center py-2">
      <div className="bg-[#f38ba8]/10 border border-[#f38ba8]/20 rounded-lg px-3 py-1.5 max-w-[90%]">
        <div className="text-xs text-[#f38ba8] text-center break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}

export default function MessageBubble({ message }: { message: AgentMessage }) {
  switch (message.role) {
    case "user":
      return <UserBubble message={message} />;
    case "assistant":
      return <AssistantBubble message={message} />;
    case "system":
      return <SystemBubble message={message} />;
  }
}
