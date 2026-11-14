import { useEffect, useState } from 'react'
import type { SelectOption } from '@/components/ui/select/Select'
import { loadFeed, loadFishOptions } from './feed-api'
import type { FeedFiltersValue, FeedPost, FeedState } from './feed-model'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
const timeout = () => AbortSignal.timeout(20000)

type Loaded = { key: string; attempt: number } & (
  | { posts: FeedPost[]; nextCursor: string | null; moreError: boolean }
  | { error: true }
)

// Первая страница грузится при смене города или фильтров, следующие — по кнопке.
export function useFeed(cityId: number, filters: FeedFiltersValue) {
  const key = `${cityId}|${filters.source}|${filters.placeId}|${filters.fishId}`
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Loaded | null>(null)
  const [moreCursor, setMoreCursor] = useState<string | null>(null)
  const current = result?.key === key && result.attempt === attempt ? result : null
  const ready = current && !('error' in current) ? current : null
  const cursor = ready?.nextCursor ?? null
  const loadingMore = moreCursor !== null && moreCursor === cursor

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, timeout()])
    loadFeed(cityId, filters, null, apiBase, signal).then((page) => {
      if (!controller.signal.aborted) setResult({ key, attempt, posts: page.posts, nextCursor: page.nextCursor, moreError: false })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, attempt, error: true })
    })
    return () => controller.abort()
    // filters входит в key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  useEffect(() => {
    if (!loadingMore || !cursor) return
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, timeout()])
    loadFeed(cityId, filters, cursor, apiBase, signal).then((page) => {
      if (controller.signal.aborted) return
      setResult((value) => {
        if (!value || value.key !== key || 'error' in value) return value
        const known = new Set(value.posts.map((post) => post.id))
        return { ...value, posts: [...value.posts, ...page.posts.filter((post) => !known.has(post.id))], nextCursor: page.nextCursor, moreError: false }
      })
      setMoreCursor(null)
    }).catch(() => {
      if (controller.signal.aborted) return
      setResult((value) => value && value.key === key && !('error' in value) ? { ...value, moreError: true } : value)
      setMoreCursor(null)
    })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, cursor])

  const state: FeedState = !current ? { status: 'loading' } : 'error' in current ? { status: 'error' } : { status: 'ready', posts: current.posts }
  return {
    state,
    hasMore: Boolean(cursor),
    loadingMore,
    moreError: Boolean(ready?.moreError),
    loadMore() {
      if (!cursor) return
      setResult((value) => value && !('error' in value) ? { ...value, moreError: false } : value)
      setMoreCursor(cursor)
    },
    retry() {
      setResult(null)
      setAttempt((value) => value + 1)
    },
  }
}

// Список видов для фильтра. При сбое фильтр остаётся пустым.
export function useFishOptions() {
  const [options, setOptions] = useState<readonly SelectOption[]>([])
  useEffect(() => {
    const controller = new AbortController()
    loadFishOptions(apiBase, AbortSignal.any([controller.signal, timeout()])).then((value) => {
      if (!controller.signal.aborted) setOptions(value)
    }).catch(() => {})
    return () => controller.abort()
  }, [])
  return options
}
