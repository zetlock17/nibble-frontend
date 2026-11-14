import { useEffect, useState } from 'react'
import type { Place } from './place'
import { loadSpotDetails } from './spots'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export function useSpotDetails(id: string) {
  const [result, setResult] = useState<{ data: Place } | { error: true } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    loadSpotDetails(id, apiBase, signal).then((data) => {
      if (!controller.signal.aborted) setResult({ data })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ error: true })
    })
    return () => controller.abort()
  }, [id, attempt])

  return { result, retry: () => { setResult(null); setAttempt((value) => value + 1) } }
}
