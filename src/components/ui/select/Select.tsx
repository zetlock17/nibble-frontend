import { useId } from 'react'
import chevronDown from '@/assets/icons/navigation/chevron-down.svg'

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
  const id = useId()

  return (
    <div className={`relative w-full min-w-0 shrink-0 ${compact ? 'sm:w-48' : 'sm:w-56'} ${className}`}>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <img className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" src={icon} alt="" />
      <select
        id={id}
        disabled={disabled}
        className="h-11 w-full cursor-pointer appearance-none truncate rounded-pill border border-navigation-divider bg-surface pr-8 pl-10 text-sm leading-5 font-bold text-text focus-visible:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{label}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <img className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2" src={chevronDown} alt="" />
    </div>
  )
}
