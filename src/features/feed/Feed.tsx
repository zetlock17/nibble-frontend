import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button/Button'
import { FeedFilters } from './FeedFilters'
import { PostCard } from './PostCard'
import { initialFeedFilters } from './feed-model'
import type { FeedFiltersValue, FeedState } from './feed-model'
import type { SelectOption } from '@/components/ui/select/Select'

type FeedProps = {
  state: FeedState
  referenceTime: string
  filters: FeedFiltersValue
  onFiltersChange: (filters: FeedFiltersValue) => void
  places: readonly SelectOption[]
  fish: readonly SelectOption[]
  more?: { hasMore: boolean; loading: boolean; error: boolean; onLoad: () => void }
  onRetry?: () => void
  resources?: ReactNode
}

export function Feed({ state, referenceTime, filters, onFiltersChange, places, fish, more, onRetry, resources }: FeedProps) {
  const [likedPosts, setLikedPosts] = useState<string[]>([])
  const [followedAuthors, setFollowedAuthors] = useState<string[]>([])
  const posts = state.status === 'ready' ? state.posts : []
  const resetFilters = () => onFiltersChange(initialFeedFilters)
  const hasFilters = filters.source !== 'all' || Boolean(filters.placeId) || Boolean(filters.fishId)

  return (
    <section data-page-scroll className="flex w-full min-w-0 max-w-188 flex-col gap-2 sm:h-full sm:min-h-0 sm:overflow-y-auto sm:overscroll-none" aria-label="Лента уловов">
      <div aria-hidden="true" className="hidden h-8 shrink-0 sm:block" />
      <FeedFilters
        value={filters}
        places={places}
        fish={fish}
        onChange={onFiltersChange}
        onReset={resetFilters}
      />
      {resources && <div className="shrink-0 py-2 2xl:hidden">{resources}</div>}
      <div className="flex shrink-0 flex-col gap-6" aria-busy={state.status === 'loading'}>
        {state.status === 'ready' ? (
          posts.length > 0 ? posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              referenceTime={referenceTime}
              liked={likedPosts.includes(post.id)}
              following={followedAuthors.includes(post.author.id)}
              onLike={() => setLikedPosts((current) => current.includes(post.id) ? current.filter((id) => id !== post.id) : [...current, post.id])}
              onFollow={() => setFollowedAuthors((current) => current.includes(post.author.id) ? current.filter((id) => id !== post.author.id) : [...current, post.author.id])}
            />
          )) : (
            <div className="rounded-4xl bg-surface p-6" role="status">
              <p className="m-0 text-sm text-text-muted">{hasFilters ? 'По этим фильтрам публикаций нет. Попробуйте выбрать другое место или рыбу.' : 'Публикаций пока нет. Загляните позже.'}</p>
              {hasFilters && <Button className="mt-4" variant="secondary" onClick={resetFilters}>Сбросить фильтры</Button>}
            </div>
          )
        ) : (
          <div className="rounded-4xl bg-surface p-6" role="status">
            <p className="m-0 text-sm text-text-muted">{state.status === 'loading' ? 'Загружаем публикации…' : 'Не удалось загрузить ленту. Проверьте соединение и повторите.'}</p>
            {state.status === 'error' && onRetry && <Button className="mt-4" variant="secondary" onClick={onRetry}>Повторить</Button>}
          </div>
        )}
        {more?.hasMore && state.status === 'ready' && (
          <div className="flex flex-col items-center gap-2 pb-6">
            {more.error && <p className="m-0 text-sm text-text-muted" role="status">Не удалось загрузить следующие публикации.</p>}
            <Button variant="secondary" disabled={more.loading} onClick={more.onLoad}>{more.loading ? 'Загружаем…' : more.error ? 'Повторить' : 'Показать ещё'}</Button>
          </div>
        )}
      </div>
    </section>
  )
}
