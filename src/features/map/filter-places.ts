import type { Place } from './place'

export const fishingLocations = [
  { value: 'shore', label: 'С берега' },
  { value: 'boat', label: 'С лодки' },
]

export function filterPlaces(places: readonly Place[], fishingFrom: string) {
  return places.filter((place) => !fishingFrom || place.fishingFrom?.some((value) => value === fishingFrom))
}
