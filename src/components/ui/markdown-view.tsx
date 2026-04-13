"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  return (
    <div
      className={cn(
        "text-sm text-surface leading-relaxed",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "[&_h1]:font-serif [&_h1]:text-2xl [&_h1]:tracking-tightest [&_h1]:mt-5 [&_h1]:mb-3",
        "[&_h2]:font-serif [&_h2]:text-xl [&_h2]:tracking-tightest [&_h2]:mt-5 [&_h2]:mb-2",
        "[&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2",
        "[&_h4]:font-semibold [&_h4]:text-sm [&_h4]:mt-3 [&_h4]:mb-1.5",
        "[&_p]:my-2",
        "[&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc",
        "[&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal",
        "[&_li]:my-0.5",
        "[&_li>ul]:my-0.5 [&_li>ol]:my-0.5",
        "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-accent-hover",
        "[&_strong]:font-semibold [&_strong]:text-surface",
        "[&_em]:italic",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-accent/40 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-ink-muted [&_blockquote]:italic",
        "[&_code]:bg-dark-300 [&_code]:text-accent [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.85em] [&_code]:font-mono",
        "[&_pre]:bg-dark-300 [&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto",
        "[&_pre_code]:bg-transparent [&_pre_code]:text-surface [&_pre_code]:p-0 [&_pre_code]:text-xs",
        "[&_hr]:border-border [&_hr]:my-4",
        "[&_table]:border-collapse [&_table]:my-3 [&_table]:w-full [&_table]:text-xs",
        "[&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-dark-300 [&_th]:text-left [&_th]:font-semibold",
        "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5",
        "[&_input[type=checkbox]]:accent-accent [&_input[type=checkbox]]:mr-1.5",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
