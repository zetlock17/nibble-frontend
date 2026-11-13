import { Sidebar } from '@/components/layout/sidebar/Sidebar'
import type { Section } from '@/components/layout/sidebar/Sidebar'
import { Feed } from '@/features/feed/Feed'
import { PlacesMap } from '@/features/map/PlacesMap'
import { placesMock } from '@/mocks/map/places'
import { FishGuide } from '@/features/fish/FishGuide'
import { TackleCatalog } from '@/features/tackle/TackleCatalog'
import { tackleMock } from '@/mocks/tackle/listings'
import { fishMock } from '@/mocks/fish/fish'
import { feedMock, feedMockReferenceTime } from '@/mocks/feed/posts'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { profileMock, profilePostsMock } from '@/mocks/profile/profile'
import { profilePhotosMock } from '@/mocks/profile/photos'

type HomePageProps = {
  section: Section
  onSectionChange: (section: Section) => void
}

export function HomePage({ section, onSectionChange }: HomePageProps) {
  return (
    <main id="main-content" className="flex min-h-0 flex-1 flex-col items-start gap-6 overflow-y-auto overscroll-none pt-6 sm:flex-row sm:gap-8 sm:overflow-clip sm:pt-10" aria-label={section === 'tackle' ? 'Снасти и удочки' : section === 'profile' ? 'Мой профиль' : section === 'fish' ? 'Справочник рыб' : section === 'places' ? 'Карта мест' : 'Главная'}>
      <Sidebar section={section} onSectionChange={onSectionChange} />
      {/* Размер контейнера нужен галерее, чтобы ограничить высоту доступной областью контента. */}
      <div className={`w-full min-w-0 max-sm:order-first max-sm:shrink-0 sm:h-full sm:overscroll-none sm:[container-type:size] sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden ${section === 'profile' || section === 'places' ? 'sm:overflow-y-auto' : 'sm:overflow-clip'} ${section === 'fish' || section === 'profile' || section === 'tackle' || section === 'places' ? 'sm:flex-1' : 'max-w-188'}`}>
        {section === 'tackle' ? <TackleCatalog state={tackleMock} /> : section === 'profile' ? <ProfilePage profile={profileMock} state={{ status: 'ready', posts: profilePostsMock }} referenceTime={feedMockReferenceTime} photos={profilePhotosMock} /> : section === 'fish' ? <FishGuide fish={fishMock} /> : section === 'places' ? <PlacesMap places={placesMock} fish={fishMock} /> : <Feed state={feedMock} referenceTime={feedMockReferenceTime} />}
      </div>
    </main>
  )
}
