import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header/Header'
import type { SearchNavigation, SearchTarget } from '@/components/layout/header/search-api'
import type { Section } from '@/components/layout/sidebar/Sidebar'
import { loadCities } from '@/features/city/cities'
import type { City } from '@/features/city/cities'
import { HomePage } from '@/pages/home/HomePage'
import { AuthPage } from '@/pages/auth/AuthPage'
import type { AuthUser } from '@/pages/auth/AuthPage'

export default function App() {
  const [searchNavigation, setSearchNavigation] = useState<SearchNavigation | null>(null)
  const [section, setSection] = useState<Section>('home')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
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
    if (next === 'profile' && !user) { setAuthOpen(true); return }
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
    setSection('add-catch')
  }
  return (
    <>
    {authOpen && <AuthPage onBack={() => setAuthOpen(false)} onSignIn={(nextUser) => { setUser(nextUser); setAuthOpen(false); setSection('profile') }} />}
    <div hidden={authOpen} className="h-full">
    <div className="flex h-svh flex-col overflow-clip px-2 py-5 max-sm:py-3 2xl:px-9 2xl:py-6">
      <Header city={city} cities={cities} cityStatus={!citiesResult ? 'loading' : 'error' in citiesResult ? 'error' : cities.length ? 'ready' : 'empty'} onCityChange={(id) => { setCityId(id); setSearchNavigation(null) }} onRetryCities={() => { setCitiesResult(null); setCityAttempt((value) => value + 1) }} user={user} onSearchNavigate={openSearchResult} onProfileClick={() => changeSection('profile')} onAddCatch={openCatch} />
      <HomePage searchNavigation={searchNavigation} city={city} section={section} onSectionChange={changeSection} onAddCatch={openCatch} catchOrigin={catchOrigin} user={user} onSignOut={() => { setUser(null); setSection('home') }} />
    </div>
    </div>
    </>
  )
}
