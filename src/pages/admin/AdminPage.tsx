import { useState } from 'react'
import logo from '@/assets/brand/logo.svg'
import { PostsModeration } from '@/features/admin/PostsModeration'
import { ResourceManager } from '@/features/admin/ResourceManager'
import { UsersManager } from '@/features/admin/UsersManager'
import { resources } from '@/features/admin/resources'

type AdminPageProps = { user: { id: number; name: string; role: 'user' | 'moderator' | 'admin' }; onBack: () => void }

const staticTabs = [{ id: 'posts', title: 'Публикации' }, { id: 'users', title: 'Пользователи' }]

export function AdminPage({ user, onBack }: AdminPageProps) {
  const isAdmin = user.role === 'admin'
  // Модератору доступны публикации и комментарии. Остальные разделы закрыты на сервере для не-админов.
  const tabs = isAdmin ? [...staticTabs, ...resources.map(({ id, title }) => ({ id, title }))] : staticTabs.slice(0, 1)
  const [tab, setTab] = useState('posts')
  const resource = resources.find((item) => item.id === tab)

  if (user.role === 'user') {
    return (
      <main className="flex h-svh flex-col items-center justify-center gap-4 bg-page p-6 text-center">
        <p className="m-0 text-base">Раздел доступен администраторам и модераторам.</p>
        <button type="button" onClick={onBack} className="rounded-pill border-0 bg-transparent p-2 font-bold text-focus">На главную</button>
      </main>
    )
  }

  return (
    <main className="h-svh overflow-y-auto bg-page px-4 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img className="size-5" src={logo} alt="" />
            <h1 className="m-0 text-2xl leading-none font-extrabold tracking-tight">Админка</h1>
            <span className="text-sm text-text-muted">{user.name}, {isAdmin ? 'администратор' : 'модератор'}</span>
          </div>
          <button type="button" onClick={onBack} className="rounded-pill border-0 bg-transparent px-3 py-2 text-sm font-bold text-focus">На главную</button>
        </header>
        <nav aria-label="Разделы админки" className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              className={`min-h-9.5 rounded-pill border border-navigation-divider px-4 text-sm font-bold ${tab === item.id ? 'bg-focus text-surface' : 'bg-surface text-text'}`}
            >{item.title}</button>
          ))}
        </nav>
        {tab === 'posts' ? <PostsModeration /> : tab === 'users' ? <UsersManager currentUserId={user.id} /> : resource ? <ResourceManager key={resource.id} resource={resource} /> : null}
      </div>
    </main>
  )
}
