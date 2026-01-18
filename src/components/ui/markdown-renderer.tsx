"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** KaTeX 수식 렌더링 활성화 (기본값: false) */
  enableMath?: boolean;
}

/**
 * 마크다운 렌더러 컴포넌트
 * - remarkGfm: GitHub Flavored Markdown 지원
 * - remarkMath + rehypeKatex: 수식 렌더링 (enableMath=true 시)
 */
export function MarkdownRenderer({
  content,
  className,
  enableMath = false,
}: MarkdownRendererProps) {
  const remarkPlugins = enableMath ? [remarkGfm, remarkMath] : [remarkGfm];
  const rehypePlugins = enableMath ? [rehypeKatex] : [];

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
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
