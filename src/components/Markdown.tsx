"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./MermaidDiagram";

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const value = String(children).replace(/\n$/, "");
    if (match?.[1] === "mermaid") {
      return <MermaidDiagram chart={value} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-black/[.04] dark:prose-pre:bg-white/[.06]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
