import { useState, type FormEvent } from 'react'
import BackendStatus from '../components/BackendStatus'

interface HomeProps {
  onAnalyze: (url: string) => void
  loading: boolean
  error: string | null 
}

export default function Home({ onAnalyze, loading, error }: HomeProps) {
  const [url, setUrl] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const message = localError ?? error

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    const trimmed = url.trim()
    if (!trimmed) {
      setLocalError('Please paste a YouTube URL.')
      return
    }
    setLocalError(null)
    onAnalyze(trimmed)
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-6 pb-24 text-center">
      <span className="mb-6 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
        AI notes + chat, grounded in the transcript
      </span>

      <h1 className="bg-linear-to-b from-white to-zinc-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
        YouTube AI Analyzer
      </h1>
      <p className="mt-4 text-lg text-zinc-400">Understand any YouTube video with AI</p>

      <form onSubmit={handleSubmit} className="mt-10 w-full" noValidate aria-busy={loading}>
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/40 focus-within:border-indigo-400/60 sm:flex-row">
          <label htmlFor="video-url" className="sr-only">
            YouTube video URL
          </label>
          <input
            id="video-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            disabled={loading}
            onChange={(event) => {
              setUrl(event.target.value)
              setLocalError(null)
            }}
            placeholder="Paste YouTube URL here"
            aria-invalid={message !== null}
            aria-describedby={message ? 'video-url-error' : undefined}
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-wait disabled:opacity-70 disabled:hover:brightness-100"
          >
            {loading && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            )}
            {loading ? 'Analyzing…' : 'Analyze Video'}
          </button>
        </div>

        {loading && (
          <p role="status" className="mt-3 text-sm text-zinc-400">
            Fetching the transcript and building the knowledge base. This can take a moment.
          </p>
        )}

        {message && (
          <p id="video-url-error" role="alert" className="mt-3 text-sm text-red-400">
            {message}
          </p>
        )}
      </form>

      <BackendStatus />
    </main>
  )
}