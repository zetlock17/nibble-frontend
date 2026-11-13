import homeIcon from '@/assets/icons/navigation/home.svg'
import userIcon from '@/assets/icons/navigation/user.svg'
import pinIcon from '@/assets/icons/map/pin.svg'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import rodIcon from '@/assets/icons/fishing/rod.svg'
import { NavigationButton } from '@/components/ui/button/NavigationButton'
import { WeatherCard } from '@/features/weather/WeatherCard'
import { weatherMock } from '@/mocks/weather/forecast'

const navigationItems = [
  { id: 'home', label: 'Главная', icon: homeIcon },
  { id: 'places', label: 'Карта мест', icon: pinIcon },
  { id: 'fish', label: 'Справочник рыб', icon: fishIcon },
  { id: 'profile', label: 'Профиль', icon: userIcon },
  { id: 'tackle', label: 'Снасти и удочки', icon: rodIcon },
]

export type Section = 'home' | 'places' | 'fish' | 'profile' | 'tackle'

type SidebarProps = {
  section: Section
  onSectionChange: (section: Section) => void
}

export function Sidebar({ section, onSectionChange }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5.5 sm:max-h-full sm:w-74 sm:overflow-y-auto sm:pt-10 sm:overscroll-none sm:[&>*]:shrink-0" aria-label="Погода и разделы">
      <WeatherCard state={weatherMock} />
      <nav className="rounded-4xl bg-surface p-4" aria-label="Основная навигация">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {navigationItems.map(({ id, label, icon }) => (
            <li key={id} className={id === 'tackle' ? 'before:mx-4 before:mb-2 before:block before:border-t before:border-navigation-divider/50' : undefined}>
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
