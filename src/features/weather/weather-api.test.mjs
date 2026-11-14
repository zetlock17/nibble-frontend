import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadWeather, parseWeather, WeatherNotFoundError } from './weather-api.ts'

const response = {
  name: 'Владивосток', city_id: 1, spot_id: null, fetched_at: '2026-11-14T01:26:11Z',
  current: { temp_c: 5.1, condition: 'clear', wind_dir: 'С', wind_speed_ms: 5.8 },
  days: [{ temp_c: 7.2, condition: 'cloudy', forecast_date: '2026-11-14' }],
}

test('разбирает шесть состояний и русское направление ветра', () => {
  const conditions = { clear: 'clear-day', partly_cloudy: 'partly-cloudy-day', cloudy: 'cloudy', rain: 'rain', snow: 'snow', fog: 'fog' }
  for (const [input, expected] of Object.entries(conditions)) {
    const result = parseWeather({ ...response, current: { ...response.current, condition: input } }, { cityId: 1 })
    assert.equal(result.current.condition, expected)
    assert.equal(result.current.wind.direction, 'С')
  }
})

test('сохраняет частичные данные, отбрасывает неверные и повторные даты', () => {
  const result = parseWeather({ ...response, current: { temp_c: null, condition: 'new', wind_dir: 'SW', wind_speed_ms: -1 }, fetched_at: null,
    days: [response.days[0], response.days[0], { ...response.days[0], forecast_date: '2026-02-30' }, { ...response.days[0], forecast_date: '2026-11-13' }] }, { cityId: 1 })
  assert.deepEqual(result.current, { temperatureC: null, condition: null, wind: { direction: 'ЮЗ', speedMs: null } })
  assert.equal(result.updatedAt, null)
  assert.deepEqual(result.days.map((day) => day.date), ['2026-11-13', '2026-11-14'])
  assert.equal(parseWeather({ ...response, current: null, days: [] }, { cityId: 1 }).current, null)
  assert.throws(() => parseWeather(response, { spotId: 1 }))
})

test('передаёт один идентификатор и различает 404 и другие ошибки', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async (url) => {
      assert.equal(url, '/api/weather?spot_id=8')
      return new Response(JSON.stringify({ ...response, city_id: null, spot_id: 8 }), { status: 200 })
    }
    assert.equal((await loadWeather({ spotId: 8 }, '/api/', new AbortController().signal)).location.name, 'Владивосток')
    globalThis.fetch = async () => new Response(null, { status: 404 })
    await assert.rejects(loadWeather({ cityId: 1 }, '/api', new AbortController().signal), WeatherNotFoundError)
    globalThis.fetch = async () => new Response(null, { status: 500 })
    await assert.rejects(loadWeather({ cityId: 1 }, '/api', new AbortController().signal), /500/)
  } finally {
    globalThis.fetch = original
  }
})
