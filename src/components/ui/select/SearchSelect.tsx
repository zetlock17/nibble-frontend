import { useEffect, useId, useRef, useState } from 'react'
import chevronIcon from '@/assets/icons/navigation/chevron-down.svg'
import trashIcon from '@/assets/icons/actions/trash.svg'
import checkIcon from '@/assets/icons/actions/check.svg'
import { SearchInput } from '@/components/ui/input/SearchInput'

type Option = { value: string; label: string; description?: string }
type Props = {
  label: string
  placeholder: string
  icon: string
  options: readonly Option[]
  value: readonly string[]
  onChange: (value: string[]) => void
  multiple?: boolean
}

export function SearchSelect({ label, placeholder, icon, options, value, onChange, multiple = false }: Props) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = options.filter((option) => value.includes(option.value))
  const search = query.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е')
  const filtered = options.filter((option) => `${option.label} ${option.description ?? ''}`.toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(search))

  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector('input')?.focus()
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  return (
    <div ref={containerRef} className="relative min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); triggerRef.current?.focus() }
    }}>
      <button ref={triggerRef} type="button" aria-label={`${label}: ${selected.length ? selected.map((option) => option.label).join(', ') : 'не выбрано'}`} aria-expanded={open} aria-controls={`${id}-options`} onClick={() => { setOpen((current) => !current); setQuery('') }} className="flex min-h-12 w-full items-center gap-2 rounded-2xl border border-navigation-divider bg-surface px-4 text-left text-sm">
        <img src={icon} alt="" className="size-5 shrink-0" />
        <span className={`min-w-0 flex-1 truncate ${selected.length ? 'font-bold text-text' : 'text-text-muted'}`}>{selected.length ? multiple ? `Выбрано: ${selected.length}` : selected[0].label : placeholder}</span>
        <img src={chevronIcon} alt="" className={`size-3.5 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div ref={panelRef} id={`${id}-options`} className="absolute inset-x-0 top-full z-20 mt-2 rounded-2xl border border-navigation-divider bg-surface p-3" role="group" aria-label={label}>
        <SearchInput label={`Поиск: ${label.toLocaleLowerCase('ru')}`} placeholder="Начните вводить название" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault() }} />
        <div className="mt-2 max-h-60 overflow-y-auto overscroll-contain">
          {filtered.map((option) => <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm">
            <span className="relative inline-flex size-4 shrink-0">
            <input type={multiple ? 'checkbox' : 'radio'} name={`${id}-choice`} value={option.value} checked={value.includes(option.value)} className={`peer size-4 shrink-0 accent-focus ${multiple ? 'appearance-none rounded-md border border-text-muted bg-surface checked:border-focus checked:bg-focus forced-colors:appearance-auto' : ''}`} onChange={(event) => {
              onChange(multiple ? event.target.checked ? [...value, option.value] : value.filter((item) => item !== option.value) : [option.value])
              if (!multiple) { setOpen(false); triggerRef.current?.focus() }
            }} />
            {multiple && <img src={checkIcon} alt="" className="pointer-events-none absolute inset-0 size-4 opacity-0 peer-checked:opacity-100 forced-colors:hidden" />}
            </span>
            <span className="min-w-0 wrap-anywhere"><span className="block font-semibold">{option.label}</span>{option.description && <span className="block text-xs text-text-muted">{option.description}</span>}</span>
          </label>)}
          {!filtered.length && <p className="m-0 px-2 py-3 text-sm text-text-muted" role="status">{options.length ? 'Ничего не найдено. Попробуйте другое название.' : 'Список пока пуст. Можно продолжить без выбора.'}</p>}
        </div>
      </div>}
      {selected.length > 0 && <ul className="mt-3 mb-0 flex max-h-32 list-none flex-wrap gap-2 overflow-y-auto p-0" aria-label={multiple ? 'Выбранные виды рыб' : 'Выбранное место'}>
        {selected.map((option) => <li key={option.value} className="flex min-w-0 max-w-full items-center gap-2 rounded-pill bg-accent-soft pl-3 text-sm font-semibold text-focus">
          <span className="min-w-0 wrap-anywhere">{option.label}</span>
          <button type="button" aria-label={`Убрать: ${option.label}`} className="flex size-11 shrink-0 items-center justify-center rounded-pill" onClick={() => onChange(value.filter((item) => item !== option.value))}><img src={trashIcon} alt="" className="size-4" /></button>
        </li>)}
      </ul>}
    </div>
  )
}
