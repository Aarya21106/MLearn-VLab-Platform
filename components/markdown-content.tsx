import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="prose prose-sm md:prose-base max-w-none prose-neutral dark:prose-invert prose-pre:bg-zinc-900 prose-pre:text-zinc-100">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
