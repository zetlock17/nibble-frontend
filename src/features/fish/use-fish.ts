import { useEffect, useState } from 'react'
import type { Fish, Season } from './fish'
import { loadFishingMethods, loadSpecies, loadSpeciesDetails } from './species-api'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
export type FishStatus = 'loading' | 'ready' | 'error'
export type FishState = { fish: readonly Fish[]; status: FishStatus; retry: () => void }
const emptyFish: readonly Fish[] = []

export function useFish(query = '', season: Season = 'all'): FishState {
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify([query.trim(), season, attempt])
  const [result, setResult] = useState<{ key: string; fish: Fish[]; status: FishStatus } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    const timer = window.setTimeout(() => {
      loadSpecies(query, season, apiBase, signal).then((fish) => {
        if (!controller.signal.aborted) setResult({ key, fish, status: 'ready' })
      }).catch(() => {
        if (!controller.signal.aborted) setResult({ key, fish: [], status: 'error' })
      })
    }, query.trim() ? 250 : 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query, season, key])
  const current = result?.key === key ? result : null
  return { fish: current?.fish ?? emptyFish, status: current?.status ?? 'loading', retry: () => setAttempt((value) => value + 1) }
}

export function useFishDetails(id: string) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ id: string; attempt: number; fish?: Fish; error?: true } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    loadSpeciesDetails(id, apiBase, signal).then((fish) => {
      if (!controller.signal.aborted) setResult({ id, attempt, fish })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ id, attempt, error: true })
    })
    return () => controller.abort()
  }, [id, attempt])
  return { result: result?.id === id && result.attempt === attempt ? result : null, retry: () => setAttempt((value) => value + 1) }
}

export function useFishingMethods() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ attempt: number; options: { value: string; label: string }[]; status: FishStatus } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    loadFishingMethods(apiBase, signal).then((options) => {
      if (!controller.signal.aborted) setResult({ attempt, options, status: 'ready' })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ attempt, options: [], status: 'error' })
    })
    return () => controller.abort()
  }, [attempt])
  const current = result?.attempt === attempt ? result : null
  return { options: current?.options ?? [], status: current?.status ?? 'loading', retry: () => setAttempt((value) => value + 1) }
}
