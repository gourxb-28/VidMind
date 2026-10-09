export const TIMESTAMP_PATTERN = /(?<![\w:])\d{1,2}:\d{2}(?::\d{2})?(?!\w|:\d)/g

export function parseTimestamp(text: string): number | null {
  const parts = text.split(':').map(Number)
  if (parts.some((n) => !Number.isInteger(n) || n < 0)) return null

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return seconds < 60 ? minutes * 60 + seconds : null
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return minutes < 60 && seconds < 60 ? hours * 3600 + minutes * 60 + seconds : null
  }
  return null
}