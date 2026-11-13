import { useId } from 'react'

type SegmentedControlProps<T extends string> = {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string>({ label, options, value, onChange, className = '' }: SegmentedControlProps<T>) {
  const name = useId()

  return (
    <fieldset className={`m-0 inline-flex min-w-0 gap-2 rounded-pill border-0 bg-filter-track p-1 ${className}`}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label className="relative flex min-w-0 cursor-pointer max-sm:flex-1" key={option.value}>
          <input
            className="peer sr-only"
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span className="flex min-h-9 w-full items-center justify-center rounded-pill px-3 text-sm leading-5 font-medium whitespace-nowrap text-text-muted peer-checked:bg-surface peer-checked:font-extrabold peer-checked:text-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus hover:text-text">
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
