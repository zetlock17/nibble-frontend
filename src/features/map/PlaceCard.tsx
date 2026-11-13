import { useState } from 'react'
import pinIcon from '@/assets/icons/map/pin.svg'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import { Badge } from '@/components/ui/badge/Badge'
import { Button } from '@/components/ui/button/Button'
import type { Fish } from '@/features/fish/fish'
import type { Place } from './place'

export function PlaceCard({ place, fish, onSelect }: { place: Place; fish: readonly Fish[]; onSelect: (place: Place) => void }) {
  const [failedImage, setFailedImage] = useState<string>()
  const knownFish = fish.filter((item) => place.fishIds.includes(item.id))
  const hiddenFish = knownFish.slice(2)

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-3xl bg-surface p-3 lg:p-4">
      <div className="flex aspect-3/2 items-center justify-center overflow-hidden rounded-2xl bg-accent-soft">
        {place.image && failedImage !== place.image ? (
          <img src={place.image} alt={`Иллюстрация морского берега для места «${place.name}»`} loading="lazy" className="size-full object-cover" onError={() => setFailedImage(place.image)} />
        ) : <span className="px-4 text-sm text-text-muted">Фото пока нет</span>}
      </div>
      <div className="flex flex-col gap-2">
        <p className="m-0 flex items-start gap-1.5 text-xs leading-5 text-text-muted">
          <img src={pinIcon} alt="" className="mt-0.5 size-4 shrink-0" />
          {place.area || 'Район не указан'}
        </p>
        <h3 className="m-0 text-xl leading-7 font-extrabold">{place.name}</h3>
      </div>
      <div className="flex flex-wrap items-center gap-1.5" aria-label="Виды рыб">
        {knownFish.length ? knownFish.slice(0, 2).map((item) => <Badge key={item.id} icon={fishIcon} size="sm">{item.name}</Badge>) : <span className="text-sm text-text-muted">Виды рыб пока не указаны</span>}
        {hiddenFish.length > 0 && (
          <span className="inline-flex min-h-5 shrink-0 items-center justify-center rounded-pill bg-accent-soft px-2 py-0.5 text-xs leading-4 font-bold text-focus" title={hiddenFish.map((item) => item.name).join(', ')}>
            <span aria-hidden="true">{hiddenFish.length}+</span>
            <span className="sr-only">Другие виды: {hiddenFish.map((item) => item.name).join(', ')}</span>
          </span>
        )}
      </div>
      <p className="m-0 text-sm leading-6 text-text-muted">{place.description || 'Описание пока не добавлено.'}</p>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button variant="strong" onClick={() => onSelect(place)}>Показать на карте</Button>
        <Button variant="secondary" onClick={() => onSelect(place)}>Подробнее</Button>
      </div>
    </article>
  )
}
