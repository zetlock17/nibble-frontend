import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatForecastDate, formatTemperature } from './weather.ts'

// node --experimental-strip-types --test src/features/weather/weather.test.mjs
test('температура учитывает знак, округление и отсутствие данных', () => {
  assert.equal(formatTemperature(18), '+18°')
  assert.equal(formatTemperature(-2.6), '-3°')
  assert.equal(formatTemperature(-0.2), '0°')
  assert.equal(formatTemperature(null), '—')
  assert.equal(formatTemperature(NaN), '—')
})

test('сегодня определяется в часовом поясе города, даты прогноза не сдвигаются', () => {
  assert.equal(formatForecastDate('2026-05-13', '2026-05-12T16:00:00Z', 'Asia/Vladivostok'), 'Сегодня')
  assert.match(formatForecastDate('2026-05-14', '2026-05-12T16:00:00Z', 'Asia/Vladivostok'), /чт.*14/)
  assert.match(formatForecastDate('2026-05-14', '2026-05-12T16:00:00Z', 'Pacific/Kiritimati'), /чт.*14/)
})
