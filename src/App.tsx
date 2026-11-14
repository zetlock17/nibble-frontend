import { useState } from 'react'
import { Header } from '@/components/layout/header/Header'
import type { Section } from '@/components/layout/sidebar/Sidebar'
import { headerMock } from '@/mocks/header/header'
import { HomePage } from '@/pages/home/HomePage'
import { AuthPage } from '@/pages/auth/AuthPage'
import type { AuthUser } from '@/pages/auth/AuthPage'

export default function App() {
  const [section, setSection] = useState<Section>('home')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authOpen, setAuthOpen] = useState(false)

  function changeSection(next: Section) {
    if (next === 'profile' && !user) { setAuthOpen(true); return }
    setSection(next)
  }
  const [catchOrigin, setCatchOrigin] = useState<'home' | 'profile'>('home')
  function openCatch() {
    if (section !== 'add-catch') setCatchOrigin(section === 'profile' ? 'profile' : 'home')
    setSection('add-catch')
  }
  return (
    <>
    {authOpen && <AuthPage onBack={() => setAuthOpen(false)} onSignIn={(nextUser) => { setUser(nextUser); setAuthOpen(false); setSection('profile') }} />}
    <div hidden={authOpen} className="h-full">
    <div className="flex h-svh flex-col overflow-clip px-2 py-5 max-sm:py-3 2xl:px-9 2xl:py-6">
      <Header city={headerMock.city} user={user} onProfileClick={() => changeSection('profile')} onAddCatch={openCatch} />
      <HomePage section={section} onSectionChange={changeSection} onAddCatch={openCatch} catchOrigin={catchOrigin} user={user} onSignOut={() => { setUser(null); setSection('home') }} />
    </div>
    </div>
    </>
  )
}
