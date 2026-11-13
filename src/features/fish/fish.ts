export type Season = 'all' | 'spring' | 'summer' | 'autumn' | 'winter'

export const fishingMethods = [
  { value: 'spinning', label: 'Спиннинг' },
  { value: 'bottom', label: 'Донная снасть' },
  { value: 'float', label: 'Поплавочная удочка' },
  { value: 'ice', label: 'Зимняя ловля' },
] as const

export const fishHabitats = [
  { value: 'sea', label: 'Море' },
  { value: 'river', label: 'Реки' },
  { value: 'lake', label: 'Озёра' },
] as const

export type FishingMethod = typeof fishingMethods[number]['value']
export type FishHabitat = typeof fishHabitats[number]['value']

export type Fish = {
  id: string
  name: string
  description?: string
  image?: string
  period?: string
  seasons: Exclude<Season, 'all'>[]
  methods?: readonly FishingMethod[]
  habitats?: readonly FishHabitat[]
}

export function filterFish(fish: readonly Fish[], query: string, season: Season, method = '', habitat = '') {
  const search = query.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е')
  return fish.filter((item) => (
    item.name.toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(search)
    && (season === 'all' || item.seasons.includes(season))
    && (!method || item.methods?.some((value) => value === method))
    && (!habitat || item.habitats?.some((value) => value === habitat))
  ))
}
