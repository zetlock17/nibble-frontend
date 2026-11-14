import type { Place } from './place.ts'
import type { MapInstance, MapsApi } from './yandex-maps.ts'

export function createSpotMarkers(map: MapInstance, api: MapsApi, places: readonly Place[], selectedId: string | undefined) {
  const markers: object[] = []
  const containers: { place: Place; element: HTMLDivElement }[] = []
  try {
    for (const place of places) {
      if (!place.coordinates) continue
      const selected = place.id === selectedId
      const element = document.createElement('div')
      const marker = new api.YMapMarker({ coordinates: place.coordinates, zIndex: selected ? 300 : 200 }, element)
      map.addChild(marker)
      markers.push(marker)
      containers.push({ place, element })
    }
  } catch (error) {
    for (const marker of markers) map.removeChild(marker)
    throw error
  }
  return { containers, remove: () => { for (const marker of markers) map.removeChild(marker) } }
}
