import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar/Sidebar'
import { Feed } from '@/features/feed/Feed'
import { PlacesMap } from '@/features/map/PlacesMap'
import { feedMock, feedMockReferenceTime } from '@/mocks/feed/posts'

export function HomePage() {
  const [section, setSection] = useState<'home' | 'places'>('home')
  return (
    <main id="main-content" className="flex flex-col items-start gap-6 pt-6 sm:flex-row sm:gap-8 sm:pt-10" aria-label="Главная">
      <Sidebar onSectionChange={setSection} />
      <div className="w-full min-w-0 max-w-188 max-sm:order-first">
        {section === 'places' ? <PlacesMap /> : <Feed state={feedMock} referenceTime={feedMockReferenceTime} />}
      </div>
    </main>
  )
}
