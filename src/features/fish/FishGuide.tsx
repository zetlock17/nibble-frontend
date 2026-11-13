import { useState } from 'react'
import { SearchInput } from '@/components/ui/input/SearchInput'
import { Select } from '@/components/ui/select/Select'
import rodIcon from '@/assets/icons/fishing/rod.svg'
import wavesIcon from '@/assets/icons/map/waves.svg'
import calendarIcon from '@/assets/icons/decorative/calendar.svg'
import trashIcon from '@/assets/icons/actions/trash.svg'
import { IconButton } from '@/components/ui/button/IconButton'
import { FishCard } from './FishCard'
import { filterFish, fishingMethods, fishHabitats, type Fish, type Season } from './fish'

const seasons: readonly { value: Exclude<Season, 'all'>; label: string }[] = [
  { value: 'spring', label: 'Весна' },
  { value: 'summer', label: 'Лето' },
  { value: 'autumn', label: 'Осень' },
  { value: 'winter', label: 'Зима' },
]

export function FishGuide({ fish }: { fish: readonly Fish[] }) {
  const [query, setQuery] = useState('')
  const [season, setSeason] = useState<Season>('all')
  const [method, setMethod] = useState('')
  const [habitat, setHabitat] = useState('')
  const filteredFish = filterFish(fish, query, season, method, habitat)
  const hasFilters = Boolean(query || season !== 'all' || method || habitat)
  const resetFilters = () => {
    setQuery('')
    setSeason('all')
    setMethod('')
    setHabitat('')
  }

  return (
    <section className="flex min-w-0 flex-col gap-4 sm:h-full sm:min-h-0 sm:overflow-y-auto sm:overscroll-none" aria-labelledby="fish-guide-title">
      <h1 id="fish-guide-title" className="m-0 shrink-0 text-3xl leading-tight font-extrabold lg:text-4xl">Справочник рыб</h1>
      <div className="sticky top-0 z-10 flex shrink-0 flex-col gap-3 bg-page pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            className="h-11 w-full xl:w-48 xl:flex-1"
            label="Найти рыбу"
            placeholder="Найти рыбу"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            label="Все сезоны"
            icon={calendarIcon}
            options={seasons}
            value={season === 'all' ? '' : season}
            onChange={(value) => setSeason(seasons.find((option) => option.value === value)?.value ?? 'all')}
          />
          <Select label="Способ ловли" icon={rodIcon} options={fishingMethods} value={method} onChange={setMethod} />
          <Select label="Где обитает" icon={wavesIcon} options={fishHabitats} value={habitat} onChange={setHabitat} />
          {hasFilters && <IconButton className="size-11 bg-surface hover:bg-accent-soft" icon={trashIcon} iconClassName="size-4.5" label="Сбросить фильтры" onClick={resetFilters} />}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-5">
        {filteredFish.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredFish.map((item) => <FishCard key={item.id} fish={item} />)}
          </div>
        ) : (
          <div className="rounded-3xl bg-surface p-6" role="status">
            <p className="m-0 text-sm text-text-muted">{fish.length ? 'Рыба не найдена. Измените запрос или сбросьте фильтры.' : 'В справочнике пока нет рыб. Загляните позже.'}</p>
          </div>
        )}
        <p className="m-0 text-xs leading-5 text-text-muted">Демонстрационные данные. Описания и периоды ловли взяты из макета, способы ловли и места обитания заданы для примера. Фотографии иллюстративные.</p>
      </div>
    </section>
  )
}
