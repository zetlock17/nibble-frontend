import logo from '@/assets/brand/logo.svg'
import curveLine from '@/assets/icons/decorative/curve-line.svg'
import plusIcon from '@/assets/icons/actions/plus.svg'
import chevronDown from '@/assets/icons/navigation/chevron-down.svg'
import { Avatar } from '@/components/ui/avatar/Avatar'
import { Button } from '@/components/ui/button/Button'
import { SearchInput } from '@/components/ui/input/SearchInput'

type HeaderProps = {
  city: string
  user: { name: string; initials: string }
  onProfileClick: () => void
  onAddCatch: () => void
}

export function Header({ city, user, onProfileClick, onAddCatch }: HeaderProps) {
  return (
    <header className="relative z-50 flex min-h-16 shrink-0 items-center gap-5 rounded-pill border border-navigation-divider bg-surface px-6 py-3 max-lg:gap-4 max-md:flex-wrap max-md:gap-3 max-md:rounded-3xl max-md:p-4 max-sm:gap-2 max-sm:px-3 max-sm:py-3.5">
      <a className="inline-flex shrink-0 items-center gap-2 no-underline" href="/" aria-label="Клёв, главная">
        <img className="block size-4.6 shrink-0" src={logo} alt="" />
        <span className="text-2xl leading-none font-extrabold tracking-tighter max-sm:text-2xl">клёв</span>
      </a>

      <img className="block h-6 w-2 shrink-0 max-md:hidden" src={curveLine} alt="" />

      <button
        className="inline-flex min-h-9.5 shrink-0 items-center gap-1.5 border-0 bg-transparent p-0 text-base font-medium whitespace-nowrap max-md:text-sm"
        type="button"
        aria-label={`Город: ${city}`}
      >
        <span>{city}</span>
        <img className="block size-3 shrink-0" src={chevronDown} alt="" />
      </button>

      <SearchInput
        tone="header"
        className="max-w-126 grow shrink basis-55 max-md:order-1 max-md:h-10.5 max-md:max-w-none max-md:basis-full"
        label="Найти место или рыбу"
        placeholder="Найти место или рыбу"
        name="search"
      />

      <div className="ml-auto flex shrink-0 items-center gap-8 max-md:gap-3 max-sm:gap-2">
        <Button className="max-md:w-9.5 max-md:px-0" aria-label="Добавить улов" onClick={onAddCatch}>
          <img className="block size-5 shrink-0" src={plusIcon} alt="" />
          <span className="max-md:hidden">Добавить улов</span>
        </Button>

        <button
          className="inline-flex min-h-9.5 shrink-0 items-center gap-2.5 border-0 bg-transparent p-0 text-right"
          type="button"
          aria-label={`Мой профиль: ${user.name}`}
          onClick={onProfileClick}
        >
          <span className="flex flex-col gap-0.5 max-lg:hidden">
            <span className="text-sm leading-4.5 font-extrabold">{user.name}</span>
            <span className="text-xs leading-4 font-medium text-text-muted">Мой профиль</span>
          </span>
          <Avatar initials={user.initials} />
        </button>
      </div>
    </header>
  )
}
