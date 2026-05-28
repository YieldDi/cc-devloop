import AgentHeader from "./AgentHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function ChatPanel() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AgentHeader />
      <MessageList />
      <ChatInput />
    </div>
  );
}
