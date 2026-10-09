export interface TranscriptLine {
  start: number 
  timestamp: string
  text: string
}

export interface AnalyzeResponse {
  session_id: string
  video_id: string
  language: string
  is_generated: boolean
  was_translated: boolean
  transcript: TranscriptLine[]
  status: string
}

export interface NotesResponse {
  notes: string
}

export interface Source {
  start_time: number
  end_time: number
  timestamp: string
  text: string
}

export interface ChatResponse {
  answer: string
  sources: Source[]
}

export interface HealthResponse {
  status: string
}

export interface PlayerHandle {
  seekTo: (seconds: number) => void
}

export type ChatItem =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; text: string; sources: Source[] }
  | { id: number; role: 'error'; text: string; question: string; canRetry: boolean }

export interface HistoryMessage {
  role: 'user' | 'assistant'
  text: string
}