import logo from '@/assets/brand/logo.svg'
import curveLine from '@/assets/icons/decorative/curve-line.svg'
import plusIcon from '@/assets/icons/actions/plus.svg'
import searchIcon from '@/assets/icons/actions/search.svg'
import loginIcon from '@/assets/icons/actions/login.svg'
import chevronDown from '@/assets/icons/navigation/chevron-down.svg'
import { Avatar } from '@/components/ui/avatar/Avatar'
import { Button } from '@/components/ui/button/Button'
import { HeaderSearch } from './HeaderSearch'
import type { SearchTarget } from './search-api'
import { Dropdown } from '@/components/ui/select/Dropdown'
import type { City } from '@/features/city/cities'

type HeaderProps = {
  city: City | null
  cities: City[]
  cityStatus: 'loading' | 'ready' | 'empty' | 'error'
  onCityChange: (id: number) => void
  onRetryCities: () => void
  user: { name: string; initials: string; avatarUrl?: string | null } | null
  onProfileClick: () => void
  onHomeClick: () => void
  onAdmin?: () => void
  onAddCatch: () => void
  onSearchNavigate: (target: SearchTarget) => void
  // На телефоне поиск свёрнут в кнопку. Состояние держит родитель: Header остаётся обычной функцией.
  mobileSearchOpen?: boolean
  onMobileSearchToggle?: () => void
}

export function Header({ city, cities, cityStatus, onCityChange, onRetryCities, user, onProfileClick, onHomeClick, onAdmin, onAddCatch, onSearchNavigate, mobileSearchOpen: searchOpen = false, onMobileSearchToggle }: HeaderProps) {
  return (
    <header className={`relative z-50 flex min-h-16 shrink-0 items-center gap-5 rounded-pill border border-navigation-divider bg-surface px-6 py-3 max-lg:gap-4 max-md:flex-wrap max-md:gap-3 max-md:rounded-3xl max-md:p-4 max-sm:gap-2 max-sm:px-4 max-sm:py-2.5 ${searchOpen ? '' : 'max-sm:rounded-pill'}`}>
      <button type="button" className="inline-flex shrink-0 items-center gap-2 border-0 bg-transparent p-0 text-text" onClick={onHomeClick} aria-label="Клёв, главная">
        <img className="block size-4.6 shrink-0" src={logo} alt="" />
        <span className="text-2xl leading-none font-extrabold tracking-tighter max-sm:text-3xl">клёв</span>
      </button>

      <img className="block h-6 w-2 shrink-0 max-md:hidden max-sm:block" src={curveLine} alt="" />

      {city ? <Dropdown wide label={`Город: ${city.name}`} value={String(city.id)} options={cities.map((item) => ({ value: String(item.id), label: item.name }))} onChange={(value) => onCityChange(Number(value))}
        className="inline-flex min-h-9.5 shrink-0 items-center gap-1.5 rounded-lg border-0 bg-transparent p-0 text-base font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-focus max-md:text-sm max-sm:text-base">
        <span>{city.name}</span><img className="block size-3 shrink-0" src={chevronDown} alt="" />
      </Dropdown> : <div className="text-sm" role="status">{cityStatus === 'loading' ? 'Загружаем города…' : cityStatus === 'empty' ? 'Список городов пуст.' : 'Не удалось загрузить города.'} {cityStatus !== 'loading' && <button type="button" className="rounded-sm border-0 bg-transparent p-0 text-focus underline focus-visible:outline-2 focus-visible:outline-focus" onClick={onRetryCities}>Повторить</button>}</div>}

      <HeaderSearch cityId={city?.id ?? null} collapsed={!searchOpen} onNavigate={onSearchNavigate} />

      <div className={`ml-auto flex shrink-0 items-center ${user ? 'gap-8 max-md:gap-3 max-sm:gap-2' : 'gap-3 max-sm:gap-2'}`}>
        <button type="button" className="hidden size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill border-0 bg-search max-sm:inline-flex" aria-label={searchOpen ? 'Скрыть поиск' : 'Найти место или рыбу'} aria-expanded={searchOpen} onClick={onMobileSearchToggle}>
          <img className="block size-5" src={searchIcon} alt="" />
        </button>

        <Button className="max-md:w-9.5 max-md:px-0 max-sm:size-11" aria-label="Добавить улов" onClick={onAddCatch}>
          <img className="block size-5 shrink-0" src={plusIcon} alt="" />
          <span className="max-md:hidden">Добавить улов</span>
        </Button>

        {onAdmin && <Button variant="secondary" className="max-sm:hidden" onClick={onAdmin}>Админка</Button>}

        {user ? <button
          className="inline-flex min-h-9.5 shrink-0 items-center gap-2.5 border-0 bg-transparent p-0 text-right max-sm:hidden"
          type="button"
          aria-label={`Мой профиль: ${user.name}`}
          onClick={onProfileClick}
        >
          <span className="flex flex-col gap-0.5 max-lg:hidden">
            <span className="text-sm leading-4.5 font-extrabold">{user.name}</span>
            <span className="text-xs leading-4 font-medium text-text-muted">Мой профиль</span>
          </span>
          <Avatar initials={user.initials} src={user.avatarUrl ?? undefined} />
        </button> : <Button variant="dark" className="max-sm:hidden" onClick={onProfileClick}>
          <img className="size-5 shrink-0 brightness-0 invert" src={loginIcon} alt="" />
          Войти
        </Button>}
      </div>
    </header>
  )
}
