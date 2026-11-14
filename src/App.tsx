import { useEffect, useLayoutEffect, useState } from 'react'
import { Header } from '@/components/layout/header/Header'
import type { SearchNavigation, SearchTarget } from '@/components/layout/header/search-api'
import type { Section } from '@/components/layout/sidebar/Sidebar'
import { loadCities } from '@/features/city/cities'
import type { City } from '@/features/city/cities'
import { HomePage } from '@/pages/home/HomePage'
import { AuthPage } from '@/pages/auth/AuthPage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { useAuth } from '@/features/auth/use-auth'
import { bindSession } from '@/features/auth/authed-fetch'

export default function App() {
  const [searchNavigation, setSearchNavigation] = useState<SearchNavigation | null>(null)
  const [section, setSection] = useState<Section>('home')
  const auth = useAuth()
  const user = auth.user
  // Layout-эффект срабатывает раньше загрузок в дочерних компонентах, поэтому запросы уходят уже с токеном.
  useLayoutEffect(() => {
    bindSession(user ? auth.client : null)
    return () => bindSession(null)
  }, [user, auth.client])
  const [authTarget, setAuthTarget] = useState<Section>('profile')
  const [authOpen, setAuthOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [citiesResult, setCitiesResult] = useState<{ cities: City[] } | { error: true } | null>(null)
  const [cityId, setCityId] = useState<number | null>(null)
  const [cityAttempt, setCityAttempt] = useState(0)
  const cities = citiesResult && 'cities' in citiesResult ? citiesResult.cities : []
  const city = cities.find((item) => item.id === cityId) ?? cities.find((item) => item.id === 1) ?? cities[0] ?? null

  useEffect(() => {
    const controller = new AbortController()
    const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
    loadCities(apiBase, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])).then((data) => {
      if (!controller.signal.aborted) setCitiesResult({ cities: data })
    }).catch(() => {
      if (!controller.signal.aborted) setCitiesResult({ error: true })
    })
    return () => controller.abort()
  }, [cityAttempt])

  function changeSection(next: Section) {
    if ((next === 'profile' || next === 'add-catch') && !user) { setAuthTarget(next); setAuthOpen(true); return }
    setSearchNavigation(null)
    setSection(next)
  }
  const [catchOrigin, setCatchOrigin] = useState<'home' | 'profile'>('home')
  function openSearchResult(target: SearchTarget) {
    setSearchNavigation((current) => ({ target, revision: (current?.revision ?? 0) + 1 }))
    setSection(target.kind === 'spot' ? 'places' : 'fish')
  }
  function openCatch() {
    setSearchNavigation(null)
    if (section !== 'add-catch') setCatchOrigin(section === 'profile' ? 'profile' : 'home')
    if (!user) { setAuthTarget('add-catch'); setAuthOpen(true); return }
    setSection('add-catch')
  }
  const cityStatus = !citiesResult ? 'loading' : 'error' in citiesResult ? 'error' : cities.length ? 'ready' : 'empty'
  const retryCities = () => { setCitiesResult(null); setCityAttempt((value) => value + 1) }
  const visibleSection = !user && (section === 'profile' || section === 'add-catch') ? 'home' : section
  const displayUser = user ? { ...user, city: cities.find((item) => item.id === user.cityId)?.name ?? '' } : null

  if (auth.status === 'loading') return <main id="main-content" className="flex min-h-svh items-center justify-center bg-page p-6"><p role="status">Восстанавливаем сессию…</p></main>

  return (
    <>
    {authOpen && <AuthPage client={auth.client} cities={cities} cityStatus={cityStatus} onRetryCities={retryCities} onBack={() => setAuthOpen(false)} onSignIn={async (credentials) => { await auth.login(credentials); setAuthOpen(false); setSection(authTarget) }} />}
    {adminOpen && user && <AdminPage user={user} onBack={() => setAdminOpen(false)} />}
    <div hidden={authOpen || (adminOpen && Boolean(user))} className="h-full">
    <div className="flex h-svh flex-col overflow-clip px-2 py-5 max-sm:py-3 2xl:px-9 2xl:py-6">
      <Header city={city} cities={cities} cityStatus={cityStatus} onCityChange={(id) => { setCityId(id); setSearchNavigation(null) }} onRetryCities={retryCities} user={displayUser} onSearchNavigate={openSearchResult} onHomeClick={() => changeSection('home')} onProfileClick={() => changeSection('profile')} onAdmin={user && user.role !== 'user' ? () => setAdminOpen(true) : undefined} onAddCatch={openCatch} />
      {auth.error && <div role="alert" className="mt-3 flex shrink-0 flex-wrap items-center gap-3 rounded-2xl bg-surface p-4 text-sm text-danger">{auth.error}{auth.status === 'error' && <button type="button" onClick={auth.retry} className="bg-transparent p-0 text-focus underline">Повторить</button>}</div>}
      <HomePage searchNavigation={searchNavigation} city={city} section={visibleSection} onSectionChange={changeSection} onAddCatch={openCatch} catchOrigin={catchOrigin} user={displayUser} signingOut={auth.signingOut} onRequireAuth={() => { setAuthTarget(section); setAuthOpen(true) }} onSignOut={() => { void auth.logout().then((done) => { if (done) { setSection('home'); setAdminOpen(false) } }) }} />
    </div>
    </div>
    </>
  )
}
