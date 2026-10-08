import { useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Workspace from './pages/Workspace'
import { analyzeVideo, ApiError } from './services/api'
import type { AnalyzeResponse } from './types'

export default function App() {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze(url: string) {
    setLoading(true)
    setError(null)
    try {
      setAnalysis(await analyzeVideo(url))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  
  function handleNew() {
    setAnalysis(null)
    setError(null)
  }

  return (
    <>
      <Navbar showNew={analysis !== null} onNew={handleNew} />
      {analysis ? (
        <Workspace analysis={analysis} />
      ) : (
        <Home onAnalyze={handleAnalyze} loading={loading} error={error} />
      )}
    </>
  )
}