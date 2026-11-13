import { Fragment, useId, useState } from 'react'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import pinIcon from '@/assets/icons/map/pin.svg'
import heartIcon from '@/assets/icons/social/heart.svg'
import commentIcon from '@/assets/icons/social/comment.svg'
import externalIcon from '@/assets/icons/social/external.svg'
import { Avatar } from '@/components/ui/avatar/Avatar'
import { Badge } from '@/components/ui/badge/Badge'
import { Button } from '@/components/ui/button/Button'
import { formatPostDate, getTelegramPostUrl } from './feed-model'
import type { FeedPost } from './feed-model'

type PostCardProps = {
  post: FeedPost
  referenceTime: string
  liked: boolean
  following: boolean
  onLike: () => void
  onFollow: () => void
}

export function PostCard({ post, referenceTime, liked, following, onLike, onFollow }: PostCardProps) {
  const headingId = useId()
  const [failedImage, setFailedImage] = useState<string>()
  const hasImage = post.image && post.image.src !== failedImage
  const metadata = [
    post.fish && { ...post.fish, icon: fishIcon, narrowIcon: false },
    post.place && { ...post.place, icon: pinIcon, narrowIcon: true },
  ].filter((entity) => entity != null)
  const sourceUrl = post.source.type === 'telegram' ? getTelegramPostUrl(post.source.url) : undefined
  const publishedLabel = formatPostDate(post.publishedAt, referenceTime)

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-4xl bg-surface p-4 sm:p-6" aria-labelledby={headingId}>
      <header className="flex flex-wrap items-center gap-3">
        <Avatar initials={post.author.initials} src={post.author.avatarUrl} size="md" tone="soft" />
        <div className="min-w-0 flex-1 basis-24">
          <h2 className="m-0 text-sm leading-5 font-extrabold wrap-anywhere sm:text-base sm:leading-6" id={headingId}>{post.author.name}</h2>
          <p className="m-0 mt-0.5 flex flex-wrap gap-x-1.5 text-xs leading-4 font-medium text-text-muted">
            {post.source.type === 'telegram' && <span>Telegram</span>}
            {post.publishedAt && Number.isFinite(Date.parse(post.publishedAt)) ? (
              <time dateTime={post.publishedAt} title={`Опубликовано ${publishedLabel}`}>
                <span className="sr-only">Опубликовано </span>{publishedLabel}
              </time>
            ) : <span>{publishedLabel}</span>}
          </p>
        </div>
        {post.source.type === 'community' && (
          <Button
            variant="secondary"
            size="sm"
            className="relative -top-1"
            aria-pressed={following}
            aria-label={`${following ? 'Отписаться от автора' : 'Подписаться на автора'} ${post.author.name}`}
            onClick={onFollow}
          >
            {following ? 'Вы подписаны' : 'Подписаться'}
          </Button>
        )}
      </header>

      {hasImage && post.image && (
        <div className="relative overflow-hidden rounded-3xl">
          <img
            className="block aspect-video w-full object-cover sm:aspect-7/3"
            src={post.image.src}
            alt={post.image.alt}
            loading="lazy"
            onError={() => setFailedImage(post.image?.src)}
          />
          {metadata.length > 0 && (
            <div className="absolute right-3 bottom-3 left-3 flex flex-wrap justify-end gap-1.5 sm:right-4 sm:bottom-4 sm:left-4">
              {metadata.map((entity) => <Badge key={entity.id} icon={entity.icon} narrowIcon={entity.narrowIcon} tone="overlay">{entity.name}</Badge>)}
            </div>
          )}
        </div>
      )}
      {post.image && !hasImage && <p className="m-0 text-sm text-text-muted" role="status">Не удалось загрузить фото. Попробуйте обновить страницу.</p>}
      <p className="m-0 text-sm leading-relaxed whitespace-pre-line wrap-anywhere sm:text-base sm:leading-snug">
        {post.text}
        {!hasImage && metadata.map((entity) => (
          <Fragment key={entity.id}>
            {' '}<Badge icon={entity.icon} narrowIcon={entity.narrowIcon} size="sm">{entity.name}</Badge>
          </Fragment>
        ))}
      </p>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-pill border-0 bg-transparent px-0 py-1 text-lg leading-6 tabular-nums hover:text-focus sm:min-h-8 ${liked ? 'font-bold text-focus' : 'text-text-muted'}`}
          type="button"
          aria-label={liked ? 'Убрать лайк' : 'Нравится'}
          aria-pressed={liked}
          onClick={onLike}
        >
          <img className="size-5.5" src={heartIcon} alt="" />
          <span>{post.likesCount + Number(liked)}</span>
        </button>
        <span className="inline-flex min-h-8 items-center gap-1.5 text-lg leading-6 text-text-muted tabular-nums" aria-label={`Комментарии, ${post.commentsCount}`}>
          <img className="size-5.5" src={commentIcon} alt="" />
          <span>{post.commentsCount}</span>
        </span>
        {post.source.type === 'telegram' && (
          sourceUrl ? (
            <a className="ml-auto inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-pill text-xs font-extrabold text-focus no-underline hover:underline" href={sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Источник в Telegram, ${post.author.name}, откроется в новой вкладке`}>
              <img className="size-4" src={externalIcon} alt="" />
              Источник
            </a>
          ) : (
            <span className="ml-auto inline-flex min-h-8 cursor-pointer items-center gap-1.5 text-xs font-extrabold text-focus hover:underline" title="Демонстрационная публикация. Ссылка на оригинал пока не добавлена.">
              <img className="size-4" src={externalIcon} alt="" />
              Источник<span className="sr-only"> пока не добавлен</span>
            </span>
          )
        )}
      </footer>
    </article>
  )
}
