import { useState } from 'react'
import calendarIcon from '@/assets/icons/decorative/calendar.svg'
import type { Fish } from './fish'

export function FishCard({ fish, onSelect }: { fish: Fish; onSelect: (fish: Fish) => void }) {
  const [failedImage, setFailedImage] = useState<string>()

  return (
    <article className="min-w-0 rounded-3xl bg-surface">
      <button type="button" data-fish-id={fish.id} onClick={() => onSelect(fish)} aria-label={`Подробнее: ${fish.name}`} className="flex h-full w-full min-w-0 cursor-pointer flex-col rounded-3xl border-0 bg-transparent p-3 text-left text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:p-4">
      <div className="flex aspect-2/1 items-center justify-center overflow-hidden rounded-2xl bg-accent-soft">
        {fish.image && failedImage !== fish.image ? (
          <img
            className="size-full object-contain mix-blend-multiply"
            src={fish.image}
            alt={fish.name}
            loading="lazy"
            onError={() => setFailedImage(fish.image)}
          />
        ) : <span className="px-4 text-sm text-text-muted">Фото пока нет</span>}
      </div>
      <h2 className="mt-3 mb-0 text-2xl leading-8 font-extrabold">{fish.name}</h2>
      <p className="mt-3 mb-2 flex-1 text-sm leading-6 text-text-muted">{fish.description || 'Описание пока не добавлено.'}</p>
      <p className="mt-auto mb-0 flex items-center gap-1.5 text-sm leading-5 text-focus">
        <img className="size-4 shrink-0" src={calendarIcon} alt="" />
        <span><span className="sr-only">Период ловли: </span>{fish.period || 'Сезон ловли неизвестен'}</span>
      </p>
      </button>
    </article>
  )
}
