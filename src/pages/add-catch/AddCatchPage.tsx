import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import imageIcon from '@/assets/icons/decorative/image.svg'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import pinIcon from '@/assets/icons/map/pin.svg'
import arrowIcon from '@/assets/icons/actions/arrow_up.svg'
import trashIcon from '@/assets/icons/actions/trash.svg'
import plusIcon from '@/assets/icons/actions/plus.svg'
import { Button } from '@/components/ui/button/Button'
import { SearchSelect } from '@/components/ui/select/SearchSelect'
import { SegmentedControl } from '@/components/ui/segmented-control/SegmentedControl'
import { CatchSpotMap } from '@/features/catch/CatchSpotMap'
import { photoError, validateCatch } from '@/features/catch/catch-form'
import type { Fish } from '@/features/fish/fish'
import { useSpots } from '@/features/map/use-spots'
import type { City } from '@/features/city/cities'

type Props = { fish: readonly Fish[]; city: City | null; origin: 'home' | 'profile'; onBack: () => void; active: boolean }

export function AddCatchPage({ fish, city, origin, onBack, active }: Props) {
  const id = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef(0)
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [fishIds, setFishIds] = useState<string[]>([])
  const [placeId, setPlaceId] = useState('')
  const [placeMode, setPlaceMode] = useState<'list' | 'map'>('list')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const spots = useSpots(city?.id ?? 0, active && Boolean(city))
  const places = spots.places
  const selectedPlace = places.find((place) => place.id === placeId)
  const selectPlace = useCallback((value: string) => { setPlaceId(value); setMessage('') }, [])

  useEffect(() => { if (active) headingRef.current?.focus({ preventScroll: true }) }, [active])
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url) }, [photo])
  useEffect(() => () => { uploadRef.current += 1 }, [])

  async function attachPhoto(file?: File) {
    if (!file) return
    const request = ++uploadRef.current
    const error = photoError(file)
    setUploadError(error)
    setMessage('')
    if (error) { setUploading(false); return }
    setUploading(true)
    const url = URL.createObjectURL(file)
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      if (request !== uploadRef.current) { URL.revokeObjectURL(url); return }
      setPhoto({ url, name: file.name })
    } catch {
      URL.revokeObjectURL(url)
      if (request === uploadRef.current) setUploadError('Не удалось открыть фото. Выберите другой файл JPEG или PNG.')
    } finally {
      if (request === uploadRef.current) setUploading(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const error = validateCatch({ hasPhoto: Boolean(photo), description, fishIds, placeId }, fish, places)
    setMessage(error || 'Публикация пока недоступна. Заполненный улов остаётся здесь, пока открыта вкладка.')
  }

  return (
    <section className="w-full min-w-0 pb-6" aria-labelledby={`${id}-title`}>
      <button type="button" onClick={onBack} className="mb-1 inline-flex min-h-11 items-center gap-2 bg-transparent text-sm font-bold text-focus">
        <img src={arrowIcon} alt="" className="size-4 -rotate-90" />{origin === 'profile' ? 'Мой профиль' : 'Главная'}
      </button>
      <h1 ref={headingRef} tabIndex={-1} id={`${id}-title`} className="mt-0 mb-6 text-3xl leading-tight font-extrabold outline-none sm:text-4xl">Добавить улов</h1>
      <form onSubmit={submit} className="grid grid-cols-1 items-stretch gap-6 rounded-4xl bg-surface p-4 sm:p-6 xl:grid-cols-2 xl:gap-x-8" aria-label="Новый улов">
        <div className="flex min-w-0 flex-col gap-6">
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-1 text-base font-extrabold">Место ловли</legend>
            <p className="mt-0 mb-3 text-sm leading-5 text-text-muted">Выберите известное место или оставьте его в секрете.</p>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <SegmentedControl label="Как выбрать место" options={[{ value: 'list', label: 'Из списка' }, { value: 'map', label: 'На карте' }]} value={placeMode} onChange={setPlaceMode} className="max-sm:w-full" />
              {placeMode === 'map' && selectedPlace && <button type="button" aria-label={`Убрать место: ${selectedPlace.name}`} title={`Убрать место: ${selectedPlace.name}`} className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-pill bg-accent-soft px-3 text-sm font-semibold text-focus" onClick={() => selectPlace('')}>
                <img src={pinIcon} alt="" className="size-4 shrink-0" />
                <span className="min-w-0 truncate">{selectedPlace.name}</span>
                <img src={plusIcon} alt="" className="size-4 shrink-0 rotate-45 brightness-0 opacity-60" />
              </button>}
            </div>
            {spots.status === 'error' ? (
              <div className="mb-4 flex flex-col items-start gap-3 rounded-3xl bg-accent-soft p-4" role="alert">
                <p className="m-0 text-sm leading-5 text-text-muted">Не удалось загрузить места. Проверьте подключение и попробуйте ещё раз. Улов можно опубликовать и без места.</p>
                <Button variant="secondary" onClick={spots.retry}>Повторить</Button>
              </div>
            ) : spots.status === 'loading' ? <p className="mt-0 mb-4 text-sm text-text-muted" role="status">Загружаем места…</p>
              : !places.length && <p className="mt-0 mb-4 text-sm text-text-muted" role="status">Мест пока нет. Улов можно опубликовать без места.</p>}
            {placeMode === 'list' ? <SearchSelect label="Место ловли" placeholder="Выбрать место" icon={pinIcon} options={places.map((place) => ({ value: place.id, label: place.name, description: place.area }))} value={placeId ? [placeId] : []} onChange={(value) => selectPlace(value[0] ?? '')} /> : active && <CatchSpotMap key={city?.id} center={city?.coordinates} places={places} selectedId={placeId} onSelect={selectPlace} />}
          </fieldset>

          <div className="flex min-h-0 flex-1 flex-col">
            <label htmlFor={`${id}-description`} className="mb-2 block shrink-0 text-base font-extrabold">Как прошла рыбалка</label>
            <div className="relative flex min-h-40 flex-1">
              <textarea id={`${id}-description`} name="description" rows={5} maxLength={3000} value={description} onChange={(event) => { setDescription(event.target.value); setMessage('') }} placeholder="Расскажите об улове. Когда ездили, на что ловили, какая была погода?" className="block min-h-40 w-full flex-1 resize-y rounded-3xl border-0 bg-search p-4 pb-10 text-sm leading-6 text-text caret-focus outline-none placeholder:text-text-muted xl:resize-none" aria-describedby={`${id}-description-hint`} />
              <p id={`${id}-description-hint`} className="pointer-events-none absolute right-4 bottom-3 m-0 text-xs text-text-muted">{description.length} / 3000</p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-1 text-base font-extrabold">Виды рыб</legend>
            <p className="mt-0 mb-3 text-sm text-text-muted">Можно выбрать несколько видов.</p>
            <SearchSelect label="Виды рыб" placeholder="Выбрать рыбу" icon={fishIcon} options={fish.map((item) => ({ value: item.id, label: item.name }))} value={fishIds} onChange={(value) => { setFishIds(value); setMessage('') }} multiple />
          </fieldset>

          <div className="shrink-0">
            <input ref={fileRef} id={`${id}-photo`} aria-label="Фото улова" className="sr-only" type="file" accept="image/jpeg,image/png" tabIndex={-1} onChange={(event) => { void attachPhoto(event.target.files?.[0]); event.target.value = '' }} />
            {photo ? <div className="overflow-hidden rounded-3xl bg-search">
              <img src={photo.url} alt="Предпросмотр фото улова" className="h-48 w-full object-contain xl:h-40" />
              <div className="flex flex-wrap items-center justify-between gap-3 p-3">
                <span className="min-w-0 flex-1 truncate text-xs text-text-muted">{photo.name}</span>
                <Button variant="secondary" onClick={() => fileRef.current?.click()}>Заменить фото</Button>
                <button type="button" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-focus" onClick={() => { uploadRef.current += 1; setPhoto(null); setUploading(false); setUploadError(''); setMessage('') }}><img src={trashIcon} alt="" className="size-4" />Удалить</button>
              </div>
            </div> : <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length > 1) { setUploadError('Добавьте одно фото.'); return }; void attachPhoto(event.dataTransfer.files[0]) }} className={`flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-3xl border border-navigation-divider p-5 text-center ${dragging ? 'bg-selection' : 'bg-accent-soft'}`} aria-describedby={`${id}-photo-hint`}>
              <img src={imageIcon} alt="" className="mb-1 size-7" />
              <span className="text-lg font-extrabold">Добавить фото</span>
              <span className="text-sm text-text-muted">Выберите файл <span className="hidden sm:inline">или перетащите сюда</span></span>
            </button>}
            <p id={`${id}-photo-hint`} className="mt-2 mb-0 text-xs leading-5 text-text-muted">JPEG или PNG, до 10 МБ. Можно опубликовать без фото.</p>
            {uploading && <p className="mt-2 mb-0 text-sm text-text-muted" role="status">Открываем фото…</p>}
            {uploadError && <p className="mt-2 mb-0 text-sm text-focus" role="alert">{uploadError}</p>}
          </div>
          <div className="flex shrink-0 justify-end">
            <Button type="submit" size="md" disabled={uploading} className="max-sm:w-full">Опубликовать улов</Button>
          </div>
          {message && <p className="m-0 text-sm leading-6 text-focus" role="alert">{message}</p>}
        </div>
      </form>
    </section>
  )
}
