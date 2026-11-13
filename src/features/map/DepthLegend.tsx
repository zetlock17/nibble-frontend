import { depthBands, depthColor } from './depths'
import type { Depths } from './depths'

const formatDepth = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })

export function DepthLegend({ data }: { data: Depths }) {
  const bands = depthBands(data)

  return (
    <div className="w-full px-3 pt-1.5 pb-2 text-xs leading-4 text-text-muted sm:px-4" role="note" aria-label="Легенда глубин">
      <p className="m-0 mb-2 text-sm">Глубина, м</p>
      <ul className="m-0 flex list-none p-0" aria-label="Диапазоны глубины в метрах">
        {bands.map(({ from, to }, index) => {
          const label = to === null ? `${formatDepth.format(from)}+` : `${formatDepth.format(from)}–${formatDepth.format(to)}`
          return (
            <li key={`${from}:${to}`} className="min-w-0 flex-1 text-center tabular-nums">
              <span aria-hidden="true" className={`mb-1.5 block h-2.5 ${index === 0 ? 'rounded-l-pill' : ''} ${index === bands.length - 1 ? 'rounded-r-pill' : ''} ${depthColor(from).className}`} />
              <span>{label}<span className="sr-only"> м</span></span>
            </li>
          )
        })}
      </ul>
      <p className="m-0 mt-2 text-wrap wrap-anywhere">{data.attribution ?? 'Глубины ориентировочные. Источник не указан.'}</p>
    </div>
  )
}
