import { useEffect, useRef, useState } from 'react'
import fishermanImage from '@/assets/images/map/fisherman.png'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import wavesIcon from '@/assets/icons/map/waves.svg'
import locationIcon from '@/assets/icons/map/location-arrow.svg'
import plusIcon from '@/assets/icons/actions/plus.svg'
import minusIcon from '@/assets/icons/actions/minus.svg'
import pinIcon from '@/assets/icons/map/pin.svg'
import rodIcon from '@/assets/icons/fishing/rod.svg'
import trashIcon from '@/assets/icons/actions/trash.svg'
import { Button } from '@/components/ui/button/Button'
import { IconButton } from '@/components/ui/button/IconButton'
import { Select } from '@/components/ui/select/Select'
import { loadYandexMaps } from './yandex-maps'
import type { MapInstance } from './yandex-maps'
import type { Fish } from '@/features/fish/fish'
import type { Place } from './place'
import { PlaceCard } from './PlaceCard'
import { PlaceDetails } from './PlaceDetails'
import { revealPlace } from './reveal-place'
import { filterPlaces, placeAreas, fishingLocations } from './filter-places'

const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim()

export function PlacesMap({ places, fish }: { places: readonly Place[]; fish: readonly Fish[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapInstance | null>(null)
  const overviewRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [status, setStatus] = useState<'loading' | 'missing-key' | 'ready' | 'error'>(apiKey ? 'loading' : 'missing-key')
  const [attempt, setAttempt] = useState(0)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [area, setArea] = useState('')
  const [fishingFrom, setFishingFrom] = useState('')
  const filteredPlaces = filterPlaces(places, area, fishingFrom)
  const hasFilters = Boolean(area || fishingFrom)

  function resetFilters() {
    setArea('')
    setFishingFrom('')
    setSelectedPlace(null)
  }

  useEffect(() => {
    if (!apiKey) return
    let cancelled = false
    let map: MapInstance | undefined

    loadYandexMaps(apiKey).then((api) => {
      if (cancelled || !containerRef.current) return
      map = new api.YMap(containerRef.current, {
        location: { center: [131.8855, 43.1155], zoom: 10 },
        zoomRange: { min: 2, max: 21 },
      })
      mapRef.current = map
      map.addChild(new api.YMapDefaultSchemeLayer())
      map.addChild(new api.YMapDefaultFeaturesLayer())
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
      map?.destroy()
      mapRef.current = null
    }
  }, [attempt])

  function changeZoom(delta: number) {
    const map = mapRef.current
    if (map) map.setLocation({ zoom: Math.min(21, Math.max(2, map.zoom + delta)) })
  }

  function selectPlace(place: Place) {
    setSelectedPlace(place)
    requestAnimationFrame(() => {
      revealPlace(overviewRef.current, detailsRef.current, window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    })
  }

  function locate() {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Браузер не поддерживает геолокацию. Найдите место на карте вручную.')
      return
    }
    const map = mapRef.current
    setLocating(true)
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (mapRef.current !== map) return
      map?.setLocation({ center: [coords.longitude, coords.latitude], zoom: 14 })
      setLocating(false)
    }, (error) => {
      if (mapRef.current !== map) return
      setLocating(false)
      setLocationError(error.code === 1
        ? 'Разрешите доступ к геопозиции в браузере или найдите место на карте вручную.'
        : 'Не удалось определить местоположение. Попробуйте ещё раз.')
    }, { timeout: 10000, maximumAge: 60000 })
  }

  return (
    <section className="flex w-full min-w-0 flex-col gap-5" aria-labelledby="places-title">
      <h1 id="places-title" className="m-0 text-3xl leading-tight font-extrabold sm:text-4xl">Карта мест</h1>
      <div className="flex flex-wrap items-center gap-3">
        <Select label="Все виды рыб" icon={fishIcon} options={[]} value="" onChange={() => {}} disabled />
        <Select label="Район" icon={pinIcon} options={placeAreas} value={area} onChange={(value) => { setArea(value); setSelectedPlace(null) }} />
        <Select label="Откуда ловить" icon={rodIcon} options={fishingLocations} value={fishingFrom} onChange={(value) => { setFishingFrom(value); setSelectedPlace(null) }} />
        {hasFilters && <IconButton icon={trashIcon} label="Сбросить фильтры" iconClassName="size-4.5" className="size-11 bg-surface hover:bg-accent-soft" onClick={resetFilters} />}
      </div>
      <div ref={overviewRef} tabIndex={-1} className="flex scroll-mt-5 flex-col items-start gap-8 xl:flex-row">
        <div className="w-full max-w-176 self-start rounded-4xl bg-surface p-2.5 xl:w-176">
          <div className="relative isolate aspect-4/3 min-h-96 overflow-hidden rounded-3xl bg-map-water">
            <div ref={containerRef} className="absolute inset-0" role="region" aria-label="Карта Владивостока и окрестностей" aria-busy={status === 'loading'} />
            {status !== 'ready' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-14 text-center" role="status">
                <p className="m-0 max-w-64 text-sm text-text-muted">
                  {status === 'missing-key' ? 'Карта появится после подключения ключа Яндекс Карт.'
                    : status === 'error' ? 'Не удалось загрузить карту. Проверьте подключение и попробуйте ещё раз.'
                    : 'Загружаем карту…'}
                </p>
                {status === 'error' && <Button onClick={() => { setStatus('loading'); setAttempt((value) => value + 1) }}>Повторить</Button>}
              </div>
            )}
            <button type="button" disabled title="Слой глубин появится позже" className="absolute top-3 left-3 inline-flex min-h-9 items-center gap-2 rounded-pill border border-navigation-divider bg-surface px-3 py-2 text-xs text-text">
              <img className="size-4" src={wavesIcon} alt="" />
              Слой глубин
            </button>
            <div className="absolute top-1/2 right-4 flex -translate-y-1/2 flex-col items-center gap-4">
              <div className="flex flex-col rounded-pill bg-surface p-1" role="group" aria-label="Масштаб карты">
                <IconButton icon={plusIcon} label="Приблизить" iconClassName="size-5 brightness-0 opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100" className="group bg-surface" disabled={status !== 'ready'} onClick={() => changeZoom(1)} />
                <IconButton icon={minusIcon} label="Отдалить" iconClassName="size-5 brightness-0 opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100" className="group bg-surface" disabled={status !== 'ready'} onClick={() => changeZoom(-1)} />
              </div>
              <IconButton icon={locationIcon} label={locating ? 'Определяем местоположение' : 'Моё местоположение'} iconClassName="size-4.5 brightness-0 opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100" className="group min-h-11 min-w-11 bg-surface" disabled={status !== 'ready' || locating} onClick={locate} />
            </div>
          </div>
          {locationError && (
            <p className="m-0 px-2 py-3 text-xs leading-5 text-text-muted" role="status">{locationError}</p>
          )}
        </div>
        {selectedPlace ? (
          <div ref={detailsRef} tabIndex={-1} aria-label={`Подробности места: ${selectedPlace.name}`} className="relative w-full min-w-0 flex-1 self-stretch xl:min-w-64">
            <PlaceDetails key={selectedPlace.id} place={selectedPlace} fish={fish} />
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 self-stretch px-6 py-8 text-center xl:min-w-64">
            <img src={fishermanImage} alt="" className="h-100 w-112 max-w-full object-contain" />
            <p className="m-0 max-w-72 text-lg leading-7 font-semibold text-text-muted">Выберите место для рыбалки</p>
          </div>
        )}
      </div>
      <section className="mt-3 flex flex-col gap-5 pb-6" aria-labelledby="places-list-title">
        <h2 id="places-list-title" className="m-0 text-2xl leading-8 font-extrabold">Места для рыбалки</h2>
        {filteredPlaces.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} fish={fish} onSelect={selectPlace} />)}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-3xl bg-surface p-6" role="status">
            <p className="m-0 text-sm text-text-muted">{hasFilters ? 'Подходящих мест нет. Измените район или откуда хотите ловить.' : 'Мест пока нет. Загляните позже.'}</p>
            {hasFilters && <Button variant="secondary" onClick={resetFilters}>Сбросить фильтры</Button>}
          </div>
        )}
      </section>
    </section>
  )
}
