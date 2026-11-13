import { useId, type InputHTMLAttributes } from 'react'
import searchIcon from '@/assets/icons/actions/search.svg'

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
}

export function SearchInput({
  label,
  id,
  className = '',
  ...props
}: SearchInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <search
      className={`flex h-9.5 items-center gap-2 rounded-pill border-0 bg-search px-3.5 text-icon-muted outline-none ${className}`}
      aria-label={label}
    >
      <img className="block size-4.5 shrink-0" src={searchIcon} alt="" />
      <label className="sr-only" htmlFor={inputId}>{label}</label>
      <input
        {...props}
        className="h-full w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-sm font-medium text-text caret-focus outline-none placeholder:text-text-muted placeholder:opacity-100"
        id={inputId}
        type="search"
      />
    </search>
  )
}
