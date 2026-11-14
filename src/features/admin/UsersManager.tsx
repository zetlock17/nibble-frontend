import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button/Button'
import { adminError, adminSend, usePages, useAdminData } from './admin-api'
import { fieldClass } from './ResourceManager'

type Role = 'user' | 'moderator' | 'admin'
type AdminUser = { id: number; email: string; display_name: string; city_id: number; role: Role; created_at: string }

const roles: Record<Role, string> = { user: 'Пользователь', moderator: 'Модератор', admin: 'Администратор' }

function CreateUser({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const id = useId()
  const cities = useAdminData<{ id: number; name: string }[]>('/cities')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password.length < 8) { setMessage('Пароль должен быть не короче 8 символов.'); return }
    setBusy(true)
    setMessage('')
    try {
      await adminSend('/admin/users', 'POST', {
        email: String(form.get('email')).trim(), password, display_name: String(form.get('name')).trim(),
        city_id: Number(form.get('city')), role: String(form.get('role')),
      })
      onDone()
    } catch (cause) { setMessage(adminError(cause)); setBusy(false) }
  }

  return (
    <form className="flex flex-col gap-4 rounded-4xl bg-surface p-4 sm:p-6" onSubmit={submit} aria-label="Новый пользователь">
      <h2 className="m-0 text-xl font-extrabold">Добавить пользователя</h2>
      <label className="flex flex-col gap-2 text-sm font-bold" htmlFor={`${id}-email`}>Почта *<input id={`${id}-email`} name="email" type="email" required className={fieldClass} autoComplete="off" /></label>
      <label className="flex flex-col gap-2 text-sm font-bold" htmlFor={`${id}-name`}>Имя *<input id={`${id}-name`} name="name" required maxLength={100} className={fieldClass} /></label>
      <label className="flex flex-col gap-2 text-sm font-bold" htmlFor={`${id}-password`}>Пароль *<input id={`${id}-password`} name="password" type="password" required minLength={8} className={fieldClass} autoComplete="new-password" /></label>
      <label className="flex flex-col gap-2 text-sm font-bold" htmlFor={`${id}-city`}>Город *
        <select id={`${id}-city`} name="city" required className={fieldClass} defaultValue="">
          <option value="">Выберите…</option>
          {cities.data?.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-bold" htmlFor={`${id}-role`}>Роль
        <select id={`${id}-role`} name="role" className={fieldClass} defaultValue="user">{Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </label>
      {cities.status === 'error' && <p className="m-0 text-sm text-danger" role="alert">Не удалось загрузить города. Закройте форму и откройте снова.</p>}
      {message && <p className="m-0 text-sm text-danger" role="alert">{message}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="md" disabled={busy}>{busy ? 'Сохраняем…' : 'Создать'}</Button>
        <Button variant="secondary" size="md" onClick={onCancel} disabled={busy}>Отмена</Button>
      </div>
    </form>
  )
}

export function UsersManager({ currentUserId }: { currentUserId: number }) {
  const [query, setQuery] = useState('')
  const [applied, setApplied] = useState('')
  const [role, setRole] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const params = new URLSearchParams({ limit: '30' })
  if (applied) params.set('q', applied)
  if (role) params.set('role', role)
  const users = usePages<AdminUser>(`/admin/users?${params}`)

  async function changeRole(user: AdminUser, next: string) {
    setMessage('')
    try {
      await adminSend(`/admin/users/${user.id}/role`, 'PATCH', { role: next })
      users.replace((items) => items.map((item) => item.id === user.id ? { ...item, role: next as Role } : item))
    } catch (cause) { setMessage(adminError(cause)) }
  }

  if (creating) return <CreateUser onCancel={() => setCreating(false)} onDone={() => { setCreating(false); users.reload() }} />

  return (
    <section className="flex flex-col gap-4" aria-label="Пользователи">
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex min-w-0 flex-1 gap-2" role="search" onSubmit={(event) => { event.preventDefault(); setApplied(query.trim()) }}>
          <input className={`${fieldClass} max-w-80`} type="search" aria-label="Поиск пользователей" placeholder="Имя или почта" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button type="submit" variant="secondary" size="md">Найти</Button>
        </form>
        <label className="flex items-center gap-2 text-sm font-bold">Роль
          <select className={`${fieldClass} w-auto`} value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">Все</option>
            {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <Button size="md" onClick={() => setCreating(true)}>Добавить пользователя</Button>
      </div>
      {message && <p className="m-0 text-sm text-danger" role="alert">{message}</p>}
      {users.status === 'loading' ? <p className="m-0 rounded-4xl bg-surface p-6 text-sm text-text-muted" role="status">Загружаем пользователей…</p>
        : users.status === 'error' ? (
          <div className="rounded-4xl bg-surface p-6" role="alert">
            <p className="m-0 text-sm text-text-muted">Не удалось загрузить пользователей. Проверьте соединение и повторите.</p>
            <Button className="mt-4" variant="secondary" onClick={users.reload}>Повторить</Button>
          </div>
        ) : !users.items.length ? <p className="m-0 rounded-4xl bg-surface p-6 text-sm text-text-muted" role="status">Пользователей не найдено.</p>
        : (
          <div className="overflow-x-auto rounded-4xl bg-surface p-2 sm:p-4">
            <table className="w-full min-w-120 border-collapse text-left text-sm">
              <thead><tr><th scope="col" className="px-3 py-2 text-xs font-bold text-text-muted">Имя</th><th scope="col" className="px-3 py-2 text-xs font-bold text-text-muted">Почта</th><th scope="col" className="px-3 py-2 text-xs font-bold text-text-muted">Роль</th></tr></thead>
              <tbody>
                {users.items.map((user) => (
                  <tr key={user.id} className="border-t border-navigation-divider">
                    <td className="px-3 py-3 wrap-anywhere">{user.display_name}</td>
                    <td className="px-3 py-3 wrap-anywhere">{user.email}</td>
                    <td className="px-3 py-2">
                      <select aria-label={`Роль: ${user.display_name}`} className={`${fieldClass} w-auto`} value={user.role} disabled={user.id === currentUserId} title={user.id === currentUserId ? 'Свою роль менять нельзя' : undefined} onChange={(event) => void changeRole(user, event.target.value)}>
                        {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {users.hasMore && <Button variant="secondary" className="self-center" disabled={users.loadingMore} onClick={users.loadMore}>{users.loadingMore ? 'Загружаем…' : 'Показать ещё'}</Button>}
    </section>
  )
}
