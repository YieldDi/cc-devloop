import { useProjectStore } from "../../stores/projectStore";

const SUGGESTIONS = [
  "Explain the project structure",
  "Add a new API endpoint",
  "Find and fix the bug in auth",
];

export default function EmptyState() {
  const projectRoot = useProjectStore((s) => s.projectRoot);

  const handleClick = (text: string) => {
    if (!projectRoot) return;
    // Dispatch a custom event that ChatInput will pick up
    // We avoid calling useAgent() here because sendMessage needs to be in the same hook tree
    const event = new CustomEvent("agent-send", { detail: text });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-[#313244] flex items-center justify-center mb-4">
        <span className="text-2xl">✦</span>
      </div>
      <h3 className="text-sm font-medium text-[#cdd6f4] mb-1">
        How can I help?
      </h3>
      <p className="text-xs text-[#6c7086] mb-6">
        Describe what you want to build or ask a question.
      </p>
      {projectRoot ? (
        <div className="space-y-2 w-full max-w-[280px]">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleClick(s)}
              className="w-full text-left text-xs text-[#a6adc8] bg-[#313244] hover:bg-[#45475a] rounded-xl px-3 py-2.5 transition-colors border border-transparent hover:border-[#585b70]"
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#6c7086]">Open a project to get started</p>
      )}
    </div>
  );
}
