import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Avatar } from '@/components/ui/avatar/Avatar'
import { Button } from '@/components/ui/button/Button'
import { addComment, deleteComment, loadComments } from './feed-actions'
import type { FeedComment } from './feed-actions'
import { formatPostDate, getInitials } from './feed-model'

type PostCommentsProps = {
  postId: string
  referenceTime: string
  currentUserId?: string
  onRequireAuth: () => void
  // Сообщает карточке, на сколько изменилось число комментариев.
  onCountChange: (delta: number) => void
}

type Loaded = { status: 'loading' } | { status: 'error' } | { status: 'ready'; comments: FeedComment[]; nextCursor: number | null }

export function PostComments({ postId, referenceTime, currentUserId, onRequireAuth, onCountChange }: PostCommentsProps) {
  const inputId = useId()
  const [attempt, setAttempt] = useState(0)
  const [data, setData] = useState<Loaded>({ status: 'loading' })
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    loadComments(postId, null, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]))
      .then((page) => { if (!controller.signal.aborted) setData({ status: 'ready', ...page }) })
      .catch(() => { if (!controller.signal.aborted) setData({ status: 'error' }) })
    return () => controller.abort()
  }, [postId, attempt])

  async function more() {
    if (data.status !== 'ready' || data.nextCursor === null) return
    setLoadingMore(true)
    setMessage('')
    try {
      const page = await loadComments(postId, data.nextCursor, AbortSignal.timeout(20000))
      setData((current) => current.status === 'ready' ? { status: 'ready', comments: [...current.comments, ...page.comments.filter((item) => !current.comments.some((known) => known.id === item.id))], nextCursor: page.nextCursor } : current)
    } catch { setMessage('Не удалось загрузить следующие комментарии. Попробуйте ещё раз.') }
    setLoadingMore(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = text.trim()
    if (!value) { setMessage('Напишите комментарий.'); return }
    setBusy(true)
    setMessage('')
    try {
      const comment = await addComment(postId, value)
      setData((current) => current.status === 'ready' ? { ...current, comments: [...current.comments, comment] } : current)
      setText('')
      onCountChange(1)
    } catch { setMessage('Не удалось отправить комментарий. Текст сохранён, попробуйте ещё раз.') }
    setBusy(false)
  }

  async function remove(comment: FeedComment) {
    setMessage('')
    try {
      await deleteComment(postId, comment.id)
      setData((current) => current.status === 'ready' ? { ...current, comments: current.comments.filter((item) => item.id !== comment.id) } : current)
      onCountChange(-1)
    } catch { setMessage('Не удалось удалить комментарий. Попробуйте ещё раз.') }
  }

  return (
    <section className="flex flex-col gap-4 border-t border-navigation-divider pt-4" aria-label="Комментарии">
      {data.status === 'loading' ? <p className="m-0 text-sm text-text-muted" role="status">Загружаем комментарии…</p>
        : data.status === 'error' ? (
          <p className="m-0 text-sm text-text-muted" role="alert">Не удалось загрузить комментарии. <button type="button" className="border-0 bg-transparent p-0 text-focus underline" onClick={() => { setData({ status: 'loading' }); setAttempt((value) => value + 1) }}>Повторить</button></p>
        ) : (
          <>
            {!data.comments.length && <p className="m-0 text-sm text-text-muted">Комментариев пока нет. Напишите первый.</p>}
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {data.comments.map((comment) => (
                <li key={comment.id} className="flex gap-3">
                  <Avatar initials={getInitials(comment.authorName)} size="md" tone="soft" />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 flex flex-wrap items-baseline gap-x-2 text-xs text-text-muted">
                      <span className="text-sm font-extrabold text-text">{comment.authorName}</span>
                      <time dateTime={comment.createdAt}>{formatPostDate(comment.createdAt, referenceTime)}</time>
                    </p>
                    <p className={`mt-1 mb-0 text-sm leading-6 whitespace-pre-line wrap-anywhere ${comment.text === null ? 'text-text-muted' : ''}`}>{comment.text ?? 'Комментарий скрыт модератором.'}</p>
                    {currentUserId !== undefined && comment.authorId === currentUserId && (
                      <button type="button" className="mt-1 min-h-8 border-0 bg-transparent p-0 text-xs font-bold text-text-muted underline" onClick={() => void remove(comment)}>Удалить</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {data.nextCursor !== null && <Button variant="secondary" className="self-start" disabled={loadingMore} onClick={() => void more()}>{loadingMore ? 'Загружаем…' : 'Показать ещё'}</Button>}
          </>
        )}
      {message && <p className="m-0 text-sm text-danger" role="alert">{message}</p>}
      {currentUserId === undefined ? (
        <p className="m-0 text-sm text-text-muted">Чтобы написать комментарий, <button type="button" className="border-0 bg-transparent p-0 text-focus underline" onClick={onRequireAuth}>войдите в аккаунт</button>.</p>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={(event) => void submit(event)}>
          <label htmlFor={inputId} className="text-sm font-bold">Ваш комментарий</label>
          <textarea id={inputId} rows={3} maxLength={5000} value={text} onChange={(event) => { setText(event.target.value); setMessage('') }} className="block w-full resize-y rounded-3xl border border-divider bg-surface p-4 text-sm leading-6 text-text outline-none" />
          <Button type="submit" size="md" className="self-start" disabled={busy}>{busy ? 'Отправляем…' : 'Отправить'}</Button>
        </form>
      )}
    </section>
  )
}
