import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar/Sidebar'
import { Feed } from '@/features/feed/Feed'
import { PlacesMap } from '@/features/map/PlacesMap'
import { FishGuide } from '@/features/fish/FishGuide'
import { fishMock } from '@/mocks/fish/fish'
import { feedMock, feedMockReferenceTime } from '@/mocks/feed/posts'

export function HomePage() {
  const [section, setSection] = useState<'home' | 'places' | 'fish'>('home')
  return (
    <main id="main-content" className="flex flex-col items-start gap-6 pt-6 sm:flex-row sm:gap-8 sm:pt-10" aria-label={section === 'fish' ? 'Справочник рыб' : section === 'places' ? 'Карта мест' : 'Главная'}>
      <Sidebar onSectionChange={setSection} />
      <div className={`w-full min-w-0 max-sm:order-first ${section === 'fish' ? 'flex-1' : 'max-w-188'}`}>
        {section === 'fish' ? <FishGuide fish={fishMock} /> : section === 'places' ? <PlacesMap /> : <Feed state={feedMock} referenceTime={feedMockReferenceTime} />}
      </div>
    </main>
  )
}
