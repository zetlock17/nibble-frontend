import { Sidebar } from '@/components/layout/sidebar/Sidebar'
import { Feed } from '@/features/feed/Feed'
import { feedMock, feedMockReferenceTime } from '@/mocks/feed/posts'

export function HomePage() {
  return (
    <main id="main-content" className="flex flex-col items-start gap-6 pt-6 sm:flex-row sm:gap-8 sm:pt-10" aria-label="Главная">
      <Sidebar />
      <div className="w-full min-w-0 max-w-188 max-sm:order-first">
        <Feed state={feedMock} referenceTime={feedMockReferenceTime} />
      </div>
    </main>
  )
}
