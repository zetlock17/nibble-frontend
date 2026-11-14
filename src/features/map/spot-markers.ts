import type { Place } from './place.ts'
import type { LeafletApi, MapInstance } from './leaflet-map.ts'
import { toLatLng } from './leaflet-map.ts'

export function createSpotMarkers(map: MapInstance, api: LeafletApi, places: readonly Place[], selectedId: string | undefined) {
  const markers: ReturnType<LeafletApi['marker']>[] = []
  const containers: { place: Place; element: HTMLDivElement }[] = []
  try {
    for (const place of places) {
      if (!place.coordinates) continue
      const element = document.createElement('div')
      // SpotMarker positions itself around the zero-sized Leaflet anchor.
      const marker = api.marker(toLatLng(place.coordinates), {
        icon: api.divIcon({ html: element, className: '', iconSize: [0, 0] }),
        keyboard: false,
        zIndexOffset: place.id === selectedId ? 1000 : 0,
      }).addTo(map)
      markers.push(marker)
      containers.push({ place, element })
    }
  } catch (error) {
    for (const marker of markers) marker.remove()
    throw error
  }
  return { containers, remove: () => { for (const marker of markers) marker.remove() } }
}
