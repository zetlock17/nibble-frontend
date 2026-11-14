import { useState } from 'react'
import fishImage from '@/assets/images/guides/fish-identification.png'
import knotsImage from '@/assets/images/guides/fishing-knots.png'
import arrowIcon from '@/assets/icons/actions/arrow_up.svg'
import { SeasonalFish } from '@/features/fish/SeasonalFish'
import type { Fish } from '@/features/fish/fish'
import { IconButton } from '@/components/ui/button/IconButton'

const resources = [
  { id: 'knots', title: 'Узлы для рыбалки', description: 'Как привязать крючок, сделать поводок и соединить два отрезка лески. Порядок вязания по шагам: от первой петли до затягивания и проверки готового узла.', image: knotsImage },
  { id: 'fish', title: 'Какую рыбу поймал?', description: 'На что смотреть, если не знаете название рыбы: форма тела, окраска, плавники и хвост. Как сравнивать похожие виды и какие детали улова стоит сфотографировать для определения.', image: fishImage },
]

export function HomeResources({ fish, onOpenGuide, onOpenArticle, className = '' }: { fish: readonly Fish[]; onOpenGuide: () => void; onOpenArticle: (article: 'article-knots' | 'article-fish') => void; className?: string }) {
  const [failedImages, setFailedImages] = useState<string[]>([])
  const [articleIndex, setArticleIndex] = useState(0)
  const resource = resources[articleIndex]

  function changeArticle(direction: -1 | 1) {
    setArticleIndex((current) => (current + direction + resources.length) % resources.length)
  }

  return (
    <aside className={`grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 2xl:flex 2xl:max-h-full 2xl:min-h-0 2xl:flex-col 2xl:items-stretch ${className}`} aria-label="Полезное для рыбалки">
      <SeasonalFish fish={fish} onOpenGuide={onOpenGuide} />
        <article className="flex w-full min-w-0 flex-col gap-3 overflow-hidden rounded-4xl bg-surface p-5 2xl:min-h-0" aria-label="Статьи о рыбалке" aria-roledescription="карусель">
          <div className="mt-2 mb-4 flex h-40 min-h-0 w-full items-center justify-center overflow-hidden rounded-2xl">
            {!failedImages.includes(resource.image) ? (
              <img src={resource.image} alt="" className="size-full object-contain" loading="lazy" onError={() => setFailedImages((current) => [...current, resource.image])} />
            ) : <span className="text-center text-xs text-text-muted">Иллюстрация недоступна</span>}
          </div>
          <div className="flex min-w-0 shrink-0 flex-col gap-2" aria-live="polite" aria-atomic="true">
            <h2 className="m-0 text-xl leading-7 font-extrabold">{resource.title}</h2>
            <p className="m-0 line-clamp-3 text-sm leading-5 text-text-muted">{resource.description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconButton icon={arrowIcon} label="Предыдущая статья" iconClassName="size-5 -rotate-90" className="bg-search hover:bg-accent-soft" onClick={() => changeArticle(-1)} />
              <span className="text-xs font-semibold text-text-muted tabular-nums" aria-label={`Статья ${articleIndex + 1} из ${resources.length}`}>{articleIndex + 1} / {resources.length}</span>
              <IconButton icon={arrowIcon} label="Следующая статья" iconClassName="size-5 rotate-90" className="bg-search hover:bg-accent-soft" onClick={() => changeArticle(1)} />
            </div>
            <button type="button" onClick={() => onOpenArticle(resource.id === 'knots' ? 'article-knots' : 'article-fish')} className="inline-flex min-h-9 items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-focus hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
              Подробнее
              <img src={arrowIcon} alt="" className="size-5 rotate-90" />
            </button>
          </div>
        </article>
    </aside>
  )
}
