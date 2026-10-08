import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { loadYouTubeApi, type YTPlayer } from '../services/youtubeApi'
import type { PlayerHandle } from '../types'

interface YouTubePlayerProps {
  videoId: string
  ref?: Ref<PlayerHandle>
}

type Status = 'loading' | 'ready' | 'error'

function describeError(code: number): string {
  switch (code) {
    case 100:
      return 'This video is unavailable. It may have been removed or made private.'
    case 101:
    case 150:
      return "The video's owner doesn't allow it to be played outside YouTube."
    case 153:
      return "YouTube couldn't verify this website because the browser sent no referrer."
    default:
      return "The video couldn't be played here."
  }
}

function destroyPlayer(player: YTPlayer | null) {
  try {
    player?.destroy()
  } catch (error) {
    console.warn('Could not clean up the YouTube player.', error)
  }
}


export default function YouTubePlayer({ videoId, ref }: YouTubePlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')


  useImperativeHandle(
    ref,
    () => ({
      seekTo(seconds: number) {
        const player = playerRef.current
        if (!player) return
        player.seekTo(seconds, true)
        player.playVideo()
      },
    }),
    [],
  )

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    let cancelled = false
    let player: YTPlayer | null = null

    const mount = document.createElement('div')
    wrapper.appendChild(mount)

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return
        player = new YT.Player(mount, {
          videoId,
          playerVars: { playsinline: 1, origin: window.location.origin },
          events: {
            onReady: (event) => {
              if (cancelled) return
              playerRef.current = event.target
              setStatus('ready')
            },
            onError: (event) => {
              if (cancelled) return
              setMessage(describeError(event.data))
              setStatus('error')
            },
          },
        })
      })
      .catch(() => {
        if (cancelled) return
        setMessage(
          "Couldn't load the YouTube player. An ad blocker or a network problem may be blocking it.",
        )
        setStatus('error')
      })

    return () => {
      cancelled = true
      playerRef.current = null
      destroyPlayer(player)
      wrapper.replaceChildren() // remove anything YouTube left behind
    }
  }, [videoId])

  return (
    <div className="relative aspect-video min-h-[200px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50">
      <div
        ref={wrapperRef}
        className="absolute inset-0 [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full"
      />

      {status === 'loading' && (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-sm text-zinc-500"
        >
          <span
            className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-400"
            aria-hidden="true"
          />
          Loading player…
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center"
        >
          <p className="text-sm text-zinc-300">{message}</p>
          <p className="text-xs text-zinc-500">
            You can still read the transcript, notes and chat about this video.
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
          >
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  )
}