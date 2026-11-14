import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SpotMarker } from '@/features/map/SpotMarker'
import plusIcon from '@/assets/icons/actions/plus.svg'
import minusIcon from '@/assets/icons/actions/minus.svg'
import { Button } from '@/components/ui/button/Button'
import { IconButton } from '@/components/ui/button/IconButton'
import { createMap, flyTo, loadLeaflet, maxZoom, minZoom, toLatLng, type LeafletApi, type MapInstance } from '@/features/map/leaflet-map'
import type { Place } from '@/features/map/place'

export function CatchSpotMap({ places, selectedId, onSelect }: { places: readonly Place[]; selectedId: string; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapInstance | null>(null)
  const markersRef = useRef(new Map<string, ReturnType<LeafletApi['marker']>>())
  const [markerContainers, setMarkerContainers] = useState<{ place: Place; element: HTMLDivElement }[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let map: MapInstance | undefined
    const markers = markersRef.current
    loadLeaflet().then((api) => {
      if (cancelled || !containerRef.current) return
      map = createMap(api, containerRef.current, [131.88, 43.025], 11)
      mapRef.current = map
      const containers: { place: Place; element: HTMLDivElement }[] = []
      for (const place of places) {
        const coordinates = place.coordinates
        if (!coordinates) continue
        const element = document.createElement('div')
        // Нулевой размер иконки: SpotMarker привязывается к точке собственными классами translate.
        const marker = api.marker(toLatLng(coordinates), { icon: api.divIcon({ html: element, className: '', iconSize: [0, 0] }), keyboard: false }).addTo(map)
        markers.set(place.id, marker)
        containers.push({ place, element })
      }
      setMarkerContainers(containers)
      setStatus('ready')
    }).catch(() => {
      map?.remove()
      map = undefined
      if (!cancelled) {
        mapRef.current = null
        setStatus('error')
      }
    })
    return () => {
      cancelled = true
      markers.clear()
      map?.remove()
      mapRef.current = null
    }
  }, [places, attempt])

  useEffect(() => {
    for (const [id, marker] of markersRef.current) marker.setZIndexOffset(id === selectedId ? 1000 : 0)
    const coordinates = places.find((place) => place.id === selectedId)?.coordinates
    const map = mapRef.current
    if (status === 'ready' && map && coordinates) flyTo(map, coordinates, undefined, true)
  }, [places, selectedId, status, markerContainers])

  return (
    <div>
      <p className="mt-0 mb-3 text-sm leading-5 text-text-muted">Нажмите на отметку бухты. Произвольную точку поставить нельзя.</p>
      <div className="relative isolate h-80 overflow-hidden rounded-3xl bg-map-water">
        <div ref={containerRef} className="absolute inset-0" role="region" aria-label="Выбор места ловли на карте" aria-busy={status === 'loading'} />
        {status !== 'ready' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" role="status">
          <p className="m-0 max-w-72 text-sm leading-6 text-text-muted">{status === 'error' ? 'Не удалось загрузить карту. Повторите попытку или выберите место из списка.' : 'Загружаем карту…'}</p>
          {status === 'error' && <Button onClick={() => { setStatus('loading'); setAttempt((value) => value + 1) }}>Повторить</Button>}
        </div>}
        {status === 'ready' && <div className="absolute top-3 right-3 flex flex-col gap-2 rounded-pill bg-surface p-1">
          <IconButton icon={plusIcon} label="Приблизить карту" iconClassName="size-5 brightness-0" onClick={() => { const map = mapRef.current; if (map) map.setZoom(Math.min(maxZoom, map.getZoom() + 1)) }} />
          <IconButton icon={minusIcon} label="Отдалить карту" iconClassName="size-5 brightness-0" onClick={() => { const map = mapRef.current; if (map) map.setZoom(Math.max(minZoom, map.getZoom() - 1)) }} />
        </div>}
      </div>
      {status === 'ready' && markerContainers.map(({ place, element }) => createPortal(<SpotMarker name={place.name} selected={selectedId === place.id} onSelect={() => onSelect(place.id)} />, element, place.id))}
    </div>
  )
}
