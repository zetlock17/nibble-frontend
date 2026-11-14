import { useEffect, useState } from 'react'
import { authFetch } from '@/features/auth/authed-fetch'
import { loadAuthorPosts } from '@/features/feed/feed-api'
import { getInitials } from '@/features/feed/feed-model'
import type { FeedPost, FeedState } from '@/features/feed/feed-model'
import { useReactions } from '@/features/feed/use-reactions'
import { profileMock } from '@/mocks/profile/profile'
import { ProfilePage } from './ProfilePage'
import type { ProfileView } from './ProfilePage'

type ProfileUser = { id: number; name: string; initials: string; city: string; bio?: string | null; avatarUrl?: string | null }
type Loaded = { userId: number; attempt: number } & ({ profile: ProfileView; posts: FeedPost[] } | { error: true })

// Профиль и публикации текущего пользователя из API.
export function ProfileSection({ user, signingOut, onAddCatch, onSignOut }: { user: ProfileUser; signingOut: boolean; onAddCatch: () => void; onSignOut: () => void }) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Loaded | null>(null)
  const [referenceTime] = useState(() => new Date().toISOString())
  const reactions = useReactions(true, () => {})
  const userId = user.id
  const current = result?.userId === userId && result.attempt === attempt ? result : null

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    Promise.all([
      authFetch(`/users/${userId}/profile`, { signal }).then((response) => response.json()),
      loadAuthorPosts(userId, signal),
    ]).then(([data, page]) => {
      if (controller.signal.aborted) return
      const name = typeof data.display_name === 'string' && data.display_name.trim() ? data.display_name.trim() : user.name
      setResult({
        userId, attempt, posts: page.posts,
        profile: {
          name, initials: getInitials(name), city: user.city, cover: profileMock.cover,
          avatarUrl: typeof data.avatar_url === 'string' && data.avatar_url ? data.avatar_url : undefined,
          bio: typeof data.bio === 'string' ? data.bio : '',
          followersCount: typeof data.followers_count === 'number' ? data.followers_count : 0,
          postsCount: typeof data.posts_count === 'number' ? data.posts_count : page.posts.length,
        },
      })
    }).catch(() => { if (!controller.signal.aborted) setResult({ userId, attempt, error: true }) })
    return () => controller.abort()
    // Имя и город берутся из текущего пользователя только как запасные значения.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, attempt])

  const fallback: ProfileView = { name: user.name, initials: user.initials, city: user.city, bio: user.bio ?? '', avatarUrl: user.avatarUrl ?? undefined, followersCount: 0, cover: profileMock.cover }
  const profile = current && !('error' in current) ? current.profile : fallback
  const state: FeedState = !current ? { status: 'loading' } : 'error' in current ? { status: 'error' } : { status: 'ready', posts: current.posts }
  const photos = state.status === 'ready' ? state.posts.flatMap((post) => post.image ? [{ id: post.id, src: post.image.src, alt: post.image.alt }] : []) : []

  return <ProfilePage profile={profile} state={state} referenceTime={referenceTime} photos={photos} reactions={reactions} signingOut={signingOut} currentUserId={String(userId)} onRetry={() => { setResult(null); setAttempt((value) => value + 1) }} onAddCatch={onAddCatch} onSignOut={onSignOut} />
}
