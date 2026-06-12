import { useState } from "react";
import { useAgentStore } from "../../stores/agentStore";

export default function AgentHeader() {
  const { isStreaming, chats, activeChatId, createChat, switchChat, deleteChat } = useAgentStore();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="border-b border-surface1/60">
      {/* Main header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-cyan/[0.03] to-transparent">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isStreaming ? "bg-cyan dot-pulse" : "bg-green glow-green"
            }`}
          />
          <span className="text-sm font-medium text-text tracking-wide">Agent</span>
          {isStreaming && (
            <span className="text-[10px] text-cyan/60 uppercase tracking-widest ml-1">Live</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* New chat */}
          <button
            onClick={() => { createChat(); setShowHistory(false); }}
            className="p-1.5 rounded-md text-overlay0 hover:text-cyan hover:bg-surface0/60 transition-all"
            title="New Chat"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 3v10M3 8h10"/>
            </svg>
          </button>
          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-md transition-all ${showHistory ? "text-cyan bg-surface0/60" : "text-overlay0 hover:text-text hover:bg-surface0/60"}`}
            title="Chat History"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M2 8h12M2 12h12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Chat history dropdown */}
      {showHistory && chats.length > 0 && (
        <div className="max-h-52 overflow-y-auto agent-scroll border-t border-surface1/60 bg-crust">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer group transition-all ${
                chat.id === activeChatId ? "bg-cyan/5 border-l-2 border-l-cyan" : "hover:bg-surface0/30 border-l-2 border-l-transparent"
              }`}
              onClick={() => { switchChat(chat.id); setShowHistory(false); }}
            >
              <span className={`text-xs shrink-0 w-4 text-center ${chat.id === activeChatId ? "text-cyan" : "text-overlay0"}`}>
                {chat.id === activeChatId ? "●" : "○"}
              </span>
              <span className="text-xs text-text truncate flex-1">{chat.title}</span>
              <span className="text-[10px] text-overlay0 shrink-0">
                {new Date(chat.updatedAt).toLocaleDateString()}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                className="opacity-0 group-hover:opacity-100 text-overlay0 hover:text-red transition-all text-xs shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
