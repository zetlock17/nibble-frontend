export type Season = 'all' | 'spring' | 'summer' | 'autumn' | 'winter'

export type Fish = {
  id: string
  name: string
  description?: string
  image?: string
  period?: string
  seasons: Exclude<Season, 'all'>[]
}

export function filterFish(fish: readonly Fish[], query: string, season: Season) {
  const search = query.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е')
  return fish.filter((item) => (
    item.name.toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(search)
    && (season === 'all' || item.seasons.includes(season))
  ))
}
