import { Header } from '@/components/layout/header/Header'
import { headerMock } from '@/mocks/header'
import { HomePage } from '@/pages/home/HomePage'

export default function App() {
  return (
    <div className="min-h-svh px-2 py-5 max-sm:py-3 2xl:px-9 2xl:py-6">
      <Header city={headerMock.city} user={headerMock.user} />
      <HomePage />
    </div>
  )
}
