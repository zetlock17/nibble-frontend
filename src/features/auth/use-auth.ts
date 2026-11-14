import { useEffect, useState } from 'react'
import { AuthError, createAuthClient } from './auth-api'
import type { AuthUser, Credentials } from './auth-api'

export function useAuth() {
  const [client] = useState(() => createAuthClient(import.meta.env.VITE_API_BASE_URL?.trim() || '/api'))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    client.restore().then((next) => {
      if (!cancelled) { setUser(next); setStatus('ready'); setError('') }
    }).catch(() => {
      if (!cancelled) { setStatus('error'); setError('Не удалось восстановить сессию. Проверьте подключение и повторите попытку.') }
    })
    return () => { cancelled = true }
  }, [client, attempt])

  useEffect(() => {
    if (!user || signingOut) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    async function renew() {
      try {
        const next = await client.currentUser()
        if (!cancelled) { setUser(next); setError(''); timer = setTimeout(renew, client.refreshDelay()) }
      } catch (cause) {
        if (cancelled) return
        if (cause instanceof AuthError && cause.status === 401) {
          setUser(null)
          setError('Сессия завершена. Войдите ещё раз.')
        } else {
          setError('Не удалось обновить сессию. Повторим попытку после восстановления подключения.')
          timer = setTimeout(renew, 30000)
        }
      }
    }
    timer = setTimeout(renew, client.refreshDelay())
    return () => { cancelled = true; clearTimeout(timer) }
  }, [client, user, signingOut])

  return {
    client, user, status, error, signingOut,
    retry() { setStatus('loading'); setAttempt((value) => value + 1) },
    async login(data: Credentials) {
      const next = await client.login(data)
      setUser(next); setStatus('ready'); setError('')
    },
    async logout() {
      if (signingOut) return false
      setSigningOut(true)
      try {
        await client.logout()
        setUser(null); setError(''); setStatus('ready')
        return true
      } catch {
        setError('Не удалось выйти из аккаунта. Проверьте подключение и повторите попытку.')
        return false
      } finally { setSigningOut(false) }
    },
  }
}
