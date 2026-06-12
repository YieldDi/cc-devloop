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
    const event = new CustomEvent("agent-send", { detail: text });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-cyan/5 border border-cyan/15 flex items-center justify-center mb-4 glow-cyan-soft">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-cyan">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 className="text-sm font-medium text-text mb-1 tracking-wide">
        How can I help?
      </h3>
      <p className="text-xs text-overlay0 mb-6">
        Describe what you want to build or ask a question.
      </p>
      {projectRoot ? (
        <div className="space-y-1.5 w-full max-w-[280px]">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleClick(s)}
              className="w-full text-left text-xs text-subtext1 bg-surface0/40 border border-surface1/40 hover:border-cyan/20 hover:bg-surface0/60 rounded-lg px-3 py-2.5 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-overlay0">Open a project to get started</p>
      )}
    </div>
  );
}
