import AgentHeader from "./AgentHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useAgentStore } from "../../stores/agentStore";

export default function ChatPanel() {
  const agentRunning = useAgentStore((s) => s.agentRunning);
  const hasMessages = useAgentStore((s) => s.activeMessages().length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AgentHeader />
      {!agentRunning && hasMessages && (
        <div className="px-3 py-1.5 text-[11px] text-yellow bg-yellow/10 border-b border-surface1 shrink-0">
          Agent stopped — sending a message will restart it
        </div>
      )}
      <MessageList />
      <ChatInput />
    </div>
  );
}
