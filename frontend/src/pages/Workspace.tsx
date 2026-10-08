import { useRef } from 'react'
import Transcript from '../components/Transcript'
import YouTubePlayer from '../components/YouTubePlayer'
import type { AnalyzeResponse, PlayerHandle } from '../types'

interface WorkspaceProps {
  analysis: AnalyzeResponse
}

export default function Workspace({ analysis }: WorkspaceProps) {
  const playerRef = useRef<PlayerHandle>(null)

  function handleSeek(seconds: number) {
    playerRef.current?.seekTo(seconds)
  }

  return (
    <main className="mx-auto grid max-w-screen-2xl gap-4 p-4 sm:px-6 lg:h-[calc(100dvh-4rem)] lg:grid-cols-5 lg:overflow-hidden">
      {/* Left (about 40%): the video stays visible while the transcript scrolls. */}
      <section className="flex min-h-0 flex-col gap-4 lg:col-span-2">
        <YouTubePlayer key={analysis.video_id} ref={playerRef} videoId={analysis.video_id} />
        <Transcript
          className="max-h-96 flex-1 lg:max-h-none"
          lines={analysis.transcript}
          language={analysis.language}
          isGenerated={analysis.is_generated}
          wasTranslated={analysis.was_translated}
          onSeek={handleSeek}
        />
      </section>

      {/* Right (about 60%): AI Notes / AI Chat tabs arrive in Phases 15 and 16. */}
      <section className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500 lg:col-span-3">
        AI Notes and AI Chat will appear here (Phases 15 and 16).
      </section>
    </main>
  )
}