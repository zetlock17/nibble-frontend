import { useState } from 'react'
import externalIcon from '@/assets/icons/social/external.svg'
import rodIcon from '@/assets/icons/fishing/rod.svg'
import { formatTackleDate, getFarpostListingUrl, type TackleListing } from './tackle'

const priceFormat = new Intl.NumberFormat('ru', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })

export function TackleCard({ listing }: { listing: TackleListing }) {
  const [failedImage, setFailedImage] = useState<string>()
  const url = getFarpostListingUrl(listing.sourceUrl)
  const date = formatTackleDate(listing.publishedOn)
  const price = listing.price !== undefined && Number.isFinite(listing.price) && listing.price >= 0
    ? priceFormat.format(listing.price) : 'Цена не указана'

  return (
    <article className="flex min-w-0 flex-col rounded-3xl bg-surface p-3 lg:p-4">
      <div className="flex aspect-3/2 items-center justify-center overflow-hidden rounded-2xl bg-search">
        {listing.image && failedImage !== listing.image ? (
          <img className="size-full object-contain" src={listing.image} alt={listing.title} loading="lazy" onError={() => setFailedImage(listing.image)} />
        ) : (
          <div className="flex flex-col items-center gap-3 px-4 py-6 text-text-muted">
            <img className="size-9 opacity-40" src={rodIcon} alt="" />
            <span className="text-sm">Фото пока нет</span>
          </div>
        )}
      </div>
      <p className="mt-4 mb-2 text-2xl leading-8 font-extrabold tabular-nums">{price}</p>
      <h2 className="m-0 text-base leading-6 font-bold wrap-anywhere">{listing.title}</h2>
      <div className="mt-auto pt-4">
        {listing.seller?.name && <p className="mt-0 mb-1 text-sm leading-5 wrap-anywhere">{listing.seller.name}</p>}
        <p className="m-0 text-xs leading-5 text-text-muted">
          {date ? <><span className="sr-only">Опубликовано: </span><time dateTime={listing.publishedOn}>{date}</time></> : 'Дата публикации неизвестна'}
        </p>
        {url ? (
          <a className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-pill bg-accent-soft px-3 py-2 text-sm font-extrabold text-focus no-underline hover:bg-selection" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Открыть на Фарпосте: ${listing.title} (новая вкладка)`}>
            <img className="size-4" src={externalIcon} alt="" />Открыть на Фарпосте
          </a>
        ) : <p className="mt-4 mb-0 flex min-h-11 items-center justify-center rounded-pill bg-search px-3 py-2 text-center text-xs leading-5 text-text-muted">Ссылка на объявление пока недоступна</p>}
      </div>
    </article>
  )
}
