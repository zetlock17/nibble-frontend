import type { MapInstance, MapsApi } from './yandex-maps.ts'

type Position = [number, number]
type DepthFeature = {
  type: 'Feature'
  properties: { depth_from: number; depth_to: number | null }
  geometry: { type: 'MultiPolygon'; coordinates: Position[][][] }
}

export type Depths = {
  type: 'FeatureCollection'
  attribution: string | null
  features: DepthFeature[]
}

export const depthPalette = [
  { from: 0, token: '--color-depth-0', className: 'bg-depth-0' },
  { from: 2, token: '--color-depth-2', className: 'bg-depth-2' },
  { from: 5, token: '--color-depth-5', className: 'bg-depth-5' },
  { from: 10, token: '--color-depth-10', className: 'bg-depth-10' },
  { from: 20, token: '--color-depth-20', className: 'bg-depth-20' },
  { from: 50, token: '--color-depth-50', className: 'bg-depth-50' },
] as const

export function depthColor(from: number) {
  return depthPalette.findLast((color) => from >= color.from) ?? depthPalette[0]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPosition(value: unknown): value is Position {
  return Array.isArray(value) && value.length === 2
    && typeof value[0] === 'number' && Number.isFinite(value[0]) && Math.abs(value[0]) <= 180
    && typeof value[1] === 'number' && Number.isFinite(value[1]) && Math.abs(value[1]) <= 90
}

function isRing(value: unknown): value is Position[] {
  if (!Array.isArray(value) || value.length < 4 || !value.every(isPosition)) return false
  const first = value[0]
  const last = value[value.length - 1]
  return first[0] === last[0] && first[1] === last[1]
}

function isPolygon(value: unknown): value is Position[][] {
  return Array.isArray(value) && value.length > 0 && value.every(isRing)
}

export function parseDepths(value: unknown): Depths {
  if (!isRecord(value) || value.type !== 'FeatureCollection' || !Array.isArray(value.features)
    || (value.attribution != null && typeof value.attribution !== 'string')) {
    throw new Error('Invalid depth collection')
  }

  const features = value.features.map((feature): DepthFeature => {
    if (!isRecord(feature) || feature.type !== 'Feature' || !isRecord(feature.properties)
      || !isRecord(feature.geometry)) throw new Error('Invalid depth feature')
    const { depth_from: from, depth_to: to } = feature.properties
    const { type, coordinates } = feature.geometry
    if (typeof from !== 'number' || !Number.isFinite(from) || from < 0
      || (to !== null && (typeof to !== 'number' || !Number.isFinite(to) || to <= from))
      || type !== 'MultiPolygon' || !Array.isArray(coordinates) || !coordinates.length
      || !coordinates.every(isPolygon)) throw new Error('Invalid depth geometry or range')
    return {
      type: 'Feature',
      properties: { depth_from: from, depth_to: to as number | null },
      geometry: { type: 'MultiPolygon', coordinates },
    }
  })

  return { type: 'FeatureCollection', attribution: typeof value.attribution === 'string' ? value.attribution.trim() || null : null, features }
}

// Only validated GeoJSON is shared across map mounts; SDK objects belong to one map.
const requests = new Map<string, Promise<Depths>>()

export function loadDepths(cityId: number, apiBase = '/api'): Promise<Depths> {
  if (!Number.isSafeInteger(cityId) || cityId <= 0) return Promise.reject(new Error('Invalid city ID'))
  const url = `${apiBase.replace(/\/+$/, '')}/depths?city_id=${cityId}`
  const cached = requests.get(url)
  if (cached) return cached
  const request = (async () => {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw new Error(`Depth request failed: ${response.status}`)
    return parseDepths(await response.json())
  })().catch((error: unknown) => {
    requests.delete(url)
    throw error
  })
  requests.set(url, request)
  return request
}

export function depthBands(data: Depths) {
  const bands = new Map<string, { from: number; to: number | null }>()
  for (const { properties } of data.features) {
    const { depth_from: from, depth_to: to } = properties
    bands.set(`${from}:${to}`, { from, to })
  }
  return [...bands.values()].sort((a, b) => a.from - b.from || (a.to ?? Infinity) - (b.to ?? Infinity))
}

export function createDepthLayer(map: MapInstance, api: MapsApi, data: Depths, colors: ReadonlyMap<string, string>) {
  const polygons = data.features.flatMap((feature) => feature.geometry.coordinates.map((rings) => ({ rings, from: feature.properties.depth_from })))
  const features: object[] = []
  const attached = new Set<object>()

  return {
    async show(signal: AbortSignal) {
      // Let loading feedback paint, then yield between batches of SDK objects.
      for (let index = 0; index < polygons.length; index++) {
        if (index % 24 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0))
        signal.throwIfAborted()
        const { rings, from } = polygons[index]
        const fill = colors.get(depthColor(from).token)
        if (!fill) throw new Error('Depth palette is unavailable')
        const feature = features[index] ??= new api.YMapFeature({
          geometry: { type: 'Polygon', coordinates: rings },
          style: { fill, fillOpacity: 0.55, stroke: [{ width: 0 }], zIndex: 100, interactive: false },
        })
        if (!attached.has(feature)) {
          map.addChild(feature)
          attached.add(feature)
        }
      }
    },
    hide() {
      for (const feature of attached) {
        map.removeChild(feature)
        attached.delete(feature)
      }
    },
  }
}
