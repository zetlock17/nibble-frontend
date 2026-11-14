import { useEffect, useRef, useState } from 'react'
import arrowIcon from '@/assets/icons/actions/arrow_up.svg'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import { Badge } from '@/components/ui/badge/Badge'
import { Button } from '@/components/ui/button/Button'
import type { Place } from './place'
import { useSpotDetails } from './use-spot-details'
import { spotDescriptionParagraphs } from './spots'

export function PlacePage({ place, cityName, onBack, onMap }: { place: Place; cityName: string; onBack: () => void; onMap: (place: Place) => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [failedImage, setFailedImage] = useState<string>()
  const { result, retry } = useSpotDetails(place.id)
  const current = result && 'data' in result ? result.data : place
  const hasImage = Boolean(current.image && failedImage !== current.image)

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  return (
    <section className="w-full min-w-0 pb-6" aria-labelledby="place-page-title">
      <button type="button" onClick={onBack} className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-sm border-0 bg-transparent p-0 text-sm font-bold text-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <img src={arrowIcon} alt="" className="size-4 -rotate-90" />Карта мест
      </button>
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <div className={`flex items-center justify-center overflow-hidden rounded-3xl bg-accent-soft ${hasImage ? 'min-h-64 sm:min-h-80' : 'min-h-24'}`}>
            {hasImage && current.image ? <img src={current.image} alt={`Место для рыбалки «${current.name}»`} className="max-h-96 w-full object-contain" onError={() => setFailedImage(current.image)} /> : <p className="m-0 p-6 text-sm text-text-muted">{current.image ? 'Не удалось загрузить фото.' : 'Фото пока нет.'}</p>}
          </div>
          <section className="rounded-3xl bg-surface p-5 sm:p-6" aria-labelledby="place-about-title">
            <h2 id="place-about-title" className="m-0 text-xl font-extrabold">О месте</h2>
            {!result ? <p className="mt-3 mb-0 text-sm leading-6 text-text-muted" role="status">Загружаем описание…</p> : 'error' in result ? <div className="mt-3 flex flex-col items-start gap-3" role="status"><p className="m-0 text-sm leading-6 text-text-muted">Не удалось загрузить подробности места. Попробуйте ещё раз.</p><Button variant="secondary" onClick={retry}>Повторить</Button></div> : current.description ? <div className="mt-3 flex flex-col gap-3">{spotDescriptionParagraphs(current.description).map((paragraph, index) => <p key={index} className="m-0 text-sm leading-6 whitespace-pre-line wrap-anywhere">{paragraph}</p>)}</div> : <p className="mt-3 mb-0 text-sm leading-6 text-text-muted">Описание пока не добавлено.</p>}
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-3xl bg-surface p-5 sm:p-6">
            <h1 ref={headingRef} tabIndex={-1} id="place-page-title" className="m-0 text-3xl leading-tight font-extrabold wrap-anywhere outline-none sm:text-4xl">{current.name}</h1>
            <p className="mt-3 mb-0 text-sm leading-6 text-text-muted">{cityName}{current.area ? `, ${current.area}` : ''}</p>
            <Button variant="strong" className="mt-5" onClick={() => onMap(current)}>Показать на карте</Button>
          </div>
          <section className="rounded-3xl bg-surface p-5 sm:p-6" aria-labelledby="place-fish-title">
            <h2 id="place-fish-title" className="m-0 text-xl font-extrabold">Какая рыба встречается</h2>
            {!result ? <p className="mt-3 mb-0 text-sm text-text-muted">Загружаем сведения…</p> : 'error' in result ? <p className="mt-3 mb-0 text-sm text-text-muted">Сведения не загрузились.</p> : current.species?.length ? <div className="mt-4 flex flex-wrap gap-2">{current.species.map((fish) => <Badge key={fish.id} icon={fishIcon}>{fish.name}</Badge>)}</div> : <p className="mt-3 mb-0 text-sm text-text-muted">Виды рыб пока не указаны.</p>}
          </section>
          <section className="rounded-3xl bg-surface p-5 sm:p-6" aria-labelledby="place-methods-title">
            <h2 id="place-methods-title" className="m-0 text-xl font-extrabold">Способы ловли</h2>
            {!result ? <p className="mt-3 mb-0 text-sm text-text-muted">Загружаем сведения…</p> : 'error' in result ? <p className="mt-3 mb-0 text-sm text-text-muted">Сведения не загрузились.</p> : current.methods?.length ? <div className="mt-4 flex flex-wrap gap-2">{current.methods.map((method) => <Badge key={method}>{method}</Badge>)}</div> : <p className="mt-3 mb-0 text-sm text-text-muted">Способы ловли пока не указаны.</p>}
            {current.aliases?.length ? <><h3 className="mt-5 mb-0 text-base font-extrabold">Другие названия</h3><p className="mt-2 mb-0 text-sm leading-6 wrap-anywhere">{current.aliases.join(', ')}</p></> : null}
            {current.coordinates && <><h3 className="mt-5 mb-0 text-base font-extrabold">Координаты места</h3><p className="mt-2 mb-0 text-sm leading-6 text-text-muted tabular-nums">{current.coordinates[1]}, {current.coordinates[0]}</p></>}
          </section>
        </div>
      </div>
    </section>
  )
}
