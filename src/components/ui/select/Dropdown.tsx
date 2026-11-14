import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import checkIcon from '@/assets/icons/actions/check.svg'
import type { SelectOption } from './Select'

type Props = {
  label: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  children: ReactNode
  className: string
  disabled?: boolean
  wide?: boolean
}

export function Dropdown({ label, value, options, onChange, children, className, disabled, wide = false }: Props) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 })

  useEffect(() => {
    if (!open) return
    function place() {
      if (!trigger.current) return
      const rect = trigger.current.getBoundingClientRect()
      // Координаты привязаны к реальному положению кнопки: портал не обрезается прокруткой.
      // Ширина городского списка соответствует w-64 и ограничена шириной окна.
      const width = Math.min(wide ? 16 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize) : Math.max(rect.width, 192), window.innerWidth - 16)
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      const below = window.innerHeight - rect.bottom - 16
      const above = rect.top - 16
      const opensUp = below < 120 && above > below
      const maxHeight = Math.max(40, Math.min(240, opensUp ? above : below))
      const height = Math.min(maxHeight, panel.current?.scrollHeight ?? maxHeight)
      setPosition({ top: opensUp ? Math.max(8, rect.top - 8 - height) : rect.bottom + 8, left, width, maxHeight })
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !panel.current?.contains(event.target)) setOpen(false)
    }
    place()
    const initial = panel.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? panel.current?.querySelector<HTMLButtonElement>('[role="option"]')
    initial?.focus()
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [open, wide])

  function close() { setOpen(false); trigger.current?.focus() }
  function moveFocus(event: React.KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); close(); return }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])
    if (!buttons.length) return
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : event.key === 'ArrowDown' ? (index + 1) % buttons.length : (index <= 0 ? buttons.length - 1 : index - 1)
    buttons[next].focus()
  }

  return <>
    <button ref={trigger} type="button" className={className} disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => {
      if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) { event.preventDefault(); setOpen(true) }
    }}>{children}</button>
    {open && createPortal(<div ref={panel} id={id} role="listbox" aria-label={label} onKeyDown={moveFocus} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) setOpen(false) }}
      className="fixed z-50 flex flex-col gap-1 overflow-y-auto overscroll-contain rounded-2xl border border-navigation-divider bg-surface p-1.5 shadow-lg" style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}>
      {options.map((option) => <button key={option.value} role="option" aria-selected={option.value === value} type="button" onClick={() => { onChange(option.value); close() }}
        className={`flex min-h-10 w-full shrink-0 items-center justify-between gap-3 rounded-xl border-0 px-3 py-2 text-left text-sm text-text focus-visible:underline focus-visible:outline-none ${option.value === value ? 'bg-accent-soft font-semibold' : 'bg-surface hover:bg-navigation-hover'}`}>
        <span className="min-w-0 wrap-anywhere">{option.label}</span>{option.value === value && <img src={checkIcon} alt="" className="size-4 shrink-0 brightness-0" />}
      </button>)}
    </div>, document.body)}
  </>
}
