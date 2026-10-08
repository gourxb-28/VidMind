import type { AnalyzeResponse, HealthResponse } from '../types'

const rawUrl: string | undefined = import.meta.env.VITE_API_URL
export const API_URL = (rawUrl ?? 'http://127.0.0.1:8000').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number 

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  timeoutMs?: number
}


async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null 
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = 120_000 } = options

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('The request took too long. Please try again.', 0)
    }
    throw new ApiError(
      "Can't reach the server. Check your connection and that the backend is running.",
      0,
    )
  }

  const data = await readJson(response)

  if (!response.ok) {
    const detail =
      typeof data === 'object' && data !== null && 'detail' in data
        ? (data as { detail: unknown }).detail
        : null
    throw new ApiError(
      typeof detail === 'string' ? detail : 'Something went wrong. Please try again.',
      response.status,
    )
  }

  return data as T
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health', { timeoutMs: 5_000 })
}

export function analyzeVideo(url: string): Promise<AnalyzeResponse> {
  return request<AnalyzeResponse>('/api/v1/video/analyze', {
    method: 'POST',
    body: { url },
    timeoutMs: 180_000,
  })
}