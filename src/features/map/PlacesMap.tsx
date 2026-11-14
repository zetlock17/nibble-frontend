import { FilterBar } from '@/components/ui/filter-bar/FilterBar'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import fishermanImage from '@/assets/images/map/fisherman.png'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import wavesIcon from '@/assets/icons/map/waves.svg'
import locationIcon from '@/assets/icons/map/location-arrow.svg'
import plusIcon from '@/assets/icons/actions/plus.svg'
import minusIcon from '@/assets/icons/actions/minus.svg'
import rodIcon from '@/assets/icons/fishing/rod.svg'
import { Button } from '@/components/ui/button/Button'
import { IconButton } from '@/components/ui/button/IconButton'
import { Select } from '@/components/ui/select/Select'
import { noSpotFilters, useFilterOptions } from './spot-filters'
import type { SpotFilters } from './spot-filters'
import { createMap, flyTo, loadLeaflet, maxZoom, minZoom } from './leaflet-map'
import type { LeafletApi, MapInstance } from './leaflet-map'
import { useDepthLayer } from './use-depth-layer'
import { DepthLegend } from './DepthLegend'
import type { Place } from './place'
import { PlaceCard } from './PlaceCard'
import { SpotDetails } from './SpotDetails'
import { revealPlace } from './reveal-place'
import { loadSpots } from './spots'
import { createSpotMarkers } from './spot-markers'
import { SpotMarker } from './SpotMarker'
import { PlacePage } from './PlacePage'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
const emptyPlaces: readonly Place[] = []
type SpotsResult = { cityId: number; attempt: number; filterKey: string } & ({ status: 'ready'; places: Place[] } | { status: 'error' })

export function PlacesMap({ cityId, cityName, center, initialPlace, initialSpeciesId }: { cityId: number; cityName: string; center: [number, number]; initialPlace?: Place; initialSpeciesId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapInstance | null>(null)
  const apiRef = useRef<LeafletApi | null>(null)
  const overviewRef = useRef<HTMLElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const scrollPositionsRef = useRef({ content: 0, main: 0 })
  const [openPlace, setOpenPlace] = useState<Place | null>(null)
  const [selection, setSelection] = useState<{ cityId: number; place: Place } | null>(initialPlace ? { cityId, place: initialPlace } : null)
  const selectedPlace = selection?.cityId === cityId ? selection.place : null
  const [spotsResult, setSpotsResult] = useState<SpotsResult | null>(null)
  const [spotsAttempt, setSpotsAttempt] = useState(0)
  const [filters, setFilters] = useState<SpotFilters>({ ...noSpotFilters, speciesId: initialSpeciesId ?? '' })
  const filterKey = `${filters.speciesId}|${filters.methodId}`
  const hasFilters = Boolean(filters.speciesId || filters.methodId)
  const species = useFilterOptions('/species', apiBase)
  const methods = useFilterOptions('/fishing-methods', apiBase)
  const currentSpots = spotsResult?.cityId === cityId && spotsResult.attempt === spotsAttempt && spotsResult.filterKey === filterKey ? spotsResult : null
  const places = currentSpots?.status === 'ready' ? currentSpots.places : emptyPlaces
  const [markerError, setMarkerError] = useState(false)
  const [markerContainers, setMarkerContainers] = useState<{ place: Place; element: HTMLDivElement }[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  // Register depth cleanup before the effect that destroys its parent map.
  const depths = useDepthLayer(mapRef, apiRef, status === 'ready', cityId, attempt)

  const selectPlace = useCallback((place: Place) => {
    setSelection({ cityId, place })
    requestAnimationFrame(() => {
      revealPlace(overviewRef.current, detailsRef.current, window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    })
  }, [cityId])

  useEffect(() => {
    if (initialPlace) detailsRef.current?.focus({ preventScroll: true })
  }, [initialPlace])

  useEffect(() => {
    const map = mapRef.current
    if (status === 'ready' && map && selectedPlace?.coordinates) {
      flyTo(map, selectedPlace.coordinates, 14, !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }
  }, [selectedPlace, status, attempt])

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    loadSpots(cityId, apiBase, signal, filters).then((data) => {
      if (!controller.signal.aborted) setSpotsResult({ cityId, attempt: spotsAttempt, filterKey, status: 'ready', places: data })
    }).catch(() => {
      if (!controller.signal.aborted) setSpotsResult({ cityId, attempt: spotsAttempt, filterKey, status: 'error' })
    })
    return () => controller.abort()
    // filters входит в filterKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId, spotsAttempt, filterKey])

  // Remove markers before destroying their parent map.
  useEffect(() => {
    const map = mapRef.current
    const api = apiRef.current
    if (status !== 'ready' || !map || !api) return
    let active = true
    let removeMarkers: (() => void) | undefined
    void Promise.resolve().then(() => {
      if (!active) return
      try {
        const result = createSpotMarkers(map, api, places, selectedPlace?.id)
        removeMarkers = result.remove
        setMarkerContainers(result.containers)
        setMarkerError(false)
      } catch {
        setMarkerError(true)
      }
    })
    return () => { active = false; removeMarkers?.() }
  }, [places, selectedPlace?.id, selectPlace, status, attempt])

  useEffect(() => {
    let cancelled = false
    let map: MapInstance | undefined

    loadLeaflet().then((api) => {
      if (cancelled || !containerRef.current) return
      map = createMap(api, containerRef.current, center, 10)
      mapRef.current = map
      apiRef.current = api
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
      map?.remove()
      mapRef.current = null
      apiRef.current = null
    }
  }, [attempt, center])

  function changeZoom(delta: number) {
    const map = mapRef.current
    if (map) map.setZoom(Math.min(maxZoom, Math.max(minZoom, map.getZoom() + delta)))
  }

  function openPlacePage(place: Place) {
    const overview = overviewRef.current
    const content = overview?.parentElement
    const main = overview?.closest('main')
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    scrollPositionsRef.current = { content: content?.scrollTop ?? 0, main: main?.scrollTop ?? 0 }
    setOpenPlace(place)
    content?.scrollTo({ top: 0 })
    main?.scrollTo({ top: 0 })
  }

  function closePlacePage(placeToShow?: Place) {
    setOpenPlace(null)
    requestAnimationFrame(() => {
      mapRef.current?.invalidateSize({ animate: false })
      if (placeToShow) {
        selectPlace(placeToShow)
      } else {
        overviewRef.current?.parentElement?.scrollTo({ top: scrollPositionsRef.current.content })
        overviewRef.current?.closest('main')?.scrollTo({ top: scrollPositionsRef.current.main })
        returnFocusRef.current?.focus({ preventScroll: true })
      }
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
      if (map) flyTo(map, [coords.longitude, coords.latitude], 14, true)
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
    <>
    {openPlace && <PlacePage key={openPlace.id} place={openPlace} cityName={cityName} onBack={() => closePlacePage()} onMap={closePlacePage} />}
    <section ref={overviewRef} className={openPlace ? 'hidden' : 'flex w-full min-w-0 flex-col gap-4'} aria-labelledby="places-title">
      <h1 id="places-title" className="m-0 text-3xl leading-tight font-extrabold sm:text-4xl">Карта мест</h1>
      <FilterBar className="flex flex-wrap items-center gap-3 pt-2">
        <Select label="Все виды рыб" icon={fishIcon} options={species.options} value={filters.speciesId} onChange={(speciesId) => { setSelection(null); setFilters({ ...filters, speciesId }) }} disabled={species.status !== 'ready'} />
        <Select label="Все способы ловли" icon={rodIcon} options={methods.options} value={filters.methodId} onChange={(methodId) => { setSelection(null); setFilters({ ...filters, methodId }) }} disabled={methods.status !== 'ready'} />
        {hasFilters && <Button variant="secondary" size="md" onClick={() => { setSelection(null); setFilters(noSpotFilters) }}>Сбросить фильтры</Button>}
        {(species.status === 'error' || methods.status === 'error') && <p className="m-0 text-xs text-text-muted" role="status">Не удалось загрузить список для фильтра. Обновите страницу.</p>}
      </FilterBar>
      {/* Отдельная строка для легенды сохраняет высоту правой панели по карте. */}
      <div className="grid w-full grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,--spacing(176))_minmax(--spacing(64),1fr)] xl:gap-y-0">
        <div className="w-full max-w-176 rounded-4xl bg-surface xl:row-span-2 xl:grid xl:grid-rows-subgrid xl:self-stretch">
          <div className="p-2.5">
            <div className="relative isolate aspect-4/3 min-h-96 overflow-hidden rounded-3xl bg-map-water">
              <div ref={containerRef} className="absolute inset-0 z-0" role="region" aria-label="Карта Владивостока и окрестностей" aria-busy={status === 'loading'} />
              {status !== 'ready' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-14 text-center" role="status">
                  <p className="m-0 max-w-64 text-sm text-text-muted">
                    {status === 'error' ? 'Не удалось загрузить карту. Проверьте подключение и попробуйте ещё раз.'
                      : 'Загружаем карту…'}
                  </p>
                  {status === 'error' && <Button onClick={() => { setStatus('loading'); setAttempt((value) => value + 1) }}>Повторить</Button>}
                </div>
              )}
              <button type="button" disabled={status !== 'ready'} onClick={depths.toggle} aria-pressed={depths.enabled} className={`absolute top-3 left-3 inline-flex min-h-11 items-center gap-2 rounded-pill border px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-50 ${depths.enabled ? 'border-primary-strong bg-primary-strong text-surface hover:bg-primary-strong-hover' : 'border-navigation-divider bg-surface text-text hover:bg-accent-soft'}`}>
                <img className={`size-4 ${depths.enabled ? 'invert' : ''}`} src={wavesIcon} alt="" />
                {depths.status === 'loading' ? (
                  <><span aria-hidden="true" className="size-3.5 animate-spin rounded-pill border-2 border-surface/30 border-t-surface motion-reduce:animate-none" />Загружаем глубины…</>
                ) : depths.enabled ? 'Скрыть глубины' : 'Показать глубины'}
              </button>
              <div className="sr-only" role="status">{depths.status === 'loading' ? 'Загружаем слой глубин.' : depths.status === 'ready' ? 'Слой глубин включён.' : ''}</div>
              {markerError && <p className="absolute right-3 bottom-3 left-3 m-0 rounded-2xl bg-surface p-3 text-sm text-text-muted" role="status">Не удалось показать метки. Выберите место в списке или перезагрузите страницу.</p>}
              {(depths.status === 'error' || depths.status === 'empty') && (
                <div className="absolute right-3 bottom-8 left-3 max-w-96 rounded-2xl bg-surface p-4 text-sm leading-5 text-text-muted" role="status">
                  <p className="m-0">{depths.status === 'error'
                    ? 'Не удалось загрузить глубины. Проверьте подключение и попробуйте ещё раз.'
                    : 'Для этого города данных о глубинах пока нет. Можно пользоваться обычной картой.'}</p>
                  {depths.status === 'error' && <button type="button" onClick={depths.retry} className="mt-2 min-h-11 font-semibold text-focus underline underline-offset-4">Повторить загрузку</button>}
                </div>
              )}
              <div className="absolute top-16 right-4 flex flex-col items-center gap-4 sm:top-1/2 sm:-translate-y-1/2">
                <div className="flex flex-col rounded-pill bg-surface p-1" role="group" aria-label="Масштаб карты">
                  <IconButton icon={plusIcon} label="Приблизить" iconClassName="size-5 brightness-0 opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100" className="group bg-surface" disabled={status !== 'ready'} onClick={() => changeZoom(1)} />
                  <IconButton icon={minusIcon} label="Отдалить" iconClassName="size-5 brightness-0 opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100" className="group bg-surface" disabled={status !== 'ready'} onClick={() => changeZoom(-1)} />
                </div>
                <IconButton icon={locationIcon} label={locating ? 'Определяем местоположение' : 'Моё местоположение'} iconClassName="size-4.5 brightness-0 opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100" className="group min-h-11 min-w-11 bg-surface" disabled={status !== 'ready' || locating} onClick={locate} />
              </div>
            </div>
          </div>
          {(depths.data || locationError) && (
            <div className="px-2.5 pb-2.5">
              {depths.data && <DepthLegend data={depths.data} />}
              {locationError && <p className="m-0 px-2 py-3 text-xs leading-5 text-text-muted" role="status">{locationError}</p>}
            </div>
          )}
        </div>
        {selectedPlace ? (
          <div ref={detailsRef} tabIndex={-1} aria-label={`Подробности места: ${selectedPlace.name}`} className="relative w-full min-w-0 self-stretch xl:col-start-2 xl:row-start-1">
            <SpotDetails key={`${cityId}:${selectedPlace.id}`} place={selectedPlace} onOpen={openPlacePage} />
          </div>
        ) : (
          <div className="relative min-w-0 self-stretch xl:col-start-2 xl:row-start-1">
            <div className="flex min-h-0 flex-col items-center justify-center gap-6 px-6 py-8 text-center xl:absolute xl:inset-0">
              <img src={fishermanImage} alt="" className="h-100 min-h-0 w-112 max-w-full object-contain" />
              <p className="m-0 max-w-72 shrink-0 text-lg leading-7 font-semibold text-text-muted">Выберите место для рыбалки</p>
            </div>
          </div>
        )}
      </div>
      {status === 'ready' && markerContainers.map(({ place, element }) => createPortal(<SpotMarker name={place.name} selected={selectedPlace?.id === place.id} onSelect={() => selectPlace(place)} />, element, place.id))}
      <section className="mt-3 flex flex-col gap-5 pb-6" aria-labelledby="places-list-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="places-list-title" className="m-0 text-2xl leading-8 font-extrabold">Места для рыбалки</h2>
          <Button variant="secondary" disabled={!currentSpots} onClick={() => { setSelection(null); setSpotsAttempt((value) => value + 1) }}>Обновить места</Button>
        </div>
        {!currentSpots ? <p className="m-0 text-sm text-text-muted" role="status">Загружаем места…</p> : currentSpots.status === 'error' ? (
          <div className="flex flex-col items-start gap-3 rounded-3xl bg-surface p-6" role="alert">
            <p className="m-0 text-sm text-text-muted">Не удалось загрузить места. Проверьте подключение и попробуйте ещё раз.</p>
            <Button onClick={() => setSpotsAttempt((value) => value + 1)}>Повторить</Button>
          </div>
        ) : places.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {places.map((place) => <PlaceCard key={place.id} place={place} onSelect={selectPlace} onOpen={openPlacePage} />)}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-3xl bg-surface p-6" role="status">
            <p className="m-0 text-sm text-text-muted">{hasFilters ? 'По этим фильтрам мест нет. Попробуйте другой вид рыбы или способ ловли.' : 'Мест пока нет. Загляните позже.'}</p>
            {hasFilters && <Button variant="secondary" onClick={() => setFilters(noSpotFilters)}>Сбросить фильтры</Button>}
          </div>
        )}
      </section>
    </section>
    </>
  )
}
