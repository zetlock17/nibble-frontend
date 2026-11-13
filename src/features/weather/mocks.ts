import type { WeatherState } from './weather'

// Фиксированный пример по макету. Даты и показатели не являются реальным прогнозом.
export const weatherMock: WeatherState = {
  status: 'ready',
  forecast: {
    location: { name: 'Владивосток', timeZone: 'Asia/Vladivostok' },
    source: { label: 'Демонстрационный прогноз', isDemo: true },
    updatedAt: '2026-05-12T05:40:00+10:00',
    current: {
      observedAt: '2026-05-12T05:40:00+10:00',
      temperatureC: 18,
      condition: 'partly-cloudy-day',
      wind: { direction: 'SW', speedMs: 4 },
    },
    days: [
      { date: '2026-05-12', temperatureC: 18, condition: 'partly-cloudy-day' },
      { date: '2026-05-13', temperatureC: 12, condition: 'cloudy' },
      { date: '2026-05-14', temperatureC: 6, condition: 'rain' },
      { date: '2026-05-15', temperatureC: 0, condition: 'clear-day' },
      { date: '2026-05-16', temperatureC: -3, condition: 'frost' },
    ],
  },
}
