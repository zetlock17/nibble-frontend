import type { Fish, Season } from './fish.ts'

export type SpeciesShort = {
  id: number
  name: string
  short_description: string
  image_url: string
  months: number[]
}
export type SpeciesOut = SpeciesShort & {
  latin_name: string | null
  description: string | null
  identification: string | null
  typical_length_cm: number | null
  typical_weight_g: number | null
}
export type FishingMethodOut = { id: number; name: string }

const seasonMonths = {
  winter: [12, 1, 2], spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11],
} satisfies Record<Exclude<Season, 'all'>, number[]>
const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function validId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}
function nullableText(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}
function nullableSize(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
}
function parseSpecies(value: unknown): SpeciesShort {
  if (!record(value) || !validId(value.id) || typeof value.name !== 'string' || !value.name.trim()
    || typeof value.short_description !== 'string' || typeof value.image_url !== 'string'
    || !Array.isArray(value.months) || !value.months.every((m: unknown) => typeof m === 'number' && Number.isInteger(m) && m >= 1 && m <= 12)) {
    throw new Error('Invalid species response')
  }
  return { id: value.id, name: value.name, short_description: value.short_description, image_url: value.image_url, months: value.months }
}

export function speciesToFish(species: SpeciesShort | SpeciesOut): Fish {
  const catchMonths = [...new Set(species.months)].sort((a, b) => a - b)
  const image = species.image_url.trim()
  const safeImage = /^(https?:\/\/|\/(?!\/))/.test(image) ? image : undefined
  return {
    id: String(species.id), name: species.name, description: species.short_description,
    image: safeImage, catchMonths,
    period: catchMonths.length === 12 ? 'Круглый год' : catchMonths.map((m) => monthNames[m - 1]).join(', ') || undefined,
    seasons: (Object.keys(seasonMonths) as Exclude<Season, 'all'>[]).filter((season) => seasonMonths[season].some((m) => catchMonths.includes(m))),
    ...('description' in species ? { details: {
      latinName: species.latin_name ?? undefined, description: species.description ?? undefined,
      identification: species.identification ?? undefined, typicalLengthCm: species.typical_length_cm ?? undefined,
      typicalWeightG: species.typical_weight_g ?? undefined,
    } } : {}),
  }
}

async function request(path: string, apiBase: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}${path}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Species request failed: ${response.status}`)
  return response.json()
}

export async function loadSpecies(query: string, season: Season, apiBase: string, signal: AbortSignal): Promise<Fish[]> {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (season !== 'all') params.set('season', season)
  const data = await request(`/species${params.size ? `?${params}` : ''}`, apiBase, signal)
  if (!Array.isArray(data)) throw new Error('Invalid species list')
  return data.map((item) => speciesToFish(parseSpecies(item)))
}

export async function loadSpeciesDetails(id: string, apiBase: string, signal: AbortSignal): Promise<Fish> {
  if (!/^\d+$/.test(id) || !validId(Number(id))) throw new Error('Invalid species ID')
  const data = await request(`/species/${id}`, apiBase, signal)
  const species = parseSpecies(data)
  if (!record(data) || data.id !== Number(id) || !nullableText(data.latin_name) || !nullableText(data.description)
    || !nullableText(data.identification) || !nullableSize(data.typical_length_cm) || !nullableSize(data.typical_weight_g)) {
    throw new Error('Invalid species details')
  }
  return speciesToFish({ ...species, latin_name: data.latin_name, description: data.description, identification: data.identification,
    typical_length_cm: data.typical_length_cm, typical_weight_g: data.typical_weight_g })
}

export async function loadFishingMethods(apiBase: string, signal: AbortSignal) {
  const data = await request('/fishing-methods', apiBase, signal)
  if (!Array.isArray(data)) throw new Error('Invalid fishing methods')
  return data.map((item: unknown) => {
    if (!record(item) || !validId(item.id) || typeof item.name !== 'string' || !item.name.trim()) throw new Error('Invalid fishing method')
    return { value: String(item.id), label: item.name }
  })
}
