import { useAgentStore } from "../../stores/agentStore";

export default function AgentHeader() {
  const { isStreaming, reset } = useAgentStore();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isStreaming
              ? "bg-[#f9e2af] animate-pulse"
              : "bg-[#a6e3a1]"
          }`}
        />
        <span className="text-sm font-medium text-[#cdd6f4]">Agent</span>
      </div>
      <button
        onClick={reset}
        className="text-[#6c7086] hover:text-[#cdd6f4] transition-colors text-xs"
        title="Clear chat"
      >
        ✕
      </button>
    </div>
  );
}
