import { Sidebar } from '@/components/layout/sidebar/Sidebar'

export function HomePage() {
  return (
    <main id="main-content" className="flex pt-6 sm:pt-10" aria-label="Главная">
      <Sidebar />
    </main>
  )
}
