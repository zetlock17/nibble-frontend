import { useEffect, useRef, useState } from 'react'
import arrowIcon from '@/assets/icons/actions/arrow_up.svg'
import calendarIcon from '@/assets/icons/decorative/calendar.svg'
import type { Fish } from './fish'

const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export function FishDetails({ fish, onBack }: { fish: Fish; onBack: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [failedImage, setFailedImage] = useState<string>()
  const details = fish.details

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  return (
    <section className="w-full min-w-0 pb-6" aria-labelledby="fish-details-title">
      <button type="button" onClick={onBack} className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-sm border-0 bg-transparent p-0 text-sm font-bold text-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <img src={arrowIcon} alt="" className="size-4 -rotate-90" />Справочник рыб
      </button>
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-3xl bg-accent-soft sm:min-h-80">
            {fish.image && failedImage !== fish.image ? (
              <img src={fish.image} alt={fish.name} className="max-h-96 w-full object-contain mix-blend-multiply" onError={() => setFailedImage(fish.image)} />
            ) : <p className="m-0 p-6 text-sm text-text-muted">Фото пока нет</p>}
          </div>
          <section className="rounded-3xl bg-surface p-5 sm:p-6 lg:flex-1" aria-labelledby="fish-about-title">
            <h2 id="fish-about-title" className="m-0 text-xl font-extrabold">О рыбе</h2>
            <p className={`mt-3 mb-0 text-sm leading-6 ${details?.description ? '' : 'text-text-muted'}`}>{details?.description || 'Подробное описание пока не добавлено.'}</p>
            {details?.identification && <><h3 className="mt-5 mb-0 text-base font-extrabold">Как узнать</h3><p className="mt-2 mb-0 text-sm leading-6">{details.identification}</p></>}
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-3xl bg-surface p-5 sm:p-6">
            <h1 ref={headingRef} tabIndex={-1} id="fish-details-title" className="m-0 text-3xl leading-tight font-extrabold outline-none sm:text-4xl">{fish.name}</h1>
            <p className="mt-2 mb-0 text-sm text-text-muted">{details?.latinName || 'Латинское название не указано'}</p>
            <p className="mt-5 mb-0 text-base leading-7">{fish.description || 'Краткое описание пока не добавлено.'}</p>
          </div>
          <section className="rounded-3xl bg-surface p-5 sm:p-6" aria-labelledby="fish-season-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="fish-season-title" className="m-0 text-xl font-extrabold">Период ловли</h2>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-focus"><img src={calendarIcon} alt="" className="size-4" />{fish.period || 'Неизвестен'}</span>
            </div>
            {fish.catchMonths?.length ? (
              <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Месяцы ловли">
                {months.map((month, index) => {
                  const active = fish.catchMonths?.includes(index + 1)
                  return <span key={month} aria-label={`${month}: ${active ? 'период ловли' : 'не входит в период ловли'}`} className={`rounded-xl px-1 py-2 text-center text-xs font-semibold ${active ? 'bg-focus text-surface' : 'bg-search text-text-muted'}`}>{month}</span>
                })}
              </div>
            ) : <p className="mt-4 mb-0 text-sm leading-6 text-text-muted">Месяцы ловли пока не указаны.</p>}
          </section>
          {details ? (
            <>
              {details.aliases?.length ? <section className="rounded-3xl bg-surface p-5 sm:p-6"><h2 className="m-0 text-xl font-extrabold">Другие названия</h2><p className="mt-3 mb-0 text-sm leading-6">{details.aliases.join(', ')}</p></section> : null}
              <section className="rounded-3xl bg-surface p-5 sm:p-6 lg:flex-1" aria-labelledby="fish-size-title">
                <h2 id="fish-size-title" className="m-0 text-xl font-extrabold">Размеры</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-search p-4"><p className="m-0 text-xs text-text-muted">Длина</p><p className="mt-1 mb-0 text-xl font-extrabold">{details.typicalLengthCm != null ? `${details.typicalLengthCm} см` : 'Не указана'}</p></div>
                  <div className="rounded-2xl bg-search p-4"><p className="m-0 text-xs text-text-muted">Вес</p><p className="mt-1 mb-0 text-xl font-extrabold">{details.typicalWeightG != null ? `${details.typicalWeightG} г` : 'Не указан'}</p></div>
                </div>
                <p className="mt-3 mb-0 text-xs leading-5 text-text-muted">Пример для оформления карточки, не справочные значения.</p>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
