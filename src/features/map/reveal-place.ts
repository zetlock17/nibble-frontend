export function revealPlace(overview: HTMLElement | null, details: HTMLElement | null, reducedMotion: boolean) {
  details?.focus({ preventScroll: true })
  overview?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' })
}
