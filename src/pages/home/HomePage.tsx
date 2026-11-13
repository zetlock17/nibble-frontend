import { Sidebar } from '@/components/layout/sidebar/Sidebar'
import type { Section } from '@/components/layout/sidebar/Sidebar'
import { Feed } from '@/features/feed/Feed'
import { PlacesMap } from '@/features/map/PlacesMap'
import { FishGuide } from '@/features/fish/FishGuide'
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
    <main id="main-content" className="flex flex-col items-start gap-6 pt-6 sm:flex-row sm:gap-8 sm:pt-10" aria-label={section === 'profile' ? 'Мой профиль' : section === 'fish' ? 'Справочник рыб' : section === 'places' ? 'Карта мест' : 'Главная'}>
      <Sidebar section={section} onSectionChange={onSectionChange} />
      <div className={`w-full min-w-0 max-sm:order-first ${section === 'fish' || section === 'profile' ? 'flex-1' : 'max-w-188'}`}>
        {section === 'profile' ? <ProfilePage profile={profileMock} state={{ status: 'ready', posts: profilePostsMock }} referenceTime={feedMockReferenceTime} photos={profilePhotosMock} /> : section === 'fish' ? <FishGuide fish={fishMock} /> : section === 'places' ? <PlacesMap /> : <Feed state={feedMock} referenceTime={feedMockReferenceTime} />}
      </div>
    </main>
  )
}
