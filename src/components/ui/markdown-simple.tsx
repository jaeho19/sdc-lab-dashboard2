"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownSimpleProps {
  content: string;
  className?: string;
}

/**
 * 경량 마크다운 렌더러 (KaTeX 미포함)
 * - remarkGfm: GitHub Flavored Markdown 지원
 * - KaTeX 없이 번들 크기 최소화
 */
export function MarkdownSimple({ content, className }: MarkdownSimpleProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-p:text-muted-foreground prose-strong:text-foreground",
        "prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-muted prose-pre:border",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
