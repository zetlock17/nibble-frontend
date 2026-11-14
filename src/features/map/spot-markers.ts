import type { Place } from './place.ts'
import type { MapInstance, MapsApi } from './yandex-maps.ts'

export function createSpotMarkers(map: MapInstance, api: MapsApi, places: readonly Place[], selectedId: string | undefined, onSelect: (place: Place) => void, icon: string) {
  const markers: object[] = []
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
      const marker = new api.YMapMarker({ coordinates: place.coordinates, zIndex: selected ? 300 : 200 }, button)
      map.addChild(marker)
      markers.push(marker)
    }
  } catch (error) {
    for (const marker of markers) map.removeChild(marker)
    throw error
  }
  return () => { for (const marker of markers) map.removeChild(marker) }
}
