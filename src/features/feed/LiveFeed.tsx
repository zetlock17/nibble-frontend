import { useMemo, useState, type ReactNode } from 'react'
import { useSpots } from '@/features/map/use-spots'
import { Feed } from './Feed'
import { initialFeedFilters } from './feed-model'
import { useFeed, useFishOptions } from './use-feed'
import { useReactions } from './use-reactions'

// Лента из API: загрузка, фильтры на стороне сервера и подгрузка страниц.
type LiveFeedProps = { cityId: number; userId?: number; onRequireAuth: () => void; resources?: ReactNode }

export function LiveFeed({ cityId, userId, onRequireAuth, resources }: LiveFeedProps) {
  const [filters, setFilters] = useState(initialFeedFilters)
  const [referenceTime] = useState(() => new Date().toISOString())
  const feed = useFeed(cityId, userId ?? 0, filters)
  const spots = useSpots(cityId, true)
  const fish = useFishOptions()
  const reactions = useReactions(userId !== undefined, onRequireAuth)
  const places = useMemo(() => spots.places.map((place) => ({ value: place.id, label: place.name })), [spots.places])

  return (
    <Feed
      state={feed.state}
      referenceTime={referenceTime}
      filters={filters}
      onFiltersChange={setFilters}
      places={places}
      fish={fish}
      more={{ hasMore: feed.hasMore, loading: feed.loadingMore, error: feed.moreError, onLoad: feed.loadMore }}
      onRetry={feed.retry}
      reactions={reactions}
      currentUserId={userId === undefined ? undefined : String(userId)}
      onRequireAuth={onRequireAuth}
      resources={resources}
    />
  )
}
