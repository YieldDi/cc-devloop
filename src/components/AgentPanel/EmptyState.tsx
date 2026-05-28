import { useAgent } from "../../hooks/useAgent";

const SUGGESTIONS = [
  "Explain the project structure",
  "Add a new API endpoint",
  "Find and fix the bug in auth",
];

export default function EmptyState() {
  const { sendMessage } = useAgent();

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
      <div className="space-y-2 w-full max-w-[280px]">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => sendMessage(s)}
            className="w-full text-left text-xs text-[#a6adc8] bg-[#313244] hover:bg-[#45475a] rounded-xl px-3 py-2.5 transition-colors border border-transparent hover:border-[#585b70]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
