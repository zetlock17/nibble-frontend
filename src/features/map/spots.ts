import type { Place } from './place.ts'
import { spotsQuery } from './spot-filters.ts'
import type { SpotFilters } from './spot-filters.ts'

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function id(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function optionalText(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value !== 'string') throw new Error('Invalid spot text')
  return value.trim() || undefined
}

export function spotDescriptionParagraphs(description: string): string[] {
  return description.replace(/\r\n?/g, '\n').split(/\n[\t ]*\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)
}

function coordinate(value: unknown, max: number): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '') throw new Error('Invalid coordinate')
  const result = Number(value)
  if (!Number.isFinite(result) || Math.abs(result) > max || String(value).trim() === '') throw new Error('Invalid coordinate')
  return result
}

function photo(value: unknown): string | undefined {
  const url = optionalText(value)
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) {
    const parsed = new URL(url)
    if (!parsed.username && !parsed.password) return url
  }
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url
  throw new Error('Invalid spot photo URL')
}

export function parseSpot(value: unknown): Place {
  if (!record(value) || !id(value.id) || !id(value.city_id)
    || typeof value.name !== 'string' || !value.name.trim()) throw new Error('Invalid spot')
  return {
    id: String(value.id),
    name: value.name.trim(),
    area: optionalText(value.area),
    image: photo(value.photo_url),
    coordinates: [coordinate(value.lon, 180), coordinate(value.lat, 90)],
    fishIds: [],
  }
}

export function parseSpotDetails(value: unknown): Place {
  const place = parseSpot(value)
  if (!record(value) || !Array.isArray(value.species) || !Array.isArray(value.methods)) throw new Error('Invalid spot details')
  const species = value.species.map((item) => {
    if (!record(item) || !id(item.id) || typeof item.name !== 'string' || !item.name.trim()) throw new Error('Invalid spot species')
    return { id: String(item.id), name: item.name.trim() }
  })
  const methods = value.methods.map((item) => {
    if (!record(item) || !id(item.id) || typeof item.name !== 'string' || !item.name.trim()) throw new Error('Invalid spot method')
    return item.name.trim()
  })
  let aliases: string[] | undefined
  if (value.aliases != null) {
    if (!Array.isArray(value.aliases)) throw new Error('Invalid spot aliases')
    aliases = value.aliases.map((item) => {
      if (typeof item !== 'string' || !item.trim()) throw new Error('Invalid spot alias')
      return item.trim()
    })
  }
  return { ...place, description: optionalText(value.description), species, fishIds: species.map((item) => item.id), methods, aliases }
}

export async function loadSpots(cityId: number, apiBase: string, signal: AbortSignal, filters?: SpotFilters): Promise<Place[]> {
  if (!id(cityId)) throw new Error('Invalid city ID')
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}/spots?${spotsQuery(cityId, filters)}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Spot request failed: ${response.status}`)
  const data: unknown = await response.json()
  if (!Array.isArray(data)) throw new Error('Invalid spot list')
  return data.map((item) => {
    const spot = parseSpot(item)
    if (!record(item) || item.city_id !== cityId) throw new Error('Unexpected spot city')
    return spot
  })
}

export async function loadSpotDetails(spotId: string, apiBase: string, signal: AbortSignal): Promise<Place> {
  if (!/^\d+$/.test(spotId) || !id(Number(spotId))) throw new Error('Invalid spot ID')
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}/spots/${spotId}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Spot request failed: ${response.status}`)
  const place = parseSpotDetails(await response.json())
  if (place.id !== spotId) throw new Error('Unexpected spot ID')
  return place
}
