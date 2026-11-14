import { useEffect, useRef } from 'react'
import { Sidebar } from '@/components/layout/sidebar/Sidebar'
import type { Section } from '@/components/layout/sidebar/Sidebar'
import { LiveFeed } from '@/features/feed/LiveFeed'
import { PlacesMap } from '@/features/map/PlacesMap'
import { FishGuide } from '@/features/fish/FishGuide'
import { TackleSection } from '@/features/tackle/TackleSection'
import { useFish } from '@/features/fish/use-fish'
import { feedMockReferenceTime } from '@/mocks/feed/posts'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { profileMock } from '@/mocks/profile/profile'
import type { AuthUser } from '@/pages/auth/AuthPage'
import { scrollPageFromWheel } from './wheel-scroll'
import { HomeResources } from './HomeResources'
import { AddCatchPage } from '@/pages/add-catch/AddCatchPage'
import type { City } from '@/features/city/cities'
import { ArticlePage } from '@/pages/article/ArticlePage'

type HomePageProps = {
  city: City | null
  section: Section
  onSectionChange: (section: Section) => void
  onAddCatch: () => void
  catchOrigin: 'home' | 'profile'
  user: AuthUser | null
  onSignOut: () => void
}

export function HomePage({ city, section, onSectionChange, onAddCatch, catchOrigin, user, onSignOut }: HomePageProps) {
  const fish = useFish()
  const isArticle = section === 'article-knots' || section === 'article-fish'
  const mainRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
    mainRef.current?.scrollTo({ top: 0 })
  }, [section])

  useEffect(() => {
    const main = mainRef.current
    const content = contentRef.current
    if (!main || !content) return

    function handleWheel(event: WheelEvent) {
      if (!window.matchMedia('(min-width: 640px)').matches || event.defaultPrevented) return
      if (!(event.target instanceof Element) || content!.contains(event.target)) return
      // На невысоком экране сохраняем собственную прокрутку навигации.
      const sidebar = event.target.closest('aside')
      if (sidebar && sidebar.scrollHeight > sidebar.clientHeight) return
      const area = content!.querySelector<HTMLElement>('[data-page-scroll]') ?? content!
      const styles = getComputedStyle(area)
      const lineHeight = Number.parseFloat(styles.lineHeight) || Number.parseFloat(styles.fontSize) * 1.2
      scrollPageFromWheel(event, area, lineHeight)
    }

    main.addEventListener('wheel', handleWheel, { passive: false })
    return () => main.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <main ref={mainRef} id="main-content" className="flex min-h-0 flex-1 flex-col items-start gap-6 overflow-y-auto overscroll-none pt-6 sm:flex-row sm:gap-8 sm:overflow-clip sm:pt-0" aria-label={isArticle ? 'Статья' : section === 'add-catch' ? 'Добавить улов' : section === 'tackle' ? 'Снасти и удочки' : section === 'profile' ? 'Мой профиль' : section === 'fish' ? 'Справочник рыб' : section === 'places' ? 'Карта мест' : 'Главная'}>
      <Sidebar city={city} section={section} onSectionChange={onSectionChange} />
      {/* Размер контейнера нужен галерее, чтобы ограничить высоту доступной областью контента. */}
      <div ref={contentRef} className={`w-full min-w-0 max-sm:order-first max-sm:shrink-0 sm:h-full sm:overscroll-none sm:[container-type:size] sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden ${isArticle || section === 'profile' || section === 'places' || section === 'add-catch' ? 'sm:overflow-y-auto' : 'sm:overflow-clip'} ${isArticle || section === 'fish' || section === 'profile' || section === 'tackle' || section === 'places' || section === 'add-catch' ? 'sm:flex-1' : 'max-w-188'}`}>
        {(isArticle || section === 'profile' || section === 'places' || section === 'add-catch') && <div aria-hidden="true" className="hidden h-10 sm:block" />}
        {/* Не размонтируем форму: черновик и фото живут до закрытия вкладки. */}
        <div hidden={section !== 'add-catch'}><AddCatchPage fish={fish} city={city} origin={catchOrigin} active={section === 'add-catch'} onBack={() => onSectionChange(catchOrigin)} /></div>
        {section === 'add-catch' ? null : isArticle ? <ArticlePage key={section} article={section} onBack={() => onSectionChange('home')} /> : section === 'tackle' ? <TackleSection /> : section === 'profile' ? <ProfilePage profile={{ ...profileMock, name: user?.name ?? 'Рыбак', initials: user?.initials ?? 'Р', city: user?.city ?? '', bio: '', followersCount: 0 }} state={{ status: 'ready', posts: [] }} referenceTime={feedMockReferenceTime} photos={[]} onAddCatch={onAddCatch} onSignOut={onSignOut} /> : section === 'fish' ? <FishGuide /> : section === 'places' ? city ? <PlacesMap key={city.id} cityId={city.id} cityName={city.name} center={city.coordinates} /> : <p role="status">Выберите город, чтобы посмотреть места.</p> : city ? <LiveFeed key={city.id} cityId={city.id} resources={<HomeResources fish={fish} onOpenGuide={() => onSectionChange('fish')} onOpenArticle={onSectionChange} />} /> : <p role="status">Выберите город, чтобы посмотреть ленту.</p>}
      </div>
      {section === 'home' && <div className="hidden min-w-64 flex-1 pt-10 2xl:block 2xl:h-full 2xl:min-h-0 2xl:overflow-hidden"><HomeResources fish={fish} onOpenGuide={() => onSectionChange('fish')} onOpenArticle={onSectionChange} /></div>}
    </main>
  )
}
