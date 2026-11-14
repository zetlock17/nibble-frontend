import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SpotMarker } from '@/features/map/SpotMarker'
import plusIcon from '@/assets/icons/actions/plus.svg'
import minusIcon from '@/assets/icons/actions/minus.svg'
import { Button } from '@/components/ui/button/Button'
import { IconButton } from '@/components/ui/button/IconButton'
import { loadYandexMaps, type MapInstance } from '@/features/map/yandex-maps'
import type { Place } from '@/features/map/place'
import { spotCoordinates } from '@/mocks/catch/spot-coordinates'

const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim()

export function CatchSpotMap({ places, selectedId, onSelect }: { places: readonly Place[]; selectedId: string; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapInstance | null>(null)
  const markersRef = useRef(new Map<string, { update: (props: { zIndex: number }) => void }>())
  const [markerContainers, setMarkerContainers] = useState<{ place: Place; element: HTMLDivElement }[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing-key'>(apiKey ? 'loading' : 'missing-key')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!apiKey) return
    let cancelled = false
    let map: MapInstance | undefined
    const markers = markersRef.current
    loadYandexMaps(apiKey).then((api) => {
      if (cancelled || !containerRef.current) return
      map = new api.YMap(containerRef.current, { location: { center: [131.88, 43.025], zoom: 11 }, zoomRange: { min: 2, max: 21 } })
      mapRef.current = map
      map.addChild(new api.YMapDefaultSchemeLayer())
      map.addChild(new api.YMapDefaultFeaturesLayer())
      const containers: { place: Place; element: HTMLDivElement }[] = []
      for (const place of places) {
        const coordinates = spotCoordinates[place.id]
        if (!coordinates) continue
        const element = document.createElement('div')
        const marker = new api.YMapMarker({ coordinates, draggable: false }, element)
        markers.set(place.id, marker)
        map.addChild(marker)
        containers.push({ place, element })
      }
      setMarkerContainers(containers)
      setStatus('ready')
    }).catch(() => {
      map?.destroy()
      map = undefined
      if (!cancelled) {
        mapRef.current = null
        setStatus('error')
      }
    })
    return () => {
      cancelled = true
      markers.clear()
      map?.destroy()
      mapRef.current = null
    }
  }, [places, attempt])

  useEffect(() => {
    for (const [id, marker] of markersRef.current) marker.update({ zIndex: id === selectedId ? 1 : 0 })
    const coordinates = spotCoordinates[selectedId]
    if (status === 'ready' && coordinates) mapRef.current?.setLocation({ center: coordinates })
  }, [selectedId, status, markerContainers])

  return (
    <div>
      <p className="mt-0 mb-3 text-sm leading-5 text-text-muted">Нажмите на отметку бухты. Произвольную точку поставить нельзя.</p>
      <div className="relative isolate h-80 overflow-hidden rounded-3xl bg-map-water">
        <div ref={containerRef} className="absolute inset-0" role="region" aria-label="Выбор места ловли на карте" aria-busy={status === 'loading'} />
        {status !== 'ready' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" role="status">
          <p className="m-0 max-w-72 text-sm leading-6 text-text-muted">{status === 'missing-key' ? 'Карта пока недоступна. Выберите место во вкладке «Из списка».' : status === 'error' ? 'Не удалось загрузить карту. Повторите попытку или выберите место из списка.' : 'Загружаем карту…'}</p>
          {status === 'error' && <Button onClick={() => { setStatus('loading'); setAttempt((value) => value + 1) }}>Повторить</Button>}
        </div>}
        {status === 'ready' && <div className="absolute top-3 right-3 flex flex-col gap-2 rounded-pill bg-surface p-1">
          <IconButton icon={plusIcon} label="Приблизить карту" iconClassName="size-5 brightness-0" onClick={() => { const map = mapRef.current; if (map) map.setLocation({ zoom: Math.min(21, map.zoom + 1) }) }} />
          <IconButton icon={minusIcon} label="Отдалить карту" iconClassName="size-5 brightness-0" onClick={() => { const map = mapRef.current; if (map) map.setLocation({ zoom: Math.max(2, map.zoom - 1) }) }} />
        </div>}
      </div>
      {status === 'ready' && markerContainers.map(({ place, element }) => createPortal(<SpotMarker name={place.name} selected={selectedId === place.id} onSelect={() => onSelect(place.id)} />, element, place.id))}
    </div>
  )
}
