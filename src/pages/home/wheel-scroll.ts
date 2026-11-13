type PageWheel = Pick<WheelEvent, 'ctrlKey' | 'shiftKey' | 'deltaX' | 'deltaY' | 'deltaMode' | 'preventDefault'>
type ScrollArea = Pick<HTMLElement, 'clientHeight' | 'scrollHeight' | 'scrollBy'>

export function scrollPageFromWheel(event: PageWheel, area: ScrollArea, lineHeight: number) {
  if (event.ctrlKey || event.shiftKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
  if (area.scrollHeight <= area.clientHeight) return

  const unit = event.deltaMode === 1 ? lineHeight : event.deltaMode === 2 ? area.clientHeight : 1
  event.preventDefault()
  area.scrollBy({ top: event.deltaY * unit, behavior: 'instant' })
}
