import { useState } from 'react'
import { SearchInput } from '@/components/ui/input/SearchInput'
import { SegmentedControl } from '@/components/ui/segmented-control/SegmentedControl'
import { Button } from '@/components/ui/button/Button'
import { FishCard } from './FishCard'
import { filterFish, type Fish, type Season } from './fish'

const seasons: readonly { value: Season; label: string }[] = [
  { value: 'all', label: 'Все сезоны' },
  { value: 'spring', label: 'Весна' },
  { value: 'summer', label: 'Лето' },
  { value: 'autumn', label: 'Осень' },
  { value: 'winter', label: 'Зима' },
]

export function FishGuide({ fish }: { fish: readonly Fish[] }) {
  const [query, setQuery] = useState('')
  const [season, setSeason] = useState<Season>('all')
  const filteredFish = filterFish(fish, query, season)

  return (
    <section className="flex min-w-0 flex-col gap-5 sm:h-full sm:min-h-0" aria-labelledby="fish-guide-title">
      <h1 id="fish-guide-title" className="m-0 shrink-0 text-3xl leading-tight font-extrabold lg:text-4xl">Справочник рыб</h1>
      <div className="flex shrink-0 flex-wrap items-center gap-3 bg-page py-2">
        <SearchInput
          className="h-11 w-full border border-navigation-divider bg-surface sm:w-60 lg:w-72"
          label="Найти рыбу"
          placeholder="Найти рыбу"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <SegmentedControl
          className="max-w-full flex-wrap gap-1 max-sm:grow max-sm:[&_span]:px-2 max-sm:[&_span]:text-xs"
          label="Сезон ловли"
          options={seasons}
          value={season}
          onChange={setSeason}
        />
      </div>
      <div className="flex flex-col gap-5 sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:overscroll-none sm:[&>*]:shrink-0">
      {filteredFish.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredFish.map((item) => <FishCard key={item.id} fish={item} />)}
        </div>
      ) : (
        <div className="rounded-3xl bg-surface p-6" role="status">
          <p className="m-0 text-sm text-text-muted">{fish.length ? 'Рыба не найдена. Измените название или выберите другой сезон.' : 'В справочнике пока нет рыб. Загляните позже.'}</p>
          {fish.length > 0 && <Button className="mt-4" variant="secondary" onClick={() => { setQuery(''); setSeason('all') }}>Сбросить фильтры</Button>}
        </div>
      )}
      <p className="m-0 text-xs leading-5 text-text-muted">Демонстрационные данные. Описания и периоды ловли взяты из макета, фотографии иллюстративные.</p>
      </div>
    </section>
  )
}
