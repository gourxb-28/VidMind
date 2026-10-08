import type { ReactNode } from 'react'
import type { TranscriptLine } from '../types'

interface TranscriptProps {
  lines: TranscriptLine[]
  language: string
  isGenerated: boolean
  wasTranslated: boolean
  onSeek: (seconds: number) => void
  className?: string
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400">
      {children}
    </span>
  )
}

export default function Transcript({
  lines,
  language,
  isGenerated,
  wasTranslated,
  onSeek,
  className = '',
}: TranscriptProps) {
    
  const languageName = language.replace(/\s*\(auto-generated\)\s*$/i, '')

  return (
    <section
      aria-label="Transcript"
      className={`flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 ${className}`}
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">Transcript</h2>
        <Badge>{languageName}</Badge>
        {isGenerated && <Badge>Auto-generated captions</Badge>}
        {wasTranslated && <Badge>Translated to English</Badge>}
      </header>

      {lines.length === 0 ? (
        <p className="p-4 text-sm text-zinc-500">No transcript available.</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {lines.map((line, index) => (
            <li key={`${line.start}-${index}`}>
              <button
                type="button"
                onClick={() => onSeek(line.start)}
                title="Jump to this moment in the video"
                className="group flex w-full gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-indigo-400"
              >
                <span className="mt-0.5 shrink-0 font-mono text-xs text-indigo-400 group-hover:text-indigo-300">
                  {line.timestamp}
                </span>
                <span className="text-sm leading-relaxed text-zinc-300">{line.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}