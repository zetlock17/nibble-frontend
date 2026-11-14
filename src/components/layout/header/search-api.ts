import type { Place } from '@/features/map/place'
import { parseSpot } from '@/features/map/spots'

// species-map открывает карту с фильтром по виду рыбы (кнопка «Показать на карте» в карточке рыбы).
export type SearchTarget = { kind: 'spot'; place: Place } | { kind: 'species'; id: string } | { kind: 'species-map'; id: string }
export type SearchNavigation = { target: SearchTarget; revision: number }
export type SearchResults = { spots: Place[]; species: { id: string; name: string; description: string }[] }
export type SearchResult = { data: SearchResults } | { error: true }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseSearchResults(value: unknown, cityId?: number): SearchResults {
  if (!record(value) || !Array.isArray(value.spots) || !Array.isArray(value.species)) throw new Error('Invalid search response')
  const spots = value.spots.map((spot: unknown) => {
    const place = parseSpot(spot)
    if (cityId !== undefined && (!record(spot) || spot.city_id !== cityId)) throw new Error('Unexpected search city')
    return place
  })
  const species = value.species.map((fish: unknown) => {
    if (!record(fish) || typeof fish.id !== 'number' || !Number.isSafeInteger(fish.id) || fish.id <= 0
      || typeof fish.name !== 'string' || !fish.name.trim() || typeof fish.short_description !== 'string') throw new Error('Invalid search species')
    return { id: String(fish.id), name: fish.name.trim(), description: fish.short_description.trim() }
  })
  if (new Set(spots.map((spot) => spot.id)).size !== spots.length || new Set(species.map((fish) => fish.id)).size !== species.length) throw new Error('Duplicate search ID')
  return { spots, species }
}

export async function loadSearch(query: string, cityId: number | undefined, limit: number, apiBase: string, signal: AbortSignal): Promise<SearchResults> {
  const q = query.trim()
  if (q.length < 2 || q.length > 100 || !Number.isInteger(limit) || limit < 1 || limit > 20
    || (cityId !== undefined && (!Number.isSafeInteger(cityId) || cityId <= 0))) throw new Error('Invalid search query')
  const params = new URLSearchParams({ q, limit: String(limit) })
  if (cityId !== undefined) params.set('city_id', String(cityId))
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}/search?${params}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Search request failed: ${response.status}`)
  return parseSearchResults(await response.json(), cityId)
}

export function scheduleSearch(query: string, cityId: number, apiBase: string, onResult: (result: SearchResult) => void) {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    loadSearch(query, cityId, 5, apiBase, signal).then((data) => {
      if (!controller.signal.aborted) onResult({ data })
    }).catch(() => {
      if (!controller.signal.aborted) onResult({ error: true })
    })
  }, 300)
  return () => { clearTimeout(timer); controller.abort() }
}
