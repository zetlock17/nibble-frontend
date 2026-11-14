import type * as Leaflet from 'leaflet'

export type LeafletApi = typeof Leaflet
export type MapInstance = Leaflet.Map
export type LngLat = [number, number]

export const minZoom = 2
export const maxZoom = 19
export const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const tileAttribution = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'

// API и данные хранят координаты как [долгота, широта], Leaflet ждёт [широта, долгота].
export function toLatLng([lng, lat]: LngLat): [number, number] {
  return [lat, lng]
}

let apiPromise: Promise<LeafletApi> | undefined

// Leaflet и его стили подгружаются при первом показе карты, а не с главной страницей.
export function loadLeaflet(): Promise<LeafletApi> {
  apiPromise ??= Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
    .then(([module]) => module.default ?? module)
    .catch((error: unknown) => {
      apiPromise = undefined
      throw error
    })
  return apiPromise
}

export function createMap(api: LeafletApi, container: HTMLElement, center: LngLat, zoom: number): MapInstance {
  const map = api.map(container, {
    center: toLatLng(center),
    zoom,
    minZoom,
    maxZoom,
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true,
  })
  api.tileLayer(tileUrl, { maxZoom, attribution: tileAttribution }).addTo(map)
  return map
}

export function flyTo(map: MapInstance, center: LngLat, zoom: number | undefined, animate: boolean) {
  const latLng = toLatLng(center)
  if (zoom === undefined) map.panTo(latLng, { animate })
  else map.setView(latLng, zoom, { animate })
}
