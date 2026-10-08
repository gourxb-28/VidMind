export interface YTPlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  destroy: () => void
}

export interface YTPlayerEvent {
  target: YTPlayer
}

export interface YTErrorEvent {
  data: number
}

interface YTPlayerOptions {
  videoId: string
  playerVars?: Record<string, string | number>
  events?: {
    onReady?: (event: YTPlayerEvent) => void
    onError?: (event: YTErrorEvent) => void
  }
}

export interface YTNamespace {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

const API_SCRIPT_URL = 'https://www.youtube.com/iframe_api'

let apiPromise: Promise<YTNamespace> | null = null

export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.()
      if (window.YT?.Player) {
        resolve(window.YT)
      } else {
        apiPromise = null
        reject(new Error('The YouTube player API did not initialise.'))
      }
    }

    const script = document.createElement('script')
    script.src = API_SCRIPT_URL
    script.async = true
    script.onerror = () => {
      script.remove()
      apiPromise = null
      reject(new Error('The YouTube player script could not be loaded.'))
    }
    document.head.appendChild(script)
  })

  return apiPromise
}