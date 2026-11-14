import { useRef } from 'react'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import arrowIcon from '@/assets/icons/actions/arrow_up.svg'
import { Badge } from '@/components/ui/badge/Badge'
import { Button } from '@/components/ui/button/Button'
import { PhotoCarousel } from '@/components/ui/photo-carousel/PhotoCarousel'
import type { Place } from './place'

export function PlaceDetails({ place }: { place: Place }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const knownFish = place.species ?? []

  return (
    <>
    <article className="flex w-full min-h-0 flex-col gap-4 overflow-hidden rounded-4xl bg-surface p-4 lg:p-5 xl:absolute xl:inset-0">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
      <PhotoCarousel images={place.images?.length ? place.images : place.image ? [place.image] : []} alt={`Место для рыбалки «${place.name}»`} />
      <div className="flex shrink-0 flex-col gap-2">
        <p className="m-0 text-sm text-text-muted">{place.area || 'Район не указан'}</p>
        <h2 className="m-0 text-3xl leading-tight font-extrabold">{place.name}</h2>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2" aria-label="Виды рыб">
        {knownFish.length ? knownFish.map((item) => <Badge key={item.id} icon={fishIcon} size="sm">{item.name}</Badge>) : <span className="text-sm text-text-muted">Виды рыб пока не указаны</span>}
      </div>
      <p className="m-0 line-clamp-3 shrink-0 text-sm leading-6 text-text-muted">{place.description || 'Описание пока не добавлено.'}</p>
      </div>
      <button type="button" className="group inline-flex min-h-11 shrink-0 items-center gap-1 self-end border-0 bg-transparent px-2 text-sm font-semibold text-text hover:text-focus" aria-haspopup="dialog" onClick={() => dialogRef.current?.showModal()}>
        Подробнее
        <img src={arrowIcon} alt="" className="size-5 rotate-90 opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100" />
      </button>
    </article>
    <dialog ref={dialogRef} aria-labelledby={`place-dialog-title-${place.id}`} className="m-auto max-h-full w-full max-w-2xl overflow-y-auto rounded-4xl border-0 bg-surface p-6 text-text backdrop:bg-text/40">
      <div className="flex flex-col gap-5">
        <h2 id={`place-dialog-title-${place.id}`} className="m-0 text-2xl font-extrabold">{place.name}</h2>
        <p className="m-0 text-sm leading-6 text-text-muted">{place.details || place.description || 'Описание пока не добавлено.'}</p>
        {!!place.methods?.length && <p className="m-0 text-sm leading-6 text-text-muted">Способы ловли: {place.methods.join(', ')}.</p>}
        <div className="rounded-2xl bg-accent-soft p-4">
          <h3 className="m-0 text-sm font-bold">Перед поездкой</h3>
          <p className="mt-2 mb-0 text-sm leading-6 text-text-muted">{place.preparation || 'Уточните доступ к берегу и проверьте погоду перед выездом.'}</p>
        </div>
        <Button variant="secondary" className="self-end" onClick={() => dialogRef.current?.close()}>Закрыть</Button>
      </div>
    </dialog>
    </>
  )
}
