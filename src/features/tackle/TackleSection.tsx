import { useEffect, useState } from 'react'
import { TackleCatalog } from './TackleCatalog'
import type { TackleState } from './tackle'
import { loadTackleListings } from './tackle-api'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export function TackleSection() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ attempt: number; state: TackleState } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(60000)])
    loadTackleListings(10, apiBase, signal).then((listings) => {
      if (!controller.signal.aborted) setResult({ attempt, state: { status: 'ready', listings } })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ attempt, state: { status: 'error' } })
    })
    return () => controller.abort()
  }, [attempt])

  const state = result?.attempt === attempt ? result.state : { status: 'loading' as const }
  return <TackleCatalog state={state} onRetry={() => setAttempt((value) => value + 1)} />
}
