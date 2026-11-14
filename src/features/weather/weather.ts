export const weatherDescriptions = {
  'clear-day': 'Ясно',
  'clear-night': 'Ясная ночь',
  'partly-cloudy-day': 'Переменная облачность',
  'partly-cloudy-night': 'Переменная облачность ночью',
  cloudy: 'Облачно',
  overcast: 'Пасмурно',
  drizzle: 'Морось',
  rain: 'Дождь',
  downpour: 'Ливень',
  'freezing-rain': 'Ледяной дождь',
  thunderstorm: 'Гроза',
  snow: 'Снег',
  sleet: 'Дождь со снегом',
  blizzard: 'Метель',
  hail: 'Град',
  frost: 'Мороз',
  fog: 'Туман',
  haze: 'Дымка',
  wind: 'Ветрено',
} as const

export type WeatherCondition = keyof typeof weatherDescriptions

export type WeatherReading = {
  temperatureC: number | null
  condition: WeatherCondition | null
}

export const windDirections = {
  N: 'С', NE: 'СВ', E: 'В', SE: 'ЮВ',
  S: 'Ю', SW: 'ЮЗ', W: 'З', NW: 'СЗ',
} as const

export type WeatherForecast = {
  location: { name: string; timeZone: string }
  source: { label: string; isDemo: boolean }
  updatedAt: string | null
  current: (WeatherReading & {
    observedAt?: string
    wind: { direction: string | null; speedMs: number | null } | null
  }) | null
  days: (WeatherReading & { date: string })[]
}

export type WeatherState =
  | { status: 'ready'; forecast: WeatherForecast }
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'not-found' }

export function formatTemperature(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—'
  const rounded = Math.round(value)
  return `${rounded > 0 ? '+' : ''}${Object.is(rounded, -0) ? 0 : rounded}°`
}

export function formatForecastDate(date: string, referenceTime: string, timeZone: string) {
  const referenceDate = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone,
  }).format(new Date(referenceTime))
  if (date === referenceDate) return 'Сегодня'

  // Дата прогноза уже относится к городу. UTC сохраняет этот календарный день.
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}
