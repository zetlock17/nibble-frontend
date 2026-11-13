import { useState } from 'react'

export type GridPhoto = { id: string; src: string; alt: string }

type PhotoGridProps = {
  photos: readonly GridPhoto[]
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [failedSources, setFailedSources] = useState<string[]>([])

  if (photos.length === 0) {
    return <p className="m-0 text-sm leading-relaxed text-text-muted" role="status">Фотографий пока нет.</p>
  }

  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-1 overflow-hidden rounded-2xl p-0 @sm:grid-cols-3 @lg:grid-cols-4">
      {photos.map((photo) => (
        <li key={photo.id} className="aspect-square min-w-0 overflow-hidden">
          {failedSources.includes(photo.src) ? (
            <span className="flex size-full items-center justify-center bg-search p-3 text-center text-xs text-text-muted" role="status">Не удалось загрузить фото. Обновите страницу.</span>
          ) : (
            <a className="group block size-full bg-search focus-visible:-outline-offset-2" href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={`${photo.alt} Открыть фото в новой вкладке`}>
              <img className="block size-full object-cover transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:transition-none motion-reduce:transform-none" src={photo.src} alt={photo.alt} loading="lazy" onError={() => setFailedSources((current) => [...current, photo.src])} />
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
