import { FilterBar } from '@/components/ui/filter-bar/FilterBar'
import { useState } from 'react'
import { SearchInput } from '@/components/ui/input/SearchInput'
import { Select } from '@/components/ui/select/Select'
import { Button } from '@/components/ui/button/Button'
import calendarIcon from '@/assets/icons/decorative/calendar.svg'
import { TackleCard } from './TackleCard'
import { filterTackle, formatTackleDate, initialTackleFilters, type TackleState } from './tackle'

const sorts = [{ value: 'price-asc', label: 'Сначала дешевле' }, { value: 'price-desc', label: 'Сначала дороже' }]

export function TackleCatalog({ state, onRetry }: { state: TackleState; onRetry: () => void }) {
  const [filters, setFilters] = useState(initialTackleFilters)
  const listings = state.status === 'ready' ? state.listings : []
  const filtered = filterTackle(listings, filters)
  const hasFilters = Boolean(filters.query || filters.minPrice || filters.maxPrice || filters.sort)
  const invalidRange = filters.minPrice !== '' && filters.maxPrice !== '' && Number(filters.minPrice) > Number(filters.maxPrice)
  const updated = state.status === 'ready' ? formatTackleDate(state.updatedOn) : undefined

  return (
    <section data-page-scroll className="flex min-w-0 flex-col gap-4 sm:h-full sm:min-h-0 sm:overflow-y-auto sm:overscroll-none" aria-labelledby="tackle-title">
      <div aria-hidden="true" className="hidden h-6 shrink-0 sm:block" />
      <h1 id="tackle-title" className="m-0 shrink-0 text-3xl leading-tight font-extrabold lg:text-4xl">Снасти и удочки</h1>
      <FilterBar className="flex flex-col gap-3 pt-2">
        <div className="flex flex-wrap items-end gap-3">
          <SearchInput className="h-11 w-full lg:w-60 lg:flex-1" label="Название снасти" placeholder="Название снасти" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
          <fieldset className="m-0 flex min-w-48 flex-1 gap-2 border-0 p-0 lg:max-w-64">
            <legend className="sr-only">Цена в рублях</legend>
            {(['minPrice', 'maxPrice'] as const).map((key) => (
              <label key={key} className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-pill border border-navigation-divider bg-surface px-3 text-sm text-text-muted">
                <span>{key === 'minPrice' ? 'От' : 'До'}</span>
                <input className="w-full min-w-0 border-0 bg-transparent text-sm text-text tabular-nums outline-none" aria-label={key === 'minPrice' ? 'Цена от, рублей' : 'Цена до, рублей'} type="number" min="0" step="1" placeholder="₽" value={filters[key]} aria-invalid={invalidRange || undefined} aria-describedby={invalidRange ? 'tackle-price-error' : undefined} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} />
              </label>
            ))}
          </fieldset>
          <Select label="По умолчанию" icon={calendarIcon} options={sorts} value={filters.sort} onChange={(sort) => setFilters({ ...filters, sort })} />
        </div>
        {invalidRange && <p id="tackle-price-error" className="m-0 text-sm text-text" role="alert">Цена «от» должна быть не больше цены «до».</p>}
        {hasFilters && <Button className="self-start" variant="secondary" onClick={() => setFilters(initialTackleFilters)}>Сбросить фильтры</Button>}
        {updated && <p className="m-0 text-xs text-text-muted">Данные обновлены: {updated}</p>}
      </FilterBar>
      <div className="flex shrink-0 flex-col gap-4" aria-busy={state.status === 'loading'}>
        {state.status === 'ready' ? filtered.length > 0 && !invalidRange ? (
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-5">
            {filtered.map((listing) => <TackleCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <p className="m-0 rounded-3xl bg-surface p-6 text-sm leading-6 text-text-muted" role="status">{listings.length ? 'Объявлений не найдено. Измените запрос или сбросьте фильтры.' : 'Объявлений пока нет. Загляните позже.'}</p>
        ) : <div className="flex flex-col items-start gap-3 rounded-3xl bg-surface p-6 text-sm leading-6 text-text-muted" role={state.status === 'error' ? 'alert' : 'status'}>
          <p className="m-0">{state.status === 'loading' ? 'Загружаем снасти…' : 'Не удалось загрузить объявления. Попробуйте ещё раз.'}</p>
          {state.status === 'error' && <Button variant="secondary" onClick={onRetry}>Повторить</Button>}
        </div>}
      </div>
    </section>
  )
}
