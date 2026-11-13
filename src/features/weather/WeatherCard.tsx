import { formatForecastDate, formatTemperature, weatherDescriptions, windDirections } from './weather'
import type { WeatherCondition, WeatherState } from './weather'
import { weatherIcons } from './weather-icons'

type WeatherCardProps = { state: WeatherState }

function WeatherImage({ condition, className }: { condition: WeatherCondition | null; className: string }) {
  return condition ? (
    <img className={`${className} shrink-0 object-contain`} src={weatherIcons[condition]} alt={weatherDescriptions[condition]} />
  ) : (
    <span className={`${className} inline-grid shrink-0 place-items-center`} aria-label="Погодные условия неизвестны">—</span>
  )
}

export function WeatherCard({ state }: WeatherCardProps) {
  const cardClassName = 'rounded-4xl bg-linear-to-br from-weather-start via-weather to-weather-end px-5 py-4 text-surface'

  if (state.status !== 'ready') {
    const messages = {
      loading: 'Загружаем погоду…',
      empty: 'Прогноза для этого места пока нет. Проверьте позже.',
      error: 'Не удалось загрузить погоду. Попробуйте обновить страницу.',
    }
    return (
      <section className={`${cardClassName} flex min-h-44 items-center`} aria-label="Погода" aria-busy={state.status === 'loading'}>
        <p className="m-0 text-sm" role="status">{messages[state.status]}</p>
      </section>
    )
  }

  const { location, current, days, source } = state.forecast
  const referenceTime = source.isDemo ? current.observedAt : new Date().toISOString()
  const wind = current.wind

  return (
    <section aria-label={`Погода, ${location.name}`}>
      <div className={cardClassName}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <h2 className="m-0 min-w-0 text-sm leading-5 font-extrabold wrap-anywhere">{location.name}</h2>
          <p className="m-0 text-xs leading-5">
            {wind?.speedMs != null && Number.isFinite(wind.speedMs)
              ? `Ветер ${wind.direction ? windDirections[wind.direction] + ' ' : ''}${wind.speedMs} м/с`
              : 'Ветер неизвестен'}
          </p>
        </div>

        <div className="mb-2 flex items-center gap-0">
          <span className="text-4xl leading-none font-medium tabular-nums" aria-label={current.temperatureC == null ? 'Температура неизвестна' : undefined}>
            {formatTemperature(current.temperatureC)}
          </span>
          <WeatherImage condition={current.condition} className="size-16" />
        </div>

        {days.length > 0 ? (
          <ul className="m-0 grid list-none grid-cols-5 gap-1 p-0">
            {days.slice(0, 5).map((day) => {
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
      </div>
    </section>
  )
}
