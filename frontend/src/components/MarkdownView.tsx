import { Children, type ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseTimestamp, TIMESTAMP_PATTERN } from '../utils/timestamps'

interface MarkdownViewProps {
  markdown: string
  onSeek: (seconds: number) => void
}

function withTimestampButtons(children: ReactNode, onSeek: (seconds: number) => void): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== 'string') return child 

    const pieces: ReactNode[] = []
    let last = 0
    for (const match of child.matchAll(TIMESTAMP_PATTERN)) {
      const seconds = parseTimestamp(match[0])
      if (seconds === null) continue 
      const index = match.index
      if (index > last) pieces.push(child.slice(last, index))
      pieces.push(
        <button
          key={index}
          type="button"
          onClick={() => onSeek(seconds)}
          title="Jump to this moment in the video"
          className="mx-0.5 rounded-md bg-indigo-500/15 px-1.5 py-0.5 align-baseline font-mono text-[0.85em] text-indigo-300 transition hover:bg-indigo-500/25 focus-visible:outline-2 focus-visible:outline-indigo-400"
        >
          {match[0]}
        </button>,
      )
      last = index + match[0].length
    }
    if (pieces.length === 0) return child
    if (last < child.length) pieces.push(child.slice(last))
    return pieces
  })
}

export default function MarkdownView({ markdown, onSeek }: MarkdownViewProps) {
  const components: Components = {
    p: ({ children }) => <p>{withTimestampButtons(children, onSeek)}</p>,
    li: ({ children }) => <li>{withTimestampButtons(children, onSeek)}</li>,
    h1: ({ children }) => <h1>{withTimestampButtons(children, onSeek)}</h1>,
    h2: ({ children }) => <h2>{withTimestampButtons(children, onSeek)}</h2>,
    h3: ({ children }) => <h3>{withTimestampButtons(children, onSeek)}</h3>,
    h4: ({ children }) => <h4>{withTimestampButtons(children, onSeek)}</h4>,
    strong: ({ children }) => <strong>{withTimestampButtons(children, onSeek)}</strong>,
    em: ({ children }) => <em>{withTimestampButtons(children, onSeek)}</em>,
    td: ({ children }) => <td>{withTimestampButtons(children, onSeek)}</td>,
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  }

  return (
    <div className="prose prose-sm prose-invert max-w-none prose-headings:font-semibold prose-h1:mb-2 prose-h1:mt-6 prose-h1:text-lg prose-h2:text-base prose-a:text-indigo-400 prose-li:my-0.5 prose-code:rounded prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:text-indigo-200 prose-code:before:content-none prose-code:after:content-none">      <Markdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={['img']}
        components={components}
      >
        {markdown}
      </Markdown>
    </div>
  )
}