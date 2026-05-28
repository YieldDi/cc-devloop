import MarkdownRenderer from "./MarkdownRenderer";

export default function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-start py-1">
      <div className="max-w-[95%]">
        <MarkdownRenderer content={content} />
        <span className="inline-block w-2 h-4 bg-[#cdd6f4] animate-pulse ml-0.5 rounded-sm" />
      </div>
    </div>
  );
}
