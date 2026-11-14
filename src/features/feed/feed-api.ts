import type { SelectOption } from '@/components/ui/select/Select'
import type { FeedFiltersValue, FeedPost } from './feed-model'

export type FeedPage = { posts: FeedPost[]; nextCursor: string | null }

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined
const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
const entity = (value: unknown) => {
  if (!record(value) || typeof value.id !== 'number' || !text(value.name)) return undefined
  return { id: String(value.id), name: text(value.name)! }
}
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((word) => word[0]?.toLocaleUpperCase('ru')).join('') || '?'

// Публикации из источников, которых нет в интерфейсе (например, vk), возвращают null и в ленту не попадают.
export function parsePost(value: unknown): FeedPost | null {
  if (!record(value) || typeof value.id !== 'number' || typeof value.text !== 'string' || !record(value.source)) throw new Error('Invalid post')
  const sourceType = value.source.type
  if (sourceType !== 'klev' && sourceType !== 'telegram') return null
  const author = record(value.author) ? entity({ id: value.author.id, name: value.author.display_name }) : undefined
  const authorName = author?.name ?? text(value.source.name) ?? 'Автор неизвестен'
  const photo = Array.isArray(value.media) ? value.media.find((item) => record(item) && item.type === 'photo' && text(item.url)) as Record<string, unknown> | undefined : undefined
  const species = Array.isArray(value.species) ? value.species.map(entity).find(Boolean) : undefined
  const isTelegram = sourceType === 'telegram'
  return {
    id: String(value.id),
    author: {
      id: author?.id ?? `source-${String(value.source.id)}`,
      name: authorName,
      initials: initials(authorName),
      avatarUrl: record(value.author) ? text(value.author.avatar_url) : undefined,
    },
    publishedAt: text(value.published_at) ?? null,
    fishingDate: text(value.fishing_date) ?? null,
    image: photo ? { src: text(photo.url)!, alt: 'Фото из публикации' } : undefined,
    fish: species,
    place: entity(value.spot),
    text: value.text.trim(),
    likesCount: count(isTelegram ? value.tg_reactions_count : value.likes_count),
    commentsCount: count(isTelegram ? value.tg_comments_count : value.comments_count),
    source: isTelegram ? { type: 'telegram', url: text(value.original_url) ?? text(value.source.url) } : { type: 'community' },
  }
}

export function parseFeedPage(value: unknown): FeedPage {
  if (!record(value) || !Array.isArray(value.items)) throw new Error('Invalid feed page')
  const cursor = value.next_cursor
  if (cursor != null && typeof cursor !== 'string') throw new Error('Invalid feed cursor')
  return { posts: value.items.map(parsePost).filter((post) => post !== null), nextCursor: cursor || null }
}

const apiSource = { community: 'klev', telegram: 'telegram' } as const

export function feedQuery(cityId: number, filters: FeedFiltersValue, cursor?: string | null) {
  const params = new URLSearchParams({ city_id: String(cityId), limit: '20' })
  if (filters.source !== 'all') params.set('source', apiSource[filters.source])
  if (filters.placeId) params.set('spot_id', filters.placeId)
  if (filters.fishId) params.set('species_id', filters.fishId)
  if (cursor) params.set('cursor', cursor)
  return params.toString()
}

export async function loadFeed(cityId: number, filters: FeedFiltersValue, cursor: string | null, apiBase: string, signal: AbortSignal): Promise<FeedPage> {
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}/posts?${feedQuery(cityId, filters, cursor)}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Feed request failed: ${response.status}`)
  return parseFeedPage(await response.json())
}

export async function loadFishOptions(apiBase: string, signal: AbortSignal): Promise<SelectOption[]> {
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}/species`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Species request failed: ${response.status}`)
  const data: unknown = await response.json()
  if (!Array.isArray(data)) throw new Error('Invalid species list')
  return data.map((item) => {
    const fish = entity(item)
    if (!fish) throw new Error('Invalid species')
    return { value: fish.id, label: fish.name }
  })
}
