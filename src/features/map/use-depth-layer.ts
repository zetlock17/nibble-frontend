import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { MapInstance, MapsApi } from './yandex-maps'
import { createDepthLayer, depthPalette, loadDepths } from './depths'
import type { Depths } from './depths'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

type Result = { cityId: number; attempt: number } & (
  | { status: 'ready'; data: Depths }
  | { status: 'empty' | 'error' }
)

export function useDepthLayer(mapRef: RefObject<MapInstance | null>, apiRef: RefObject<MapsApi | null>, ready: boolean, cityId: number, attempt: number) {
  const [enabled, setEnabled] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [reload, setReload] = useState(0)
  const layerRef = useRef<{ map: MapInstance; cityId: number; layer: ReturnType<typeof createDepthLayer> } | null>(null)

  useEffect(() => {
    const map = mapRef.current
    const api = apiRef.current
    if (!enabled || !ready || !map || !api) return
    const controller = new AbortController()
    let activeLayer: ReturnType<typeof createDepthLayer> | undefined

    async function show(map: MapInstance, api: MapsApi) {
      try {
        await Promise.resolve()
        if (controller.signal.aborted) return
        setResult(null)
        const data = await loadDepths(cityId, apiBase)
        if (controller.signal.aborted) return
        if (!data.features.length) {
          setResult({ cityId, attempt, status: 'empty' })
          return
        }
        const cached = layerRef.current
        if (cached?.map === map && cached.cityId === cityId) {
          activeLayer = cached.layer
        } else {
          const style = getComputedStyle(document.documentElement)
          const colors = new Map(depthPalette.map(({ token }) => [token, style.getPropertyValue(token).trim()]))
          activeLayer = createDepthLayer(map, api, data, colors)
          layerRef.current = { map, cityId, layer: activeLayer }
        }
        await activeLayer.show(controller.signal)
        if (!controller.signal.aborted) setResult({ cityId, attempt, status: 'ready', data })
      } catch {
        if (controller.signal.aborted) return
        activeLayer?.hide()
        layerRef.current = null
        setResult({ cityId, attempt, status: 'error' })
      }
    }

    void show(map, api)
    return () => {
      controller.abort()
      activeLayer?.hide()
    }
  }, [enabled, ready, cityId, attempt, reload, mapRef, apiRef])

  const current = result?.cityId === cityId && result.attempt === attempt ? result : null
  return {
    enabled,
    status: enabled && ready ? current?.status ?? 'loading' : 'off',
    data: enabled && ready && current?.status === 'ready' ? current.data : null,
    toggle() {
      setResult(null)
      setEnabled((value) => !value)
    },
    retry() {
      setResult(null)
      setReload((value) => value + 1)
    },
  }
}
