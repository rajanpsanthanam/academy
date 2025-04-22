import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypePrism from 'rehype-prism-plus';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const schema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      '*': ['className'],
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'title'],
    },
    tagNames: [
      ...(defaultSchema.tagNames || []),
      'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li',
      'strong', 'em', 'code', 'pre', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ]
  };

  return (
    <div className="markdown-content font-sans">
      <ReactMarkdown
        components={{
          div: ({ node, ...props }) => (
            <div className={`prose prose-sm md:prose-base dark:prose-invert max-w-none ${className}`} {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-base leading-relaxed font-sans" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 font-sans" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3 font-sans" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-bold mt-4 mb-2 font-sans" {...props} />
          ),
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return isInline ? (
              <code className="bg-muted rounded px-1 py-0.5 font-mono text-sm" {...props}>
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto font-mono text-sm" {...props} />
          ),
        }}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          rehypePrism,
          [rehypeSanitize, schema]
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 