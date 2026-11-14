import { useState } from 'react'
import { setFollow, setLike } from './feed-actions'
import type { FeedPost } from './feed-model'

// Лайки и подписки с мгновенным откликом. При ошибке состояние возвращается.
export function useReactions(signedIn: boolean, onRequireAuth: () => void) {
  const [likes, setLikes] = useState<Record<string, boolean>>({})
  const [follows, setFollows] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  function toggle(
    id: string, current: boolean, store: Record<string, boolean>,
    update: (next: Record<string, boolean>) => void, send: (next: boolean) => Promise<unknown>,
  ) {
    if (!signedIn) { onRequireAuth(); return }
    const next = !current
    setError('')
    update({ ...store, [id]: next })
    send(next).catch(() => {
      update({ ...store, [id]: current })
      setError('Не удалось сохранить действие. Попробуйте ещё раз.')
    })
  }

  return {
    error,
    isLiked: (post: FeedPost) => likes[post.id] ?? post.likedByMe ?? false,
    isFollowing: (post: FeedPost) => follows[post.author.id] ?? post.author.isFollowing ?? false,
    toggleLike: (post: FeedPost) => toggle(post.id, likes[post.id] ?? post.likedByMe ?? false, likes, setLikes, (next) => setLike(post.id, next)),
    toggleFollow: (post: FeedPost) => toggle(post.author.id, follows[post.author.id] ?? post.author.isFollowing ?? false, follows, setFollows, (next) => setFollow(post.author.id, next)),
  }
}
