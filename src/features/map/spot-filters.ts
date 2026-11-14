import { useEffect, useState } from 'react'
import type { SelectOption } from '@/components/ui/select/Select'

export type SpotFilters = { speciesId: string; methodId: string }
export const noSpotFilters: SpotFilters = { speciesId: '', methodId: '' }

export function spotsQuery(cityId: number, filters: SpotFilters = noSpotFilters) {
  const params = new URLSearchParams({ city_id: String(cityId) })
  if (filters.speciesId) params.set('species_id', filters.speciesId)
  if (filters.methodId) params.set('method_id', filters.methodId)
  return params.toString()
}

export async function loadFilterOptions(path: string, apiBase: string, signal: AbortSignal): Promise<SelectOption[]> {
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}${path}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Filter options request failed: ${response.status}`)
  const data: unknown = await response.json()
  if (!Array.isArray(data)) throw new Error('Invalid filter options')
  return data.map((item) => {
    const entry = item as { id?: unknown; name?: unknown }
    if (typeof entry?.id !== 'number' || typeof entry.name !== 'string' || !entry.name.trim()) throw new Error('Invalid filter option')
    return { value: String(entry.id), label: entry.name.trim() }
  })
}

// Варианты фильтров загружаются один раз. При сбое список остаётся пустым, а фильтр отключённым.
export function useFilterOptions(path: string, apiBase: string) {
  const [state, setState] = useState<{ status: 'loading' | 'error' | 'ready'; options: readonly SelectOption[] }>({ status: 'loading', options: [] })
  useEffect(() => {
    const controller = new AbortController()
    loadFilterOptions(path, apiBase, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]))
      .then((options) => { if (!controller.signal.aborted) setState({ status: 'ready', options }) })
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'error', options: [] }) })
    return () => controller.abort()
  }, [path, apiBase])
  return state
}
