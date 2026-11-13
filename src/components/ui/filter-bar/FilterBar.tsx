import { useEffect, useRef, useState, type HTMLAttributes } from 'react'
import { finishHiding, getScrollVisibility } from './scroll-visibility'
import type { ScrollVisibility } from './scroll-visibility'

export function FilterBar({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  const stateRef = useRef<ScrollVisibility>({ position: 0, offset: 0, upTravel: 0, animate: false })
  const [presentation, setPresentation] = useState({ offset: 0, animate: false })

  function reveal() {
    stateRef.current = { ...stateRef.current, offset: 0, upTravel: 0, animate: true }
    setPresentation({ offset: 0, animate: true })
  }

  useEffect(() => {
    const bar = ref.current
    if (!bar) return
    let scrollRoot: HTMLElement | null = null
    let settleTimer: number | undefined

    function finishDownwardScroll() {
      if (!scrollRoot) return
      const bounds = bar!.getBoundingClientRect()
      const edge = scrollRoot.getBoundingClientRect().top + scrollRoot.clientTop
      const inset = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
      const active = document.activeElement
      if (active && bar!.contains(active) && active.matches(':focus-visible')) return
      // Не трогаем панель в исходном потоке, пока она не дошла до хедера.
      if (bounds.top > edge + inset || bounds.bottom <= edge) return
      const next = finishHiding(stateRef.current, bounds.bottom - edge)
      stateRef.current = next
      setPresentation({ offset: next.offset, animate: next.animate })
    }

    function onScroll() {
      if (!scrollRoot) return
      window.clearTimeout(settleTimer)
      // Зазор соответствует стандартному top-4 и масштабируется с корневым шрифтом.
      const inset = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
      let current = stateRef.current
      // При смене направления продолжаем с текущего положения незавершённой анимации.
      if (current.animate && scrollRoot.scrollTop > current.position) {
        current = { ...current, offset: Math.max(0, inset - Number.parseFloat(getComputedStyle(bar!).top)) }
      }
      const next = getScrollVisibility(current, scrollRoot.scrollTop, bar!.offsetHeight + inset, scrollRoot.scrollHeight - scrollRoot.clientHeight)
      const active = document.activeElement
      if (active && bar!.contains(active) && active.matches(':focus-visible')) next.offset = 0
      stateRef.current = next
      setPresentation({ offset: next.offset, animate: next.animate })
      if (next.position > current.position) {
        settleTimer = window.setTimeout(finishDownwardScroll, 120)
      }
    }

    function connect() {
      window.clearTimeout(settleTimer)
      scrollRoot?.removeEventListener('scroll', onScroll)
      scrollRoot = bar!.parentElement
      while (scrollRoot && !/auto|scroll/.test(getComputedStyle(scrollRoot).overflowY)) {
        scrollRoot = scrollRoot.parentElement
      }
      stateRef.current = { position: scrollRoot?.scrollTop ?? 0, offset: 0, upTravel: 0, animate: false }
      setPresentation({ offset: 0, animate: false })
      scrollRoot?.addEventListener('scroll', onScroll, { passive: true })
    }

    connect()
    window.addEventListener('resize', connect)
    return () => {
      window.clearTimeout(settleTimer)
      scrollRoot?.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', connect)
    }
  }, [])

  return (
    // Пиксели нужны для точного сдвига по измеренной высоте панели и фактической прокрутке.
    <div ref={ref} {...props} onFocusCapture={reveal} style={{ ...props.style, top: `calc(var(--spacing) * 4 - ${presentation.offset}px)` }} className={`sticky z-10 shrink-0 bg-transparent motion-reduce:transition-none ${presentation.animate ? 'transition-[top] duration-500 ease-out' : ''} ${className}`}>
      {children}
    </div>
  )
}
