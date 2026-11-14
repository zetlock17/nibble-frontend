import { FilterBar } from '@/components/ui/filter-bar/FilterBar'
import { useEffect, useRef, useState } from 'react'
import { SearchInput } from '@/components/ui/input/SearchInput'
import { Select } from '@/components/ui/select/Select'
import rodIcon from '@/assets/icons/fishing/rod.svg'
import wavesIcon from '@/assets/icons/map/waves.svg'
import calendarIcon from '@/assets/icons/decorative/calendar.svg'
import trashIcon from '@/assets/icons/actions/trash.svg'
import { IconButton } from '@/components/ui/button/IconButton'
import { FishCard } from './FishCard'
import { FishDetails } from './FishDetails'
import { type Season } from './fish'
import { useFish, useFishDetails, useFishingMethods } from './use-fish'
import { FishLoadingState } from './FishLoadingState'
import { Button } from '@/components/ui/button/Button'

const seasons: readonly { value: Exclude<Season, 'all'>; label: string }[] = [
  { value: 'spring', label: 'Весна' },
  { value: 'summer', label: 'Лето' },
  { value: 'autumn', label: 'Осень' },
  { value: 'winter', label: 'Зима' },
]

export function FishGuide() {
  const [query, setQuery] = useState('')
  const [season, setSeason] = useState<Season>('all')
  const catalogue = useFish(query, season)
  const methods = useFishingMethods()
  const fish = catalogue.fish
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    scrollRef.current?.closest('main')?.scrollTo({ top: 0 })
  }, [selectedId])
  const hasFilters = Boolean(query || season !== 'all')
  const resetFilters = () => {
    setQuery('')
    setSeason('all')
  }
  function closeDetails() {
    const id = selectedId
    setSelectedId(null)
    requestAnimationFrame(() => {
      Array.from(scrollRef.current?.querySelectorAll<HTMLButtonElement>('[data-fish-id]') ?? []).find((button) => button.dataset.fishId === id)?.focus()
    })
  }

  return (
    <section ref={scrollRef} data-page-scroll className="flex min-w-0 flex-col gap-4 sm:h-full sm:min-h-0 sm:overflow-y-auto sm:overscroll-none" aria-label="Справочник рыб">
      <div aria-hidden="true" className="hidden h-6 shrink-0 sm:block" />
      {selectedId ? <FishDetailsLoader key={selectedId} id={selectedId} onBack={closeDetails} /> : <>
      <h1 id="fish-guide-title" className="m-0 shrink-0 text-3xl leading-tight font-extrabold lg:text-4xl">Справочник рыб</h1>
      <FilterBar className="flex flex-col gap-3 pt-2">
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
          <Select label="Способ ловли" icon={rodIcon} options={methods.options} value="" onChange={() => {}} disabled />
          <Select label="Где обитает" icon={wavesIcon} options={[]} value="" onChange={() => {}} disabled />
          {hasFilters && <IconButton className="size-11 bg-surface hover:bg-accent-soft" icon={trashIcon} iconClassName="size-4.5" label="Сбросить фильтры" onClick={resetFilters} />}
        </div>
      </FilterBar>
      <div className="flex shrink-0 flex-col gap-5">
        <FishLoadingState status={catalogue.status} onRetry={catalogue.retry} />
        {catalogue.status !== 'ready' ? null : fish.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {fish.map((item) => <FishCard key={item.id} fish={item} onSelect={(value) => setSelectedId(value.id)} />)}
          </div>
        ) : (
          <div className="rounded-3xl bg-surface p-6" role="status">
            <p className="m-0 text-sm text-text-muted">{hasFilters ? 'Рыба не найдена. Измените запрос или сбросьте фильтры.' : 'В справочнике пока нет рыб. Загляните позже.'}</p>
          </div>
        )}
        <p className="m-0 text-xs leading-5 text-text-muted">Фильтры по способу ловли и месту обитания пока недоступны: в справочнике нет этих сведений.</p>
        {methods.status === 'error' && <div role="alert" className="text-sm text-text-muted"><p>Не удалось загрузить способы ловли.</p><Button variant="secondary" onClick={methods.retry}>Повторить загрузку способов ловли</Button></div>}
      </div>
      </>}
    </section>
  )
}

function FishDetailsLoader({ id, onBack }: { id: string; onBack: () => void }) {
  const { result, retry } = useFishDetails(id)
  if (result?.fish) return <FishDetails fish={result.fish} onBack={onBack} />
  return <div className="flex flex-col items-start gap-3">
    <Button variant="secondary" onClick={onBack}>Справочник рыб</Button>
    <FishLoadingState status={result?.error ? 'error' : 'loading'} onRetry={retry} />
  </div>
}
