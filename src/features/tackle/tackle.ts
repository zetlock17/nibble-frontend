export type TackleListing = {
  id: string
  title: string
  images?: readonly string[]
  price?: number
  publishedOn?: string
  seller?: { name: string }
  sourceUrl?: string
}

export type TackleState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; listings: readonly TackleListing[]; updatedOn?: string }

export type TackleFilters = {
  query: string
  minPrice: string
  maxPrice: string
  sort: string
}

export const initialTackleFilters: TackleFilters = {
  query: '', minPrice: '', maxPrice: '', sort: '',
}

const normalize = (value: string) => value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim()

export function filterTackle(listings: readonly TackleListing[], filters: TackleFilters) {
  const query = normalize(filters.query)
  const min = filters.minPrice === '' ? undefined : Number(filters.minPrice)
  const max = filters.maxPrice === '' ? undefined : Number(filters.maxPrice)
  return listings.filter((item) => (
    (!query || normalize(`${item.title} ${item.seller?.name ?? ''}`).includes(query))
    && (min === undefined || (item.price !== undefined && item.price >= min))
    && (max === undefined || (item.price !== undefined && item.price <= max))
  )).sort((a, b) => {
    if (filters.sort === 'price-asc' || filters.sort === 'price-desc') {
      if (a.price === undefined) return b.price === undefined ? 0 : 1
      if (b.price === undefined) return -1
      return filters.sort === 'price-asc' ? a.price - b.price : b.price - a.price
    }
    return (b.publishedOn ?? '').localeCompare(a.publishedOn ?? '')
  })
}

// Разрешаем только конкретное объявление, а не поиск или главную страницу.
export function getFarpostListingUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && ['farpost.ru', 'www.farpost.ru'].includes(url.hostname)
      && !url.username && !url.password && !url.port
      && /^\/[a-z-]+\/sport\/fish\/[^/]+-\d+\.html$/.test(url.pathname)) return url.href
  } catch { /* У объявления без корректной ссылки переход недоступен. */ }
  return undefined
}

export function formatTackleDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return undefined
  return new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}
