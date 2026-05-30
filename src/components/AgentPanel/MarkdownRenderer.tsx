import { useState, useCallback, Component } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
}

// Error boundary to prevent markdown crashes from white-screening the app
class MarkdownErrorBoundary extends Component<
  { children: ReactNode; fallback: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <pre className="text-sm text-text whitespace-pre-wrap">{this.props.fallback}</pre>;
    }
    return this.props.children;
  }
}

function CodeBlock({ className, children, ...props }: ComponentPropsWithoutRef<"code">) {
  const match = /language-(\w+)/.exec(className || "");
  const isBlock = match || String(children).includes("\n");

  if (isBlock) {
    return <BlockCode className={className}>{children}</BlockCode>;
  }

  return (
    <code
      className="bg-surface0 text-red px-1.5 py-0.5 rounded text-xs font-mono"
      {...props}
    >
      {children}
    </code>
  );
}

function BlockCode({ className, children }: { className?: string; children?: ReactNode }) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeStr = String(children).replace(/\n$/, "");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [codeStr]);

  return (
    <div className="relative group bg-crust rounded-lg my-2 overflow-hidden">
      <div className="flex justify-between items-center px-3 py-1 bg-mantle text-[10px] text-overlay0">
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="text-overlay0 hover:text-text opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <MarkdownErrorBoundary fallback={content}>
      <div className="markdown-body text-sm text-text leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            code: CodeBlock,
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-0.5">{children}</li>,
            h1: ({ children }) => (
              <h1 className="text-lg font-bold mt-4 mb-2 text-text">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-bold mt-3 mb-1.5 text-text">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-bold mt-2 mb-1 text-text">
                {children}
              </h3>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-blue pl-3 italic text-subtext1">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-blue underline hover:text-lavender"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-2">
                <table className="w-full text-xs border-collapse">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-surface1 px-2 py-1 bg-surface0 text-left">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-surface1 px-2 py-1">{children}</td>
            ),
            hr: () => <hr className="border-surface1 my-3" />,
            strong: ({ children }) => (
              <strong className="font-semibold text-text">{children}</strong>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}
