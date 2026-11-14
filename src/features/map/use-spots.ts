import { useEffect, useState } from 'react'
import type { Place } from './place'
import { loadSpots } from './spots'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
const emptyPlaces: readonly Place[] = []
type Result = { cityId: number; attempt: number } & ({ status: 'ready'; places: Place[] } | { status: 'error' })

// Загружает споты, когда enabled впервые становится true. Готовый список не запрашивается повторно.
export function useSpots(cityId: number, enabled: boolean) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const current = result?.cityId === cityId && result.attempt === attempt ? result : null
  const loaded = current?.status === 'ready'

  useEffect(() => {
    if (!enabled || loaded) return
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    loadSpots(cityId, apiBase, signal).then((places) => {
      if (!controller.signal.aborted) setResult({ cityId, attempt, status: 'ready', places })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ cityId, attempt, status: 'error' })
    })
    return () => controller.abort()
  }, [cityId, enabled, loaded, attempt])

  return {
    status: current?.status ?? 'loading',
    places: current?.status === 'ready' ? current.places : emptyPlaces,
    retry() {
      setResult(null)
      setAttempt((value) => value + 1)
    },
  }
}
