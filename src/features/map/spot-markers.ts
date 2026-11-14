import type { Place } from './place.ts'
import type { LeafletApi, MapInstance } from './leaflet-map.ts'
import { toLatLng } from './leaflet-map.ts'

export function createSpotMarkers(map: MapInstance, api: LeafletApi, places: readonly Place[], selectedId: string | undefined, onSelect: (place: Place) => void, icon: string) {
  const markers: ReturnType<LeafletApi['marker']>[] = []
  try {
    for (const place of places) {
      if (!place.coordinates) continue
      const selected = place.id === selectedId
      const button = document.createElement('button')
      button.type = 'button'
      button.title = place.name
      button.setAttribute('aria-label', `Выбрать место: ${place.name}`)
      button.setAttribute('aria-pressed', String(selected))
      button.className = `flex size-11 -translate-x-1/2 -translate-y-full cursor-pointer items-center justify-center rounded-full border-2 border-surface shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${selected ? 'bg-focus' : 'bg-primary-strong hover:bg-primary-strong-hover'}`
      const image = document.createElement('img')
      image.src = icon
      image.alt = ''
      image.className = 'size-6 brightness-0 invert'
      button.append(image)
      button.addEventListener('click', () => onSelect(place))
      // Нулевой размер иконки: кнопка привязывается к точке собственными классами translate.
      const marker = api.marker(toLatLng(place.coordinates), {
        icon: api.divIcon({ html: button, className: '', iconSize: [0, 0] }),
        keyboard: false,
        zIndexOffset: selected ? 1000 : 0,
      })
      marker.addTo(map)
      markers.push(marker)
    }
  } catch (error) {
    for (const marker of markers) marker.remove()
    throw error
  }
  return () => { for (const marker of markers) marker.remove() }
}
