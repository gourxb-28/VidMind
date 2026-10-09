import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ApiError, askQuestion } from '../services/api'
import type { ChatItem, HistoryMessage } from '../types'
import ChatMessage from './ChatMessage'

interface ChatProps {
  sessionId: string
  onSeek: (seconds: number) => void
}

const MAX_QUESTION_LENGTH = 1000 // the backend rejects anything longer
const HISTORY_MESSAGES = 6 // how many earlier messages are sent along
const HISTORY_TEXT_LIMIT = 1500 // the backend accepts at most 2000 characters per message

const STARTER_QUESTIONS = [
  'What is this video mainly about?',
  'What are the key takeaways?',
  'What examples does the speaker give?',
]

/** The last few questions and answers (not errors), in the shape the backend expects. */
function toHistory(items: ChatItem[]): HistoryMessage[] {
  const history: HistoryMessage[] = []
  for (const item of items) {
    if (item.role !== 'error') {
      history.push({ role: item.role, text: item.text.slice(0, HISTORY_TEXT_LIMIT) })
    }
  }
  return history.slice(-HISTORY_MESSAGES)
}

function Thinking() {
  return (
    <div className="flex justify-start">
      <div
        role="status"
        className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400"
      >
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
        </span>
        Thinking…
      </div>
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
      <h3 className="text-base font-semibold text-zinc-100">Ask anything about this video</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">
        Answers come only from the transcript. If something isn&apos;t covered, you&apos;ll be told.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {STARTER_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onPick(question)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-indigo-400/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-indigo-400"
          >
            {question}
          </button>
        ))}
      </div>
      <p className="mt-6 max-w-sm text-xs text-zinc-600">
        Tip: ask about what is said in the video. On-screen text isn&apos;t in the transcript. Follow-ups
        like &ldquo;explain the second one&rdquo; work, but only the last few messages are remembered.
      </p>
    </div>
  )
}

export default function Chat({ sessionId, onSeek }: ChatProps) {
  const [items, setItems] = useState<ChatItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const nextId = useRef(1)
  const listRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [items, loading])

  // Let the input grow with its text, up to a limit.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [input])

  async function run(question: string, history: HistoryMessage[]) {
    setLoading(true)
    try {
      const response = await askQuestion(sessionId, question, history)
      setItems((all) => [
        ...all,
        { id: nextId.current++, role: 'assistant', text: response.answer, sources: response.sources },
      ])
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null
      setItems((all) => [
        ...all,
        {
          id: nextId.current++,
          role: 'error',
          text: apiError ? apiError.message : 'Something went wrong. Please try again.',
          question,
          canRetry: apiError?.status !== 404, // an expired session can't be fixed by retrying
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function send(raw: string) {
    const question = raw.trim()
    if (!question || loading) return
    const history = toHistory(items) 
    setItems((all) => [...all, { id: nextId.current++, role: 'user', text: question }])
    setInput('')
    void run(question, history)
  }

  function retry(errorId: number, question: string) {
    if (loading) return
    const remaining = items.filter((item) => item.id !== errorId)
    const last = remaining[remaining.length - 1]
    const earlier =
      last?.role === 'user' && last.text === question ? remaining.slice(0, -1) : remaining
    setItems(remaining)
    void run(question, toHistory(earlier))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    send(input)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send(input)
    }
  }

  const canSend = input.trim().length > 0 && !loading

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={listRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        className="max-h-[60vh] min-h-64 flex-1 space-y-4 overflow-y-auto p-4 lg:max-h-none"
      >
        {items.length === 0 && !loading ? (
          <EmptyState onPick={send} />
        ) : (
          items.map((item) => (
            <ChatMessage key={item.id} item={item} onSeek={onSeek} onRetry={retry} />
          ))
        )}
        {loading && <Thinking />}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 focus-within:border-indigo-400/60">
          <label htmlFor="chat-input" className="sr-only">
            Ask a question about the video
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            rows={1}
            value={input}
            maxLength={MAX_QUESTION_LENGTH}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the video…"
            className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
          >
            Send
          </button>
        </div>
        <div className="mt-1.5 flex justify-between px-1 text-[11px] text-zinc-600">
          <span>Enter to send, Shift+Enter for a new line</span>
          {input.length > 800 && (
            <span className={input.length >= MAX_QUESTION_LENGTH ? 'text-red-400' : ''}>
              {input.length}/{MAX_QUESTION_LENGTH}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}