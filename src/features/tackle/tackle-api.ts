import { getFarpostListingUrl, type TackleListing } from './tackle.ts'

export type ListingDetail = {
  farpost_id: string
  title: string
  url: string
  price_rub: number | null
  photo_urls: string[]
  seller_name: string | null
}

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

export function parseFarpostListings(value: unknown): TackleListing[] {
  if (!Array.isArray(value)) throw new Error('Invalid Farpost list')
  const ids = new Set<string>()
  return value.map((item: unknown) => {
    if (!record(item) || typeof item.farpost_id !== 'string' || !/^\d+$/.test(item.farpost_id) || ids.has(item.farpost_id)
      || typeof item.title !== 'string' || !item.title.trim() || typeof item.url !== 'string'
      || (item.price_rub != null && (typeof item.price_rub !== 'number' || !Number.isSafeInteger(item.price_rub) || item.price_rub < 0))
      || !Array.isArray(item.photo_urls) || !item.photo_urls.every((photo: unknown) => typeof photo === 'string')
      || (item.seller_name != null && typeof item.seller_name !== 'string')) throw new Error('Invalid Farpost listing')
    ids.add(item.farpost_id)
    const images = item.photo_urls.flatMap((photo: string) => photoUrl(photo) ?? [])
    const seller = typeof item.seller_name === 'string' ? item.seller_name.trim() : ''
    return {
      id: `farpost-${item.farpost_id}`, title: item.title.trim(),
      sourceUrl: getFarpostListingUrl(item.url),
      images: [...new Set(images)],
      price: typeof item.price_rub === 'number' ? item.price_rub : undefined,
      seller: seller ? { name: seller } : undefined,
    }
  })
}

export async function loadFarpostListings(limit: number, apiBase: string, signal: AbortSignal): Promise<TackleListing[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('Invalid Farpost limit')
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}/aggregator/farpost?limit=${limit}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Farpost request failed: ${response.status}`)
  return parseFarpostListings(await response.json())
}
