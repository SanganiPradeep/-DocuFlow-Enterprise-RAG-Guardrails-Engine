import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThreeDots } from './ThreeDots';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
  className = '',
}) => {
  // Normalize markdown text to guarantee clean list and heading parsing
  const normalized = React.useMemo(() => {
    if (!content) return '';
    return content
      .replace(/\r\n/g, '\n')
      // Ensure bullet lists have a blank line before them if preceded by a normal paragraph
      .replace(/([^\n])\n(\*|\-|\d+\.) /g, '$1\n\n$2 ');
  }, [content]);

  return (
    <div className={`markdown-content text-inherit leading-relaxed ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-inherit">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-inherit">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-inherit">{children}</em>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-inherit mt-3 mb-2 first:mt-0 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-inherit mt-3 mb-1.5 first:mt-0 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mt-3 mb-1.5 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-2 mb-1 first:mt-0">
              {children}
            </h4>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 mb-2.5 text-inherit">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 mb-2.5 text-inherit">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-inherit pl-0.5">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 pl-3 py-1.5 my-2.5 text-slate-700 dark:text-slate-300 italic rounded-r text-xs">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className?.includes('language-');
            return isInline ? (
              <code
                className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-medium"
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre className="overflow-x-auto p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono my-2.5 border border-slate-800">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 dark:bg-slate-800/80">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {children}
            </tbody>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
              {children}
            </td>
          ),
          hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,
        }}
      >
        {normalized}
      </Markdown>
      {isStreaming && (
        <span className="inline-flex items-center ml-2 align-middle">
          <ThreeDots size="sm" label="" />
        </span>
      )}
    </div>
  );
};
