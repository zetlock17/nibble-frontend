export type AuthUser = {
  id: number
  email: string
  name: string
  initials: string
  cityId: number
  role: 'user' | 'moderator' | 'admin'
  avatarUrl: string | null
  bio: string | null
}
export type Credentials = { email: string; password: string }
export type Registration = Credentials & { display_name: string; city_id: number }

export class AuthError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseAuthUser(value: unknown): AuthUser {
  if (!record(value) || !Number.isSafeInteger(value.id) || Number(value.id) <= 0
    || typeof value.email !== 'string' || !value.email.trim()
    || typeof value.display_name !== 'string' || !value.display_name.trim()
    || !Number.isSafeInteger(value.city_id) || Number(value.city_id) <= 0
    || !['user', 'moderator', 'admin'].includes(String(value.role))
    || (value.avatar_url !== null && typeof value.avatar_url !== 'string')
    || (value.bio !== null && typeof value.bio !== 'string')) throw new Error('Некорректный ответ сервера. Попробуйте ещё раз.')
  const name = value.display_name.trim()
  const avatar = value.avatar_url as string | null
  if (avatar && !/^https?:\/\//i.test(avatar) && !/^\/(?!\/)/.test(avatar)) throw new Error('Некорректный адрес аватара.')
  return {
    id: value.id as number, email: value.email, name,
    initials: name.split(/\s+/).slice(0, 2).map((part) => part[0].toLocaleUpperCase('ru')).join(''),
    cityId: value.city_id as number, role: value.role as AuthUser['role'],
    avatarUrl: avatar, bio: value.bio as string | null,
  }
}

export function createAuthClient(apiBase: string) {
  const base = apiBase.replace(/\/+$/, '')
  let token: string | null = null
  let expiresAt = 0
  let refreshing: Promise<void> | null = null

  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${base}${path}`, {
      ...init, credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(20000),
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    })
    if (!response.ok) {
      let detail: unknown
      try { const body: unknown = await response.json(); if (record(body)) detail = body.detail } catch { /* Ответ прокси может быть без JSON. */ }
      const message = response.status === 401 ? 'Неверная почта или пароль.'
        : response.status === 409 ? 'Эта почта уже зарегистрирована. Войдите в аккаунт.'
        : response.status === 403 ? 'Сервер отклонил запрос. Проверьте настройки доступа к API.'
        : response.status === 422 ? detail === 'City does not exist' ? 'Выберите город из списка.' : 'Проверьте поля формы. Пароль должен содержать не меньше 8 символов.'
        : 'Сервер недоступен. Попробуйте ещё раз.'
      throw new AuthError(response.status, message)
    }
    return response
  }

  async function acceptToken(response: Response) {
    const value: unknown = await response.json()
    if (!record(value) || typeof value.access_token !== 'string' || !value.access_token.trim()
      || value.token_type !== 'bearer' || typeof value.expires_in !== 'number'
      || !Number.isFinite(value.expires_in) || value.expires_in <= 0) throw new Error('Некорректный ответ авторизации.')
    token = value.access_token
    expiresAt = Date.now() + value.expires_in * 1000
  }

  function refresh() {
    if (!refreshing) {
      refreshing = request('/auth/refresh', { method: 'POST' }).then(acceptToken).catch((error: unknown) => {
        if (error instanceof AuthError && error.status === 401) { token = null; expiresAt = 0 }
        throw error
      }).finally(() => { refreshing = null })
    }
    return refreshing
  }

  async function authorizedRequest(path: string, init: RequestInit = {}) {
    if (!token || Date.now() >= expiresAt - 30000) await refresh()
    const usedToken = token
    try {
      return await request(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${usedToken}` } })
    } catch (error) {
      if (!(error instanceof AuthError) || error.status !== 401) throw error
      if (token === usedToken) await refresh()
      return request(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } })
    }
  }

  async function currentUser() {
    return parseAuthUser(await (await authorizedRequest('/auth/me')).json())
  }

  return {
    currentUser, authorizedRequest,
    async restore() {
      try { await refresh(); return await currentUser() }
      catch (error) { if (error instanceof AuthError && error.status === 401) return null; throw error }
    },
    async register(data: Registration) {
      return parseAuthUser(await (await request('/auth/register', { method: 'POST', body: JSON.stringify(data) })).json())
    },
    async login(data: Credentials) {
      await acceptToken(await request('/auth/login', { method: 'POST', body: JSON.stringify(data) }))
      return currentUser()
    },
    async logout() {
      if (refreshing) await refreshing.catch(() => {})
      await request('/auth/logout', { method: 'POST' })
      token = null
      expiresAt = 0
    },
    refreshDelay: () => Math.max(1000, expiresAt - Date.now() - 30000),
  }
}

export type AuthClient = ReturnType<typeof createAuthClient>
