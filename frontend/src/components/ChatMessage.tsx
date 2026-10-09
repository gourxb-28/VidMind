import type { ChatItem, Source } from '../types'
import MarkdownView from './MarkdownView'

interface ChatMessageProps {
  item: ChatItem
  onSeek: (seconds: number) => void
  onRetry: (errorId: number, question: string) => void
}

function Sources({ sources, onSeek }: { sources: Source[]; onSeek: (seconds: number) => void }) {
  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
        <span>Sources:</span>
        {sources.map((source, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSeek(source.start_time)}
            title="Jump to this moment in the video"
            className="rounded-md bg-indigo-500/15 px-1.5 py-0.5 font-mono text-indigo-300 transition hover:bg-indigo-500/25 focus-visible:outline-2 focus-visible:outline-indigo-400"
          >
            {source.timestamp}
          </button>
        ))}
      </div>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer select-none text-zinc-500 hover:text-zinc-300">
          Show excerpts
        </summary>
        <ul className="mt-2 space-y-2">
          {sources.map((source, index) => (
            <li key={index} className="rounded-lg bg-black/20 p-2 text-zinc-400">
              <span className="mr-2 font-mono text-indigo-300">{source.timestamp}</span>
              {source.text}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

export default function ChatMessage({ item, onSeek, onRetry }: ChatMessageProps) {
  if (item.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-linear-to-br from-indigo-500 to-violet-600 px-4 py-2.5 text-sm wrap-break-word whitespace-pre-wrap text-white shadow-lg shadow-indigo-500/20">
          {item.text}
        </p>
      </div>
    )
  }

  if (item.role === 'error') {
    return (
      <div className="flex justify-start">
        <div
          role="alert"
          className="max-w-[90%] rounded-2xl rounded-bl-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <p>{item.text}</p>
          {item.canRetry && (
            <button
              type="button"
              onClick={() => onRetry(item.id, item.question)}
              className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-indigo-400"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] min-w-0 rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3">
        <MarkdownView markdown={item.text} onSeek={onSeek} />
        {item.sources.length > 0 && <Sources sources={item.sources} onSeek={onSeek} />}
      </div>
    </div>
  )
}