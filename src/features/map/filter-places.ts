import type { Place } from './place'

export const placeAreas = [
  { value: 'Владивосток', label: 'Владивосток' },
  { value: 'Остров Русский', label: 'Остров Русский' },
  { value: 'Окрестности', label: 'Окрестности' },
]

export const fishingLocations = [
  { value: 'shore', label: 'С берега' },
  { value: 'boat', label: 'С лодки' },
]

export function filterPlaces(places: readonly Place[], area: string, fishingFrom: string) {
  return places.filter((place) => (
    (!area || place.area === area)
    && (!fishingFrom || place.fishingFrom?.some((value) => value === fishingFrom))
  ))
}
