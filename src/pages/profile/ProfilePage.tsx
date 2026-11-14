import { useState } from 'react'
import editIcon from '@/assets/icons/actions/edit_pen.svg'
import plusIcon from '@/assets/icons/actions/plus.svg'
import logoutIcon from '@/assets/icons/actions/logout.svg'
import pinIcon from '@/assets/icons/map/pin.svg'
import { Avatar } from '@/components/ui/avatar/Avatar'
import { Button } from '@/components/ui/button/Button'
import { PhotoGrid } from '@/components/ui/photo-grid/PhotoGrid'
import type { GridPhoto } from '@/components/ui/photo-grid/PhotoGrid'
import { PostCard } from '@/features/feed/PostCard'
import type { FeedState } from '@/features/feed/feed-model'
import type { profileMock } from '@/mocks/profile/profile'

type ProfilePageProps = {
  profile: typeof profileMock & { avatarUrl?: string }
  state: FeedState
  referenceTime: string
  photos: readonly GridPhoto[]
  onAddCatch: () => void
  onSignOut: () => void
  signingOut: boolean
}

const postLabels = { one: 'пост', few: 'поста', many: 'постов', other: 'поста' }
const followerLabels = { one: 'подписчик', few: 'подписчика', many: 'подписчиков', other: 'подписчика' }
const pluralRules = new Intl.PluralRules('ru')

export function ProfilePage({ profile, state, referenceTime, photos, onAddCatch, onSignOut, signingOut }: ProfilePageProps) {
  const [likedPosts, setLikedPosts] = useState<string[]>([])
  const [failedCover, setFailedCover] = useState<string>()
  const posts = state.status === 'ready' ? state.posts : []

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="overflow-hidden rounded-4xl bg-surface" aria-labelledby="profile-name">
        <div className="h-36 bg-accent-soft sm:h-44 lg:h-48">
          {profile.cover.src !== failedCover && <img className="block size-full object-cover" src={profile.cover.src} alt={profile.cover.alt} onError={() => setFailedCover(profile.cover.src)} />}
        </div>
        <div className="px-4 pb-6 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="-mt-10 rounded-pill border-8 border-surface bg-surface">
              <Avatar initials={profile.initials} src={profile.avatarUrl} size="lg" />
            </div>
            <div className="flex flex-wrap gap-3 pt-4 max-md:w-full max-md:pt-0">
              <Button size="md" onClick={onAddCatch}>
                <img className="size-5" src={plusIcon} alt="" />Добавить улов
              </Button>
              <Button variant="dark" size="md" aria-disabled="true" title="Редактирование профиля пока недоступно">
                <img className="size-5" src={editIcon} alt="" />Редактировать профиль
              </Button>
              <Button variant="danger" size="md" disabled={signingOut} onClick={onSignOut}>
                <img className="size-5 brightness-0 invert" src={logoutIcon} alt="" />{signingOut ? 'Выходим…' : 'Выйти из аккаунта'}
              </Button>
            </div>
          </div>
          <h1 className="mt-4 mb-3 text-3xl leading-tight font-extrabold wrap-anywhere lg:text-4xl" id="profile-name">{profile.name}</h1>
          <p className="m-0 flex items-center gap-1.5 text-xs text-text-muted">
            <img className="size-4" src={pinIcon} alt="" />{profile.city || 'Город не указан'}
          </p>
          <p className="mt-3 mb-0 max-w-136 text-sm leading-relaxed sm:text-base">{profile.bio || 'Рыбак пока не рассказал о себе.'}</p>
          <dl className="mt-3 mb-0 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
            <div className="flex items-baseline gap-1">
              <dd className="m-0 text-base font-extrabold text-text">{state.status === 'ready' ? posts.length : '—'}</dd>
              <dt>{postLabels[pluralRules.select(posts.length) as keyof typeof postLabels]}</dt>
            </div>
            <div className="flex items-baseline gap-1">
              <dd className="m-0 text-base font-extrabold text-text">{profile.followersCount}</dd>
              <dt>{followerLabels[pluralRules.select(profile.followersCount) as keyof typeof followerLabels]}</dt>
            </div>
          </dl>
          {failedCover === profile.cover.src && <p className="mt-3 mb-0 text-xs text-text-muted" role="status">Не удалось загрузить обложку. Попробуйте обновить страницу.</p>}
        </div>
      </section>

      <div className={`flex min-w-0 flex-col gap-6 xl:flex-row ${state.status === 'ready' && posts.length === 0 && photos.length === 0 ? 'xl:items-stretch' : 'xl:items-start'}`}>
      <section className="flex w-full min-w-0 max-w-188 flex-col gap-6 xl:w-3/5 xl:shrink-0" aria-label="Публикации профиля" aria-busy={state.status === 'loading'}>
        {state.status === 'ready' && posts.length > 0 ? posts.map((post) => (
          <PostCard key={post.id} post={post} referenceTime={referenceTime} liked={likedPosts.includes(post.id)} onLike={() => setLikedPosts((current) => current.includes(post.id) ? current.filter((id) => id !== post.id) : [...current, post.id])} />
        )) : (
          <p className="m-0 w-full flex-1 rounded-4xl bg-surface p-6 text-sm text-text-muted" role="status">
            {state.status === 'loading' ? 'Загружаем публикации…' : state.status === 'error' ? 'Не удалось загрузить публикации. Попробуйте обновить страницу.' : 'Публикаций пока нет. Здесь появятся ваши отчёты об уловах.'}
          </p>
        )}
      </section>
      {/* 100cqh — доступная высота области контента, независимо от высоты хедера. */}
      <aside className="@container order-first w-full min-w-0 rounded-4xl bg-surface p-4 sm:p-6 xl:sticky xl:top-0 xl:order-last xl:max-h-[100cqh] xl:w-auto xl:flex-1 xl:overflow-y-auto xl:overscroll-none" aria-labelledby="profile-photos-heading">
        <h2 className="mt-0 mb-4 text-lg leading-6 font-extrabold" id="profile-photos-heading">Фото с рыбалок</h2>
        <PhotoGrid photos={photos} />
      </aside>
      </div>
    </div>
  )
}
