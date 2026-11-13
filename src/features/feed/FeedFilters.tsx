import trashIcon from '@/assets/icons/actions/trash.svg'
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
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 bg-page py-2" role="group" aria-label="Фильтры ленты">
      <SegmentedControl
        className="max-sm:grow sm:min-w-64 sm:flex-1 sm:[&>label]:flex-1"
        label="Источник публикаций"
        options={sourceOptions}
        value={value.source}
        onChange={(source) => onChange({ ...value, source })}
      />
      <Select
        compact
        className="max-sm:order-2"
        label="Место ловли"
        icon={pinIcon}
        options={places}
        value={value.placeId}
        onChange={(placeId) => onChange({ ...value, placeId })}
      />
      <Select
        compact
        className="max-sm:order-2"
        label="Вид рыбы"
        icon={fishIcon}
        options={fish}
        value={value.fishId}
        onChange={(fishId) => onChange({ ...value, fishId })}
      />
      <button
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border-0 bg-surface hover:bg-accent-soft max-sm:order-1"
        type="button"
        aria-label="Сбросить фильтры"
        title="Сбросить фильтры"
        onClick={onReset}
      >
        <img className="size-4.5" src={trashIcon} alt="" />
      </button>
    </div>
  )
}
