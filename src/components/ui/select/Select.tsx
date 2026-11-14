import chevronDown from '@/assets/icons/navigation/chevron-down.svg'
import { Dropdown } from './Dropdown'

export type SelectOption = { value: string; label: string }

type SelectProps = {
  label: string
  icon: string
  options: readonly SelectOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  compact?: boolean
}

export function Select({ label, icon, options, value, onChange, className = '', disabled = false, compact = false }: SelectProps) {
  const selected = options.find((option) => option.value === value)?.label ?? label
  return <div className={`w-full min-w-0 shrink-0 ${compact ? 'sm:w-48' : 'sm:w-56'} ${className}`}>
    <Dropdown label={`${label}: ${selected}`} value={value} options={[{ value: '', label }, ...options]} onChange={onChange} disabled={disabled}
      className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-pill border border-navigation-divider bg-surface px-3 text-left text-sm leading-5 font-bold text-text disabled:cursor-default disabled:opacity-60">
      <img className="size-4 shrink-0" src={icon} alt="" />
      <span className="min-w-0 flex-1 truncate">{selected}</span>
      <img className="size-3.5 shrink-0" src={chevronDown} alt="" />
    </Dropdown>
  </div>
}
