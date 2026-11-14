import { useEffect, useId, useRef, useState } from 'react'
import arrowIcon from '@/assets/icons/actions/arrow_up.svg'
import type { FishState } from './use-fish'
import { FishLoadingState } from './FishLoadingState'
import { getSeasonalFish } from './seasonal-fish'
import { Button } from '@/components/ui/button/Button'

export function SeasonalFish({ fish, onOpenGuide }: { fish: FishState; onOpenGuide: () => void }) {
  const [date, setDate] = useState(() => new Date())
  const [failedImages, setFailedImages] = useState<string[]>([])
  const selection = getSeasonalFish(fish.fish, date)
  const sourcesRef = useRef<HTMLDialogElement>(null)
  const sourcesTitleId = useId()

  useEffect(() => {
    const timer = window.setInterval(() => setDate(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="flex min-w-0 shrink-0 flex-col gap-4 rounded-4xl bg-surface p-5" aria-label="Что ловят в этом сезоне">
      <div className="flex items-start justify-between gap-4">
        <h2 className="m-0 min-w-0 text-xl leading-7 font-extrabold">Что ловят в этом сезоне</h2>
        <span className="pt-1 text-xs leading-5 text-text-muted capitalize">{selection.month}</span>
      </div>
      <FishLoadingState status={fish.status} onRetry={fish.retry} />
      {fish.status !== 'ready' ? null : selection.fish.length ? (
        <ul className="m-0 grid list-none grid-cols-3 gap-x-4 gap-y-3 p-0">
          {selection.fish.map((item) => (
            <li key={item.id} className="flex min-w-0 flex-col gap-2">
              <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-xl bg-search">
                {item.image && !failedImages.includes(item.image) ? (
                  <img src={item.image} alt="" loading="lazy" className="size-full rounded-xl object-cover object-center" onError={() => setFailedImages((current) => [...current, item.image!])} />
                ) : <span className="text-xs text-text-muted">Нет фото</span>}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="m-0 text-sm leading-5 font-bold">{item.name}</h3>
                <p className="m-0 text-xs leading-5 text-text-muted"><span className="sr-only">Период ловли: </span>{item.period || 'Период не указан'}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="m-0 text-sm leading-6 text-text-muted">{fish.fish.some((item) => !item.catchMonths?.length) ? 'Сезон ловли для части рыб неизвестен. Посмотрите виды в справочнике.' : 'На этот месяц периодов ловли пока нет. Посмотрите виды в справочнике.'}</p>}
      <div className="flex items-center justify-between gap-3">
        <button type="button" aria-haspopup="dialog" onClick={() => sourcesRef.current?.showModal()} className="min-h-8 border-0 bg-transparent p-0 text-xs text-text-muted underline decoration-navigation-divider underline-offset-4 hover:text-text">Источники</button>
        <button type="button" onClick={onOpenGuide} className="inline-flex min-h-8 items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-focus hover:text-primary-strong">
          В справочник
          <img src={arrowIcon} alt="" className="size-5 rotate-90" />
        </button>
      </div>
      <dialog ref={sourcesRef} aria-labelledby={sourcesTitleId} className="m-auto max-h-full w-full max-w-lg overflow-y-auto rounded-4xl border-0 bg-surface p-6 text-text backdrop:bg-text/40">
        <div className="flex flex-col gap-5">
          <h2 id={sourcesTitleId} className="m-0 text-xl font-extrabold">Источники</h2>
          <p className="m-0 text-sm leading-6 text-text-muted">Виды рыб, фотографии и месяцы ловли загружаются из справочника «Клёв». Если месяцы не указаны, сезон ловли неизвестен.</p>
          <Button variant="secondary" className="self-end" onClick={() => sourcesRef.current?.close()}>Закрыть</Button>
        </div>
      </dialog>
    </section>
  )
}
