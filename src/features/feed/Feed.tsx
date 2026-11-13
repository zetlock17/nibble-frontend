import { useState } from 'react'
import { Button } from '@/components/ui/button/Button'
import { FeedFilters } from './FeedFilters'
import { PostCard } from './PostCard'
import { filterPosts, getFeedOptions, initialFeedFilters } from './feed-model'
import type { FeedState } from './feed-model'

type FeedProps = {
  state: FeedState
  referenceTime: string
}

export function Feed({ state, referenceTime }: FeedProps) {
  const [filters, setFilters] = useState(initialFeedFilters)
  const [likedPosts, setLikedPosts] = useState<string[]>([])
  const [followedAuthors, setFollowedAuthors] = useState<string[]>([])
  const posts = state.status === 'ready' ? state.posts : []
  const filteredPosts = filterPosts(posts, filters)
  const resetFilters = () => setFilters(initialFeedFilters)
  const hasFilters = filters.source !== 'all' || Boolean(filters.placeId) || Boolean(filters.fishId)

  return (
    <section className="flex w-full min-w-0 max-w-188 flex-col gap-6 sm:h-full sm:min-h-0" aria-label="Лента уловов">
      <FeedFilters
        value={filters}
        places={getFeedOptions(posts, 'place')}
        fish={getFeedOptions(posts, 'fish')}
        onChange={setFilters}
        onReset={resetFilters}
      />
      <div className="flex flex-col gap-6 sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:overscroll-none sm:[&>*]:shrink-0" aria-busy={state.status === 'loading'}>
        {state.status === 'ready' ? (
          filteredPosts.length > 0 ? filteredPosts.map((post) => (
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
          <p className="m-0 rounded-4xl bg-surface p-6 text-sm text-text-muted" role="status">
            {state.status === 'loading' ? 'Загружаем публикации…' : 'Не удалось загрузить ленту. Попробуйте обновить страницу.'}
          </p>
        )}
      </div>
    </section>
  )
}
