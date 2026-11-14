import homeIcon from '@/assets/icons/navigation/home.svg'
import userIcon from '@/assets/icons/navigation/user.svg'
import pinIcon from '@/assets/icons/map/pin.svg'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import rodIcon from '@/assets/icons/fishing/rod.svg'
import { NavigationButton } from '@/components/ui/button/NavigationButton'
import { WeatherWidget } from '@/features/weather/WeatherWidget'
import type { City } from '@/features/city/cities'

const navigationItems = [
  { id: 'home', label: 'Главная', icon: homeIcon },
  { id: 'places', label: 'Карта мест', icon: pinIcon },
  { id: 'fish', label: 'Справочник рыб', icon: fishIcon },
  { id: 'profile', label: 'Профиль', icon: userIcon },
  { id: 'tackle', label: 'Снасти и удочки', icon: rodIcon },
]

export type Section = 'home' | 'places' | 'fish' | 'profile' | 'tackle' | 'add-catch' | 'article-knots' | 'article-fish'

type SidebarProps = {
  city: City | null
  section: Section
  onSectionChange: (section: Section) => void
}

export function Sidebar({ city, section, onSectionChange }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5.5 max-sm:contents sm:max-h-full sm:w-74 sm:overflow-y-auto sm:pt-10 sm:overscroll-none sm:[&>*]:shrink-0" aria-label="Погода и разделы">
      {/* На телефоне погода нужна только на главной; виджет остаётся смонтированным, чтобы не грузить прогноз заново. */}
      {city && <div className={`max-sm:w-full ${section === 'home' ? '' : 'max-sm:hidden'}`}><WeatherWidget key={city.id} cityId={city.id} timeZone={city.timeZone} /></div>}
      <nav className="rounded-4xl bg-surface p-4 max-sm:fixed max-sm:inset-x-2 max-sm:bottom-3 max-sm:z-40 max-sm:rounded-pill max-sm:border max-sm:border-navigation-divider max-sm:p-2 max-sm:shadow-lg" aria-label="Основная навигация">
        <ul className="m-0 flex list-none flex-col gap-2 p-0 max-sm:flex-row max-sm:gap-1">
          {navigationItems.map(({ id, label, icon }) => (
            <li key={id} className={`max-sm:min-w-0 ${section === id ? 'max-sm:flex-2' : 'max-sm:flex-1'} ${id === 'profile' ? 'max-sm:order-1' : ''} ${id === 'tackle' ? 'before:mx-4 before:mb-2 before:block before:border-t before:border-navigation-divider/50 max-sm:before:hidden' : ''}`}>
              <NavigationButton
                icon={icon}
                iconClassName={id === 'profile' || id === 'tackle' ? 'size-5.5' : 'size-6'}
                selected={section === id}
                onClick={() => {
                  if (id === 'home' || id === 'places' || id === 'fish' || id === 'profile' || id === 'tackle') onSectionChange(id)
                }}
              >
                {label}
              </NavigationButton>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
