export type Season = 'all' | 'spring' | 'summer' | 'autumn' | 'winter'

export const fishHabitats = [
  { value: 'sea', label: 'Море' },
  { value: 'river', label: 'Реки' },
  { value: 'lake', label: 'Озёра' },
] as const

export type FishingMethod = string
export type FishHabitat = typeof fishHabitats[number]['value']

export type Fish = {
  id: string
  name: string
  description?: string
  image?: string
  period?: string
  catchMonths?: readonly number[]
  seasons: Exclude<Season, 'all'>[]
  methods?: readonly FishingMethod[]
  habitats?: readonly FishHabitat[]
  details?: {
    latinName?: string
    description?: string
    identification?: string
    typicalLengthCm?: number
    typicalWeightG?: number
    aliases?: readonly string[]
  }
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
