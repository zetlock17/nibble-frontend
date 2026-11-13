// Only the API surface used by this feature. The SDK itself loads from Yandex.
export type MapLocation = { center?: [number, number]; zoom?: number; duration?: number }

export type MapInstance = {
  zoom: number
  setLocation: (location: MapLocation) => void
  addChild: (layer: object) => void
  destroy: () => void
}

type MapsApi = {
  ready: Promise<void>
  YMap: new (container: HTMLElement, props: { location: MapLocation; zoomRange: { min: number; max: number } }) => MapInstance
  YMapDefaultSchemeLayer: new () => object
  YMapDefaultFeaturesLayer: new () => object
}

declare global {
  interface Window {
    ymaps3?: MapsApi
  }
}

let apiPromise: Promise<MapsApi> | undefined

export function loadYandexMaps(apiKey: string): Promise<MapsApi> {
  if (apiPromise) return apiPromise

  apiPromise = new Promise<MapsApi>((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = window.setTimeout(fail, 20000)

    function fail() {
      window.clearTimeout(timeout)
      script.remove()
      reject(new Error('Yandex Maps failed to load'))
    }

    script.async = true
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`
    script.onerror = fail
    script.onload = async () => {
      try {
        const api = window.ymaps3
        if (!api) throw new Error('Yandex Maps API is unavailable')
        await api.ready
        window.clearTimeout(timeout)
        resolve(api)
      } catch {
        fail()
      }
    }
    document.head.append(script)
  }).catch((error: unknown) => {
    apiPromise = undefined
    throw error
  })

  return apiPromise
}
