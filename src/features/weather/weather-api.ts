import type { WeatherCondition, WeatherForecast, WeatherReading } from './weather.ts'

const conditions: Record<string, WeatherCondition> = {
  clear: 'clear-day', partly_cloudy: 'partly-cloudy-day', cloudy: 'cloudy',
  rain: 'rain', snow: 'snow', fog: 'fog',
}
const directions: Record<string, string> = {
  N: 'С', NE: 'СВ', E: 'В', SE: 'ЮВ', S: 'Ю', SW: 'ЮЗ', W: 'З', NW: 'СЗ',
  С: 'С', СВ: 'СВ', В: 'В', ЮВ: 'ЮВ', Ю: 'Ю', ЮЗ: 'ЮЗ', З: 'З', СЗ: 'СЗ',
}

type Location = { cityId: number; spotId?: never } | { spotId: number; cityId?: never }
type Reading = WeatherReading & { wind: { direction: string | null; speedMs: number | null } }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function reading(value: unknown): Reading | null {
  if (!record(value)) return null
  const temp = value.temp_c
  const speed = value.wind_speed_ms
  const direction = typeof value.wind_dir === 'string' ? value.wind_dir.trim().toUpperCase() : ''
  const condition = typeof value.condition === 'string' && Object.hasOwn(conditions, value.condition) ? conditions[value.condition] : null
  return {
    temperatureC: typeof temp === 'number' && Number.isFinite(temp) ? temp : null,
    condition,
    wind: { direction: Object.hasOwn(directions, direction) ? directions[direction] : null,
      speedMs: typeof speed === 'number' && Number.isFinite(speed) && speed >= 0 ? speed : null },
  }
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function parseWeather(value: unknown, location: Location): WeatherForecast {
  if (!record(value) || typeof value.name !== 'string' || !value.name.trim() || !Array.isArray(value.days)) throw new Error('Invalid weather response')
  if ('cityId' in location ? value.city_id !== location.cityId || value.spot_id !== null : value.spot_id !== location.spotId || value.city_id !== null) throw new Error('Unexpected weather location')
  const current = reading(value.current)
  const dates = new Set<string>()
  const days = value.days.flatMap((day: unknown) => {
    if (!record(day) || !validDate(day.forecast_date) || dates.has(day.forecast_date)) return []
    const item = reading(day)
    if (!item) return []
    dates.add(day.forecast_date)
    return [{ date: day.forecast_date, temperatureC: item.temperatureC, condition: item.condition }]
  }).sort((a, b) => a.date.localeCompare(b.date))
  const timestamp = typeof value.fetched_at === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value.fetched_at) && Number.isFinite(Date.parse(value.fetched_at)) ? value.fetched_at : null
  return { location: { name: value.name.trim(), timeZone: 'Asia/Vladivostok' }, source: { label: 'Источник неизвестен', isDemo: false }, updatedAt: timestamp, current, days }
}

export class WeatherNotFoundError extends Error {}

export async function loadWeather(location: Location, apiBase: string, signal: AbortSignal): Promise<WeatherForecast> {
  const id = location.cityId ?? location.spotId
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid location ID')
  const params = new URLSearchParams(location.cityId !== undefined ? { city_id: String(id) } : { spot_id: String(id) })
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}/weather?${params}`, { signal, headers: { Accept: 'application/json' } })
  if (response.status === 404) throw new WeatherNotFoundError()
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`)
  return parseWeather(await response.json(), location)
}
