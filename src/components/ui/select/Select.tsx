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
}

export function Select({ label, icon, options, value, onChange, className = '', disabled = false }: SelectProps) {
  const id = useId()

  return (
    <div className={`relative min-w-0 ${className}`}>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <img className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" src={icon} alt="" />
      <select
        id={id}
        disabled={disabled}
        className="h-11 w-full cursor-pointer appearance-none truncate rounded-pill border border-navigation-divider bg-surface pr-8 pl-9 text-sm leading-5 font-bold text-text"
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
