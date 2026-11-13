import { useState } from 'react'
import { Header } from '@/components/layout/header/Header'
import type { Section } from '@/components/layout/sidebar/Sidebar'
import { headerMock } from '@/mocks/header/header'
import { HomePage } from '@/pages/home/HomePage'

export default function App() {
  const [section, setSection] = useState<Section>('home')
  return (
    <div className="flex h-svh flex-col overflow-clip px-2 py-5 max-sm:py-3 2xl:px-9 2xl:py-6">
      <Header city={headerMock.city} user={headerMock.user} onProfileClick={() => setSection('profile')} />
      <HomePage section={section} onSectionChange={setSection} />
    </div>
  )
}
