export type FeedEntity = { id: string; name: string }

export type FeedPost = {
  id: string
  author: FeedEntity & { initials: string; avatarUrl?: string }
  publishedAt: string | null
  fishingDate?: string | null
  image?: { src: string; alt: string }
  fish?: FeedEntity
  place?: FeedEntity
  text: string
  likesCount: number
  commentsCount: number
  source: { type: 'community' } | { type: 'telegram'; url?: string }
}

export type FeedFiltersValue = {
  source: 'all' | FeedPost['source']['type']
  placeId: string
  fishId: string
}

export type FeedState =
  | { status: 'loading' | 'error' }
  | { status: 'ready'; posts: readonly FeedPost[] }

export const initialFeedFilters: FeedFiltersValue = { source: 'all', placeId: '', fishId: '' }

export function formatPostDate(publishedAt: string | null, referenceTime: string) {
  if (!publishedAt || !Number.isFinite(Date.parse(publishedAt))) return 'Дата публикации неизвестна'

  const date = new Date(publishedAt)
  const options = { timeZone: 'Asia/Vladivostok' }
  const dayFormatter = new Intl.DateTimeFormat('en-CA', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' })
  const time = new Intl.DateTimeFormat('ru-RU', { ...options, hour: '2-digit', minute: '2-digit' }).format(date)
  const reference = new Date(referenceTime)

  if (Number.isFinite(reference.getTime())) {
    const day = dayFormatter.format(date)
    if (day === dayFormatter.format(reference)) return `сегодня, ${time}`
    if (day === dayFormatter.format(new Date(reference.getTime() - 86_400_000))) return `вчера, ${time}`
  }

  const fullDate = new Intl.DateTimeFormat('ru-RU', { ...options, day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  return `${fullDate}, ${time}`
}

export function getTelegramPostUrl(url?: string) {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' && parsed.hostname === 't.me' && !parsed.username && !parsed.password && !parsed.port) {
      return parsed.href
    }
  } catch {
    return undefined
  }
  return undefined
}
