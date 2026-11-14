// Тонкая прослойка для запросов с токеном. Вход, регистрация и выход подключаются отдельно:
// после входа нужно вызвать setAccessToken(token), после выхода setAccessToken(null).
const apiBase = import.meta.env?.VITE_API_BASE_URL?.trim() || '/api'
const url = (path: string) => `${apiBase.replace(/\/+$/, '')}${path}`

export class ApiError extends Error {
  status: number
  constructor(status: number) {
    super(`Request failed: ${status}`)
    this.status = status
  }
}

export const getInitials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toLocaleUpperCase('ru')).join('') || '?'

// Токен доступа живёт только в памяти. Обновляется по cookie refresh_token.
let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

function refresh() {
  refreshing ??= fetch(url('/auth/refresh'), { method: 'POST', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) })
    .then(async (response) => {
      const token = response.ok ? (await response.json() as { access_token?: unknown }).access_token : null
      accessToken = typeof token === 'string' && token ? token : null
      return accessToken !== null
    })
    .catch(() => false)
    .finally(() => { refreshing = null })
  return refreshing
}

// Запрос с токеном, если он есть. При 401 один раз обновляет токен и повторяет запрос.
export async function authFetch(path: string, init: RequestInit = {}) {
  const send = () => {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
    return fetch(url(path), { ...init, headers, signal: init.signal ?? AbortSignal.timeout(30000) })
  }
  let response = await send()
  if (response.status === 401 && await refresh()) response = await send()
  if (!response.ok) throw new ApiError(response.status)
  return response
}
