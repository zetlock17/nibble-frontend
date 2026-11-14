import { getFarpostListingUrl, type TackleListing } from './tackle.ts'

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function photoUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href
  } catch { /* Не показываем некорректные ссылки на фото. */ }
  return undefined
}

export function parseTackleListings(value: unknown): TackleListing[] {
  if (!Array.isArray(value)) throw new Error('Invalid tackle list')
  const ids = new Set<number>()
  return value.map((item: unknown) => {
    if (!record(item) || typeof item.id !== 'number' || !Number.isSafeInteger(item.id) || item.id < 1 || ids.has(item.id)
      || typeof item.title !== 'string' || !item.title.trim() || typeof item.url !== 'string'
      || (item.price_from_rub != null && (typeof item.price_from_rub !== 'number' || !Number.isSafeInteger(item.price_from_rub) || item.price_from_rub < 0))
      || (item.image_url != null && typeof item.image_url !== 'string')) throw new Error('Invalid tackle listing')
    ids.add(item.id)
    const image = typeof item.image_url === 'string' ? photoUrl(item.image_url) : undefined
    return {
      id: String(item.id), title: item.title.trim(),
      sourceUrl: getFarpostListingUrl(item.url),
      images: image ? [image] : [],
      price: typeof item.price_from_rub === 'number' ? item.price_from_rub : undefined,
    }
  })
}

export async function loadTackleListings(limit: number, apiBase: string, signal: AbortSignal): Promise<TackleListing[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid tackle limit')
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}/tackle?limit=${limit}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Tackle request failed: ${response.status}`)
  return parseTackleListings(await response.json())
}
