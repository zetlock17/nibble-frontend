import { useId, useState } from 'react'
import { FilterBar } from '@/components/ui/filter-bar/FilterBar'
import trashIcon from '@/assets/icons/actions/trash.svg'
import filtersIcon from '@/assets/icons/actions/filters.svg'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import pinIcon from '@/assets/icons/map/pin.svg'
import { SegmentedControl } from '@/components/ui/segmented-control/SegmentedControl'
import { Select } from '@/components/ui/select/Select'
import type { SelectOption } from '@/components/ui/select/Select'
import type { FeedFiltersValue } from './feed-model'

const sourceOptions = [
  { value: 'all', label: 'Все' },
  { value: 'community', label: 'Рыбаки' },
  { value: 'telegram', label: 'Telegram' },
] as const

type FeedFiltersProps = {
  value: FeedFiltersValue
  places: readonly SelectOption[]
  fish: readonly SelectOption[]
  onChange: (value: FeedFiltersValue) => void
  onReset: () => void
}

export function FeedFilters({ value, places, fish, onChange, onReset }: FeedFiltersProps) {
  const panelId = useId()
  // На телефоне места и рыбы убраны под кнопку: в одну строку с источником они не помещаются.
  const [open, setOpen] = useState(false)
  const active = Boolean(value.placeId || value.fishId)

  return (
    <FilterBar className="flex flex-wrap items-center gap-2 pb-2" role="group" aria-label="Фильтры ленты">
      <button
        className="relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill border border-navigation-divider bg-surface sm:hidden"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={active ? 'Фильтры по месту и рыбе, выбраны' : 'Фильтры по месту и рыбе'}
        onClick={() => setOpen(!open)}
      >
        <img className="size-6" src={filtersIcon} alt="" />
        {active && <span aria-hidden="true" className="absolute top-2 right-2 size-2.5 rounded-pill bg-primary-strong" />}
      </button>
      <SegmentedControl
        className="max-sm:min-w-0 max-sm:flex-1 max-sm:overflow-x-auto max-sm:[scrollbar-width:none] sm:min-w-64 sm:flex-1 sm:[&>label]:flex-1"
        label="Источник публикаций"
        options={sourceOptions}
        value={value.source}
        onChange={(source) => onChange({ ...value, source })}
      />
      <div id={panelId} className={`flex flex-wrap items-center gap-2 max-sm:w-full sm:contents ${open ? '' : 'max-sm:hidden'}`}>
        <Select
          compact
          label="Место ловли"
          icon={pinIcon}
          options={places}
          value={value.placeId}
          onChange={(placeId) => onChange({ ...value, placeId })}
        />
        <Select
          compact
          label="Вид рыбы"
          icon={fishIcon}
          options={fish}
          value={value.fishId}
          onChange={(fishId) => onChange({ ...value, fishId })}
        />
        <button
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-navigation-divider bg-surface hover:bg-accent-soft"
          type="button"
          aria-label="Сбросить фильтры"
          title="Сбросить фильтры"
          onClick={onReset}
        >
          <img className="size-4.5" src={trashIcon} alt="" />
        </button>
      </div>
    </FilterBar>
  )
}
