import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadCities, parseCities } from './cities.ts'

const city = { id: 1, name: 'Владивосток', lat: '43.115536', lon: '131.885485', timezone: 'Asia/Vladivostok' }

test('разбирает города и проверяет координаты, идентификаторы и часовой пояс', () => {
  assert.deepEqual(parseCities([city]), [{ id: 1, name: 'Владивосток', coordinates: [131.885485, 43.115536], timeZone: 'Asia/Vladivostok' }])
  assert.deepEqual(parseCities([]), [])
  for (const change of [{ id: 0 }, { name: ' ' }, { lat: '91' }, { lon: '' }, { timezone: 'unknown' }]) {
    assert.throws(() => parseCities([{ ...city, ...change }]))
  }
  assert.throws(() => parseCities([city, city]))
  assert.throws(() => parseCities({}))
})

test('загружает список и не подменяет ошибку сервера', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async (url) => {
      assert.equal(url, '/api/cities')
      return new Response(JSON.stringify([city]), { status: 200 })
    }
    assert.equal((await loadCities('/api/', new AbortController().signal))[0].id, 1)
    globalThis.fetch = async () => new Response(null, { status: 503 })
    await assert.rejects(loadCities('/api', new AbortController().signal), /503/)
  } finally { globalThis.fetch = original }
})
