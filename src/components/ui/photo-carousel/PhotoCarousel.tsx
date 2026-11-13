import { useState } from 'react'
import shortArrowIcon from '@/assets/icons/navigation/short_arrow_down.svg'
import { IconButton } from '@/components/ui/button/IconButton'
import { movePhoto } from './photo-carousel'

export function PhotoCarousel({ images, alt }: { images: readonly string[]; alt: string }) {
  const [index, setIndex] = useState(0)
  const [failedSources, setFailedSources] = useState<string[]>([])
  const source = images[index]
  const arrowClasses = 'size-6 opacity-50 group-hover:opacity-90 group-focus-visible:opacity-90'
  const buttonClasses = 'group absolute top-1/2 -translate-y-1/2 bg-surface/35 transition-colors hover:bg-surface/75 focus-visible:bg-surface/75 motion-reduce:transition-none'

  return (
    <div className="relative flex aspect-3/2 min-h-0 max-h-56 items-center justify-center overflow-hidden rounded-3xl bg-accent-soft" role="region" aria-label="Фотографии места" aria-roledescription="карусель">
      {source && !failedSources.includes(source) ? (
        <img src={source} alt={alt} className="size-full object-cover" onError={() => setFailedSources((current) => [...current, source])} />
      ) : <span className="px-4 text-sm text-text-muted">{source ? 'Не удалось загрузить фото' : 'Фото пока нет'}</span>}
      {index > 0 && <IconButton icon={shortArrowIcon} label="Предыдущее фото" className={`${buttonClasses} left-3`} iconClassName={`${arrowClasses} rotate-90`} onClick={() => setIndex((current) => movePhoto(current, -1, images.length))} />}
      {index < images.length - 1 && <IconButton icon={shortArrowIcon} label="Следующее фото" className={`${buttonClasses} right-3`} iconClassName={`${arrowClasses} -rotate-90`} onClick={() => setIndex((current) => movePhoto(current, 1, images.length))} />}
      <span className="sr-only" aria-live="polite" aria-atomic="true">{images.length ? `Фото ${index + 1} из ${images.length}` : 'Фотографий пока нет'}</span>
    </div>
  )
}
