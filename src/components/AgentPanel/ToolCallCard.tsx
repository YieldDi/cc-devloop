import { useState } from "react";
import type { ToolCallInfo } from "../../stores/agentStore";

function getToolIcon(name: string): string {
  const map: Record<string, string> = {
    Read: "📄",
    Write: "✏️",
    Edit: "✂️",
    Bash: "▶️",
    Grep: "🔍",
    Glob: "📋",
  };
  return map[name] || "🔧";
}

function getToolLabel(tc: ToolCallInfo): string {
  const input = tc.input;
  if (input.path) return `${tc.name} → ${input.path}`;
  if (input.command) return `${tc.name} → ${input.command}`;
  if (input.pattern) return `${tc.name} → ${input.pattern}`;
  return tc.name;
}

const statusConfig = {
  running: { icon: "●", color: "text-yellow", label: "Running" },
  completed: { icon: "✓", color: "text-green", label: "Done" },
  error: { icon: "✗", color: "text-red", label: "Error" },
};

export default function ToolCallCard({ toolCall }: { toolCall: ToolCallInfo }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[toolCall.status];

  return (
    <div className="my-2 border border-surface1 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface0 transition-colors"
      >
        <span>{getToolIcon(toolCall.name)}</span>
        <span className="text-subtext1 truncate">{getToolLabel(toolCall)}</span>
        <span className={`ml-auto ${status.color}`}>
          {status.icon}
        </span>
        <span className="text-overlay0">{expanded ? "▾" : "▸"}</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 border-t border-surface1 bg-crust">
          {toolCall.status === "running" && (
            <div className="flex items-center gap-2 text-xs text-yellow mb-2">
              <span className="animate-spin">⟳</span> Running...
            </div>
          )}
          {Object.keys(toolCall.input).length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-overlay0 mb-1">Input</div>
              <pre className="text-xs text-subtext1 font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.output && (
            <div>
              <div className="text-[10px] text-overlay0 mb-1">Output</div>
              <pre className="text-xs text-subtext1 font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                {toolCall.output.length > 500
                  ? toolCall.output.substring(0, 500) + "..."
                  : toolCall.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
