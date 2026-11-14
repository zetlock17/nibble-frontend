import { useState } from 'react'
import { Button } from '@/components/ui/button/Button'
import { adminError, adminSend, usePages } from './admin-api'
import { fieldClass } from './ResourceManager'

type Status = 'published' | 'hidden' | 'moderation'
type AdminPost = {
  id: number; kind: string; text: string; status: Status; published_at: string; original_url: string | null
  source: { type: string; name: string }; author: { display_name: string } | null
  likes_count: number; comments_count: number; media: { type: string; url: string }[]
}
type AdminComment = { id: number; text: string; is_hidden: boolean; created_at: string; author: { display_name: string } | null }

const statuses: { value: Status; label: string }[] = [
  { value: 'published', label: 'Опубликовано' },
  { value: 'moderation', label: 'На проверке' },
  { value: 'hidden', label: 'Скрыто' },
]
const kinds = { fishing_report: 'Отчёт об улове', useful_info: 'Полезное', incident: 'Происшествие' } as Record<string, string>
const sources = { klev: 'Клёв', telegram: 'Telegram', vk: 'VK' } as Record<string, string>
const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Vladivostok' })
const formatDate = (value: string) => Number.isFinite(Date.parse(value)) ? dateFormat.format(new Date(value)) : 'дата неизвестна'

function Comments({ postId }: { postId: number }) {
  const comments = usePages<AdminComment>(`/admin/posts/${postId}/comments?limit=50`)
  const [message, setMessage] = useState('')

  async function toggle(comment: AdminComment) {
    setMessage('')
    try {
      await adminSend(`/admin/comments/${comment.id}`, 'PATCH', { is_hidden: !comment.is_hidden })
      comments.replace((items) => items.map((item) => item.id === comment.id ? { ...item, is_hidden: !item.is_hidden } : item))
    } catch (cause) { setMessage(adminError(cause)) }
  }

  if (comments.status === 'loading') return <p className="m-0 text-sm text-text-muted" role="status">Загружаем комментарии…</p>
  if (comments.status === 'error') return <p className="m-0 text-sm text-danger" role="alert">Не удалось загрузить комментарии. <button type="button" className="border-0 bg-transparent p-0 text-focus underline" onClick={comments.reload}>Повторить</button></p>
  return (
    <div className="flex flex-col gap-3">
      {message && <p className="m-0 text-sm text-danger" role="alert">{message}</p>}
      {!comments.items.length && <p className="m-0 text-sm text-text-muted">Комментариев нет.</p>}
      {comments.items.map((comment) => (
        <div key={comment.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-search p-3">
          <div className="min-w-0 flex-1 basis-60">
            <p className="m-0 text-xs text-text-muted">{comment.author?.display_name ?? 'Автор неизвестен'} · {formatDate(comment.created_at)}{comment.is_hidden ? ' · скрыт' : ''}</p>
            <p className={`mt-1 mb-0 text-sm whitespace-pre-line wrap-anywhere ${comment.is_hidden ? 'text-text-muted line-through' : ''}`}>{comment.text}</p>
          </div>
          <Button variant="secondary" onClick={() => void toggle(comment)}>{comment.is_hidden ? 'Показать' : 'Скрыть'}</Button>
        </div>
      ))}
      {comments.hasMore && <Button variant="secondary" disabled={comments.loadingMore} onClick={comments.loadMore}>{comments.loadingMore ? 'Загружаем…' : 'Показать ещё'}</Button>}
    </div>
  )
}

function PostRow({ post, onStatus }: { post: AdminPost; onStatus: (status: Status) => Promise<string> }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const photo = post.media.find((item) => item.type === 'photo')

  async function change(status: string) {
    setBusy(true)
    setMessage(await onStatus(status as Status))
    setBusy(false)
  }

  return (
    <article className="flex flex-col gap-3 rounded-4xl bg-surface p-4 sm:p-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
        <span className="font-bold text-text">{post.author?.display_name ?? post.source.name}</span>
        <span>{sources[post.source.type] ?? post.source.type}</span>
        <span>{kinds[post.kind] ?? post.kind}</span>
        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        <span>♥ {post.likes_count} · комментарии {post.comments_count}</span>
        {post.original_url && /^https:\/\//.test(post.original_url) && <a className="text-focus" href={post.original_url} target="_blank" rel="noopener noreferrer">Оригинал</a>}
      </header>
      <div className="flex flex-wrap gap-4">
        {photo && <img src={photo.url} alt="Фото публикации" className="h-24 w-32 rounded-2xl object-cover" loading="lazy" />}
        <p className="m-0 line-clamp-5 min-w-0 flex-1 basis-60 text-sm leading-6 whitespace-pre-line wrap-anywhere">{post.text || 'Без текста'}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold">Статус
          <select className={`${fieldClass} w-auto`} value={post.status} disabled={busy} onChange={(event) => void change(event.target.value)}>
            {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <Button variant="secondary" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Скрыть комментарии' : 'Комментарии'}</Button>
      </div>
      {message && <p className="m-0 text-sm text-danger" role="alert">{message}</p>}
      {open && <Comments postId={post.id} />}
    </article>
  )
}

export function PostsModeration() {
  const [filters, setFilters] = useState({ status: '', source: '', kind: '' })
  const params = new URLSearchParams({ limit: '20' })
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  const posts = usePages<AdminPost>(`/admin/posts?${params}`)

  async function setStatus(post: AdminPost, status: Status) {
    try {
      await adminSend(`/admin/posts/${post.id}`, 'PATCH', { status })
      posts.replace((items) => items.map((item) => item.id === post.id ? { ...item, status } : item))
      return ''
    } catch (cause) { return adminError(cause) }
  }

  const select = (key: keyof typeof filters, label: string, options: Record<string, string>) => (
    <label className="flex items-center gap-2 text-sm font-bold">{label}
      <select className={`${fieldClass} w-auto`} value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}>
        <option value="">Все</option>
        {Object.entries(options).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
      </select>
    </label>
  )

  return (
    <section className="flex flex-col gap-4" aria-label="Публикации">
      <div className="flex flex-wrap gap-3">
        {select('status', 'Статус', Object.fromEntries(statuses.map((status) => [status.value, status.label])))}
        {select('source', 'Источник', sources)}
        {select('kind', 'Тип', kinds)}
      </div>
      {posts.status === 'loading' ? <p className="m-0 rounded-4xl bg-surface p-6 text-sm text-text-muted" role="status">Загружаем публикации…</p>
        : posts.status === 'error' ? (
          <div className="rounded-4xl bg-surface p-6" role="alert">
            <p className="m-0 text-sm text-text-muted">Не удалось загрузить публикации. Проверьте соединение и повторите.</p>
            <Button className="mt-4" variant="secondary" onClick={posts.reload}>Повторить</Button>
          </div>
        ) : !posts.items.length ? <p className="m-0 rounded-4xl bg-surface p-6 text-sm text-text-muted" role="status">По этим фильтрам публикаций нет.</p>
        : posts.items.map((post) => <PostRow key={post.id} post={post} onStatus={(status) => setStatus(post, status)} />)}
      {posts.moreError && <p className="m-0 text-sm text-danger" role="alert">Не удалось загрузить следующие публикации.</p>}
      {posts.hasMore && <Button variant="secondary" className="self-center" disabled={posts.loadingMore} onClick={posts.loadMore}>{posts.loadingMore ? 'Загружаем…' : 'Показать ещё'}</Button>}
    </section>
  )
}
