import type { AuthClient } from './auth-api.ts'

// Запросы с токеном для разделов, которым нужен вход (лайки, публикация, профиль).
// Без привязанной сессии идут анонимно: так лента читается и без входа.
const apiBase = import.meta.env?.VITE_API_BASE_URL?.trim() || '/api'
let client: AuthClient | null = null

export function bindSession(next: AuthClient | null) {
  client = next
}

export class ApiError extends Error {
  status: number
  constructor(status: number) {
    super(`Request failed: ${status}`)
    this.status = status
  }
}

export async function authFetch(path: string, init: RequestInit = {}) {
  if (client) return client.authorizedRequest(path, init)
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}${path}`, {
    ...init, headers: { Accept: 'application/json', ...init.headers }, signal: init.signal ?? AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new ApiError(response.status)
  return response
}
