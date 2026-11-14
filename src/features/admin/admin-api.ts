import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '@/features/auth/authed-fetch'

export type Option = { value: string; label: string }
export type Page<T> = { items: T[]; next_cursor: string | number | null }

export async function adminGet<T>(path: string, signal?: AbortSignal) {
  return await (await authFetch(path, { signal })).json() as T
}

export async function adminSend(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
  const response = await authFetch(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })
  return response.status === 204 ? null : await response.json() as unknown
}

// Удаляет загруженный, но не сохранённый файл. Сбой не мешает работе формы.
export async function deleteFile(key: string) {
  try { await authFetch(`/files/${encodeURIComponent(key)}`, { method: 'DELETE' }) } catch { /* Файл можно удалить позже. */ }
}

export function adminError(error: unknown) {
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status: unknown }).status) : 0
  if (status === 403) return 'Нет прав на это действие.'
  if (status === 404) return 'Запись не найдена. Обновите список.'
  if (status === 409) return 'Такая запись уже есть, или на неё ссылаются другие данные.'
  if (status === 422) return 'Сервер не принял данные. Проверьте поля.'
  return 'Не удалось выполнить запрос. Проверьте соединение и повторите.'
}

export function useAdminData<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ path: string; attempt: number; data?: T } | null>(null)
  const current = path !== null && result?.path === path && result.attempt === attempt ? result : null

  useEffect(() => {
    if (path === null) return
    const controller = new AbortController()
    adminGet<T>(path, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]))
      .then((data) => { if (!controller.signal.aborted) setResult({ path, attempt, data }) })
      .catch(() => { if (!controller.signal.aborted) setResult({ path, attempt }) })
    return () => controller.abort()
  }, [path, attempt])

  return {
    status: !current ? 'loading' as const : current.data === undefined ? 'error' as const : 'ready' as const,
    data: current?.data,
    reload: useCallback(() => setAttempt((value) => value + 1), []),
  }
}

// Список со страницами по курсору. Путь передаётся с параметрами фильтров, без cursor.
export function usePages<T>(path: string) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ key: string; items: T[]; cursor: string | number | null; error: boolean } | null>(null)
  const [loadingCursor, setLoadingCursor] = useState<string | number | null>(null)
  const key = `${path}|${attempt}`
  const current = state?.key === key ? state : null

  useEffect(() => {
    const controller = new AbortController()
    adminGet<Page<T>>(path, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]))
      .then((page) => { if (!controller.signal.aborted) setState({ key, items: page.items, cursor: page.next_cursor, error: false }) })
      .catch(() => { if (!controller.signal.aborted) setState({ key, items: [], cursor: null, error: true }) })
    return () => controller.abort()
  }, [path, key])

  useEffect(() => {
    if (loadingCursor === null) return
    const controller = new AbortController()
    adminGet<Page<T>>(`${path}${path.includes('?') ? '&' : '?'}cursor=${encodeURIComponent(String(loadingCursor))}`, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]))
      .then((page) => {
        if (controller.signal.aborted) return
        setState((value) => value && value.key === key ? { ...value, items: [...value.items, ...page.items], cursor: page.next_cursor } : value)
        setLoadingCursor(null)
      })
      .catch(() => { if (!controller.signal.aborted) { setState((value) => value ? { ...value, error: true } : value); setLoadingCursor(null) } })
    return () => controller.abort()
  }, [loadingCursor, path, key])

  return {
    status: !current ? 'loading' as const : current.error && !current.items.length ? 'error' as const : 'ready' as const,
    items: current?.items ?? [],
    moreError: Boolean(current?.error && current.items.length),
    hasMore: current?.cursor != null,
    loadingMore: loadingCursor !== null,
    loadMore() { if (current?.cursor != null) setLoadingCursor(current.cursor) },
    reload() { setState(null); setAttempt((value) => value + 1) },
    replace(update: (items: T[]) => T[]) { setState((value) => value ? { ...value, items: update(value.items) } : value) },
  }
}
