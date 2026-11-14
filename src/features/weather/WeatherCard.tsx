import locationArrow from '@/assets/icons/map/location-arrow.svg'
import { formatForecastDate, formatTemperature, weatherDescriptions } from './weather'
import type { WeatherCondition, WeatherState } from './weather'
import { weatherIcons } from './weather-icons'

type WeatherCardProps = { state: WeatherState; now: number; onRetry: () => void }

function WeatherImage({ condition, className }: { condition: WeatherCondition | null; className: string }) {
  return condition ? (
    <img className={`${className} shrink-0 object-contain`} src={weatherIcons[condition]} alt={weatherDescriptions[condition]} />
  ) : (
    <span className={`${className} inline-grid shrink-0 place-items-center`} aria-label="Погодные условия неизвестны">—</span>
  )
}

export function WeatherCard({ state, now, onRetry }: WeatherCardProps) {
  const cardClassName = 'rounded-4xl bg-linear-to-br from-weather-start via-weather to-weather-end px-5 py-4 text-surface'

  if (state.status !== 'ready') {
    const messages = {
      loading: 'Загружаем погоду…',
      empty: 'Прогноза для этого места пока нет. Проверьте позже.',
      error: 'Не удалось загрузить погоду. Попробуйте ещё раз.',
      'not-found': 'Погода для этого места недоступна.',
    }
    return (
      <section className={`${cardClassName} flex min-h-44 items-center`} aria-label="Погода" aria-busy={state.status === 'loading'}>
        <div role="status">
          <p className="m-0 text-sm">{messages[state.status]}</p>
          {state.status !== 'loading' && <button type="button" onClick={onRetry} className="mt-3 rounded-lg border border-surface bg-transparent px-3 py-1 text-sm text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface">Повторить</button>}
        </div>
      </section>
    )
  }

  const { location, current, days, source, updatedAt } = state.forecast
  const referenceTime = source.isDemo && current?.observedAt ? current.observedAt : new Date(now).toISOString()
  const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: location.timeZone }).format(new Date(referenceTime))
  const upcomingDays = days.filter((day) => day.date >= today).slice(0, 5)
  const wind = current?.wind
  const updatedMs = updatedAt ? Date.parse(updatedAt) : NaN
  const validUpdate = Number.isFinite(updatedMs) && updatedMs <= now
  const stale = validUpdate && now - updatedMs >= 3 * 60 * 60 * 1000
  const updatedLabel = validUpdate
    ? `${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: location.timeZone }).format(updatedMs).replace(/\.$/, '')} ${new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: location.timeZone }).format(updatedMs)}`
    : null

  return (
    <section aria-label={`Погода, ${location.name}`}>
      <div className={cardClassName}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <h2 className="m-0 inline-flex min-w-0 items-center gap-1.5 text-sm leading-5 font-semibold wrap-anywhere">
            <span className="min-w-0">{location.name}</span>
            <img className="size-3 shrink-0 object-contain invert" src={locationArrow} alt="" />
          </h2>
          <div className="relative text-right">
            <p className="m-0 text-xs leading-5">
              {wind?.speedMs != null && Number.isFinite(wind.speedMs)
                ? `Ветер ${wind.direction ? wind.direction + ' ' : ''}${wind.speedMs} м/с`
                : 'Ветер неизвестен'}
            </p>
            <div className="absolute top-full right-0 text-2xs leading-4 font-semibold whitespace-nowrap text-navigation-divider">
              {updatedLabel
                ? <time dateTime={updatedAt ?? undefined} aria-label={`Время обновления: ${updatedLabel}`}>{updatedLabel}</time>
                : 'Время обновления неизвестно'}
            </div>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-0">
          <span className="text-4xl leading-none font-medium tabular-nums" aria-label={current?.temperatureC == null ? 'Температура неизвестна' : undefined}>
            {formatTemperature(current?.temperatureC ?? null)}
          </span>
          <WeatherImage condition={current?.condition ?? null} className="size-16" />
        </div>

        {!current && <p className="m-0 mb-2 text-xs">Текущая погода недоступна.</p>}

        {upcomingDays.length > 0 ? (
          <ul className="m-0 grid list-none grid-cols-5 gap-1 p-0">
            {upcomingDays.map((day) => {
              const label = formatForecastDate(day.date, referenceTime, location.timeZone)
              return (
                <li className="flex min-w-0 flex-col items-center" key={day.date}>
                  <time className="text-2xs leading-4 font-medium whitespace-nowrap first-letter:uppercase" dateTime={day.date}>{label}</time>
                  <WeatherImage condition={day.condition} className="size-9" />
                  <span className="text-sm leading-5 font-extrabold tabular-nums">{formatTemperature(day.temperatureC)}</span>
                </li>
              )
            })}
          </ul>
        ) : <p className="m-0 text-xs">Прогноза на следующие дни пока нет.</p>}
        {stale && <p className="mt-1 mb-0 text-2xs leading-4">Данные могут быть устаревшими. <button type="button" onClick={onRetry} className="rounded-sm border-0 bg-transparent p-0 text-inherit underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface">Обновить</button></p>}
      </div>
    </section>
  )
}
