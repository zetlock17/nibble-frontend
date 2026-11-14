import { useEffect, useId, useRef, useState, type Ref } from 'react'
import { SearchInput } from '@/components/ui/input/SearchInput'
import { scheduleSearch, type SearchResult, type SearchTarget } from './search-api'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
type SearchOption = { key: string; name: string; description?: string; target: SearchTarget }

// collapsed скрывает поле только на телефоне, где поиск раскрывается кнопкой в шапке.
export function HeaderSearch({ cityId, collapsed = false, onNavigate }: { cityId: number | null; collapsed?: boolean; onNavigate: (target: SearchTarget) => void }) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; result: SearchResult } | null>(null)
  const q = query.trim()
  const key = JSON.stringify([q, cityId, attempt])
  const expanded = open && q.length >= 2 && Boolean(cityId)
  const current = result?.key === key ? result.result : null
  const options: SearchOption[] = current && 'data' in current ? [
    ...current.data.spots.map((place): SearchOption => ({ key: `spot-${place.id}`, name: place.name, description: place.area, target: { kind: 'spot', place } })),
    ...current.data.species.map((fish): SearchOption => ({ key: `species-${fish.id}`, name: fish.name, description: fish.description, target: { kind: 'species', id: fish.id } })),
  ] : []
  const active = expanded ? options[activeIndex] : undefined
  const wasCollapsed = useRef(collapsed)

  // Когда поиск раскрыт кнопкой в шапке, фокус переходит в поле.
  useEffect(() => {
    if (wasCollapsed.current && !collapsed) rootRef.current?.querySelector('input')?.focus()
    wasCollapsed.current = collapsed
  }, [collapsed])

  useEffect(() => {
    if (!expanded || !cityId) return
    return scheduleSearch(q, cityId, apiBase, (next) => setResult({ key, result: next }))
  }, [q, cityId, key, expanded])

  useEffect(() => {
    if (!expanded) return
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [expanded])

  useEffect(() => {
    if (active) listRef.current?.querySelector<HTMLElement>(`[id="${id}-${active.key}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, id])

  function choose(option: SearchOption) {
    setOpen(false)
    setQuery('')
    setActiveIndex(-1)
    onNavigate(option.target)
  }

  return <div ref={rootRef} className={`relative max-w-126 grow shrink basis-55 max-md:order-1 max-md:max-w-none max-md:basis-full ${collapsed ? 'max-sm:hidden' : ''}`} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.preventDefault(); rootRef.current?.querySelector('input')?.focus(); setOpen(false); setActiveIndex(-1); return }
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => options.length ? event.key === 'ArrowDown' ? (index + 1) % options.length : (index <= 0 ? options.length - 1 : index - 1) : -1)
    }
    if (event.key === 'Enter' && expanded && options.length) { event.preventDefault(); choose(active ?? options[0]) }
  }}>
    <SearchInput tone="header" className="w-full max-md:h-10.5" label="Найти место или рыбу" placeholder="Найти место или рыбу" name="search" value={query} maxLength={100} disabled={!cityId}
      role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? id : undefined} aria-activedescendant={active ? `${id}-${active.key}` : undefined}
      onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1) }} />
    {expanded && <div className="absolute top-full right-0 left-0 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-navigation-divider bg-surface p-2 shadow-lg max-sm:max-h-56">
      {!current ? <p role="status" className="m-0 p-3 text-sm text-text-muted">Ищем места и рыб…</p> : 'error' in current ? <div role="alert" className="p-3 text-sm text-text-muted">
        <p className="m-0">Не удалось выполнить поиск. Попробуйте ещё раз.</p>
        <button type="button" className="mt-2 min-h-10 rounded-sm text-focus underline focus-visible:outline-2 focus-visible:outline-focus" onClick={() => setAttempt((value) => value + 1)}>Повторить поиск</button>
      </div> : !options.length && <p role="status" className="m-0 p-3 text-sm text-text-muted">Ничего не найдено. Измените запрос.</p>}
      <HeaderSearchResults id={id} listRef={listRef} options={options} activeKey={active?.key} onChoose={choose} />
    </div>}
  </div>
}

export function HeaderSearchResults({ id, listRef, options, activeKey, onChoose }: {
  id: string; listRef?: Ref<HTMLDivElement>; options: readonly SearchOption[]; activeKey?: string; onChoose: (option: SearchOption) => void
}) {
  return <div ref={listRef} id={id} role="listbox" aria-label="Результаты поиска">
    {(['spot', 'species'] as const).map((kind) => {
      const group = options.filter((option) => option.target.kind === kind)
      return group.length > 0 && <div key={kind} role="group" aria-label={kind === 'spot' ? 'Места' : 'Рыбы'}>
        <p className="mx-3 mt-2 mb-1 text-xs font-bold text-text-muted" aria-hidden="true">{kind === 'spot' ? 'Места' : 'Рыбы'}</p>
        {group.map((option) => <button key={option.key} id={`${id}-${option.key}`} type="button" role="option" tabIndex={-1} aria-selected={option.key === activeKey}
          onMouseDown={(event) => event.preventDefault()} onClick={() => onChoose(option)}
          className={`flex min-h-11 w-full flex-col gap-1 rounded-xl px-3 py-2 text-left text-sm text-text focus-visible:outline-2 focus-visible:outline-focus ${option.key === activeKey ? 'bg-accent-soft' : 'hover:bg-navigation-hover'}`}>
          <span className="font-semibold">{option.name}</span>
          {option.description && option.description !== option.name && <span className="text-xs text-text-muted">{option.description}</span>}
        </button>)}
      </div>
    })}
  </div>
}
