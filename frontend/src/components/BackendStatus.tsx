import { useEffect, useState } from 'react'
import { getHealth } from '../services/api'

type Status = 'checking' | 'ok' | 'down'

const DOT_COLOR: Record<Status, string> = {
  checking: 'bg-amber-400 animate-pulse',
  ok: 'bg-emerald-400',
  down: 'bg-red-400',
}

const LABEL: Record<Status, string> = {
  checking: 'Checking the server…',
  ok: 'Server connected',
  down: "Can't reach the server",
}


export default function BackendStatus() {
  const [status, setStatus] = useState<Status>('checking')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getHealth()
      .then(() => {
        if (!cancelled) setStatus('ok')
      })
      .catch(() => {
        if (!cancelled) setStatus('down')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  function retry() {
    setStatus('checking')
    setAttempt((n) => n + 1)
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-500" role="status">
      <span className={`h-2 w-2 rounded-full ${DOT_COLOR[status]}`} aria-hidden="true" />
      <span className="libre-franklin">{LABEL[status]}</span>
      {status === 'down' && (
        <button
          type="button"
          onClick={retry}
          className="rounded px-1 text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
        >
          Retry
        </button>
      )}
    </div>
  )
}