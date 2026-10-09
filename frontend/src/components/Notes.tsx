import { useEffect, useState } from 'react'
import { ApiError, getNotes } from '../services/api'
import MarkdownView from './MarkdownView'

interface NotesProps {
  sessionId: string
  onSeek: (seconds: number) => void
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; notes: string }
  | { status: 'error'; message: string }

type CopyState = 'idle' | 'copied' | 'failed'

function ElapsedTime() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const minutes = Math.floor(seconds / 60)
  return (
    <span className="tabular-nums">
      {minutes}:{String(seconds % 60).padStart(2, '0')}
    </span>
  )
}

function GeneratingNotes() {
  return (
    <div role="status" className="p-6">
      <div className="flex items-center gap-3 text-sm text-zinc-300">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-400"
          aria-hidden="true"
        />
        <span>Generating AI notes…</span>
        <ElapsedTime />
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Long videos can take a few minutes. You can already watch the video, read the transcript,
        or switch to AI Chat.
      </p>
      <div className="mt-6 space-y-3" aria-hidden="true">
        {['w-1/3', 'w-full', 'w-11/12', 'w-4/5', 'w-1/4', 'w-full', 'w-10/12'].map((width, i) => (
          <div key={i} className={`h-3 animate-pulse rounded bg-white/10 ${width}`} />
        ))}
      </div>
    </div>
  )
}

export default function Notes({ sessionId, onSeek }: NotesProps) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [copy, setCopy] = useState<CopyState>('idle')


  useEffect(() => {
    let cancelled = false
    getNotes(sessionId)
      .then((response) => {
        if (!cancelled) setState({ status: 'ready', notes: response.notes })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message =
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
        setState({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [sessionId, attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  async function copyNotes(notes: string) {
    try {
      await navigator.clipboard.writeText(notes)
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
    setTimeout(() => setCopy('idle'), 2000)
  }

  if (state.status === 'loading') return <GeneratingNotes />

  if (state.status === 'error') {
    return (
      <div role="alert" className="p-6">
        <p className="text-sm text-red-400">{state.message}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="p-5">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => copyNotes(state.notes)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-indigo-400"
        >
          {copy === 'copied' ? 'Copied!' : copy === 'failed' ? "Couldn't copy" : 'Copy notes'}
        </button>
      </div>
      <MarkdownView markdown={state.notes} onSeek={onSeek} />
    </div>
  )
}