import assert from 'node:assert/strict'
import { after, afterEach, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' })
const { loadSearch, parseSearchResults, scheduleSearch } = await server.ssrLoadModule('/src/components/layout/header/search-api.ts')
after(() => server.close())
const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
const spot = { id: 12, city_id: 1, name: 'Бухта Аякс', area: null, lat: '43.029808', lon: '131.940298', photo_url: null }
const fish = { id: 4, name: 'Камбала', latin_name: null, short_description: 'Описание', image_url: '' }
const data = { spots: [spot], species: [fish] }
const response = (body) => new Response(JSON.stringify(body))
const flush = () => new Promise(setImmediate)

test('кодирует q без добавления параметров из строки и передаёт город, limit и отмену', async () => {
  const signal = new AbortController().signal
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url, 'https://example.com')
    assert.equal(parsed.pathname, '/api/search')
    assert.equal(parsed.searchParams.get('q'), 'Рыба & city_id=9 # +?')
    assert.equal(parsed.searchParams.get('city_id'), '1')
    assert.equal(parsed.searchParams.get('limit'), '5')
    assert.equal(parsed.searchParams.size, 3)
    assert.equal(options.signal, signal)
    return response(data)
  }
  const result = await loadSearch('  Рыба & city_id=9 # +?  ', 1, 5, '/api/', signal)
  assert.equal(result.spots[0].id, '12')
  assert.deepEqual(result.spots[0].coordinates, [131.940298, 43.029808])
  assert.equal(result.spots[0].species, undefined)
  assert.equal(result.species[0].id, '4')
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url, 'https://example.com').searchParams.has('city_id'), false)
    return response({ spots: [], species: [] })
  }
  assert.deepEqual(await loadSearch('Ая', undefined, 5, '/api', signal), { spots: [], species: [] })
})

test('проверяет ограничения запроса, ответы API и не подменяет ошибки', async () => {
  const signal = new AbortController().signal
  for (const [query, cityId, limit] of [[' ', 1, 5], ['А', 1, 5], ['а'.repeat(101), 1, 5], ['Ая', 0, 5], ['Ая', 1, 0], ['Ая', 1, 21]]) {
    await assert.rejects(loadSearch(query, cityId, limit, '/api', signal))
  }
  for (const body of [null, {}, { ...data, species: null }, { ...data, spots: [{ ...spot, city_id: 2 }] }, { ...data, species: [{ ...fish, id: '4' }] }, { ...data, species: [fish, fish] }, { ...data, spots: [spot, spot] }]) {
    assert.throws(() => parseSearchResults(body, 1))
  }
  globalThis.fetch = async () => new Response(null, { status: 503 })
  await assert.rejects(loadSearch('Ая', 1, 5, '/api', signal), /503/)
})

test('debounce ждёт 300 мс и отменяет предыдущий таймер до запроса', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  let calls = 0
  const results = []
  globalThis.fetch = async () => { calls++; return response(data) }
  const cancelFirst = scheduleSearch('Ая', 1, '/api', (result) => results.push(result))
  context.mock.timers.tick(299)
  assert.equal(calls, 0)
  cancelFirst()
  const cancelSecond = scheduleSearch('Аякс', 1, '/api', (result) => results.push(result))
  context.mock.timers.tick(299)
  assert.equal(calls, 0)
  context.mock.timers.tick(1)
  await flush()
  assert.equal(calls, 1)
  assert.equal(results.length, 1)
  assert.equal(results[0].data.spots[0].name, 'Бухта Аякс')
  cancelSecond()
})

test('отменяет запрос в полёте и игнорирует поздний ответ даже без поддержки отмены сервером', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const pending = []
  const results = []
  globalThis.fetch = (url, options) => new Promise((resolve) => pending.push({ resolve, signal: options.signal, url }))
  const cancelFirst = scheduleSearch('Ая', 1, '/api', (result) => results.push(result))
  context.mock.timers.tick(300)
  assert.equal(pending.length, 1)
  cancelFirst()
  assert.equal(pending[0].signal.aborted, true)
  const cancelSecond = scheduleSearch('Ка', 2, '/api', (result) => results.push(result))
  context.mock.timers.tick(300)
  pending[1].resolve(response({ spots: [], species: [fish] }))
  await flush()
  pending[0].resolve(response(data))
  await flush()
  assert.equal(results.length, 1)
  assert.deepEqual(results[0].data.spots, [])
  assert.equal(results[0].data.species[0].id, '4')
  cancelSecond()
})

test('передаёт активную ошибку, но не показывает ошибку отменённого поиска', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const results = []
  globalThis.fetch = async () => new Response(null, { status: 502 })
  const cancel = scheduleSearch('Ая', 1, '/api', (result) => results.push(result))
  context.mock.timers.tick(300)
  await flush()
  assert.deepEqual(results, [{ error: true }])
  cancel()
  const cancelNext = scheduleSearch('Ая', 1, '/api', (result) => results.push(result))
  context.mock.timers.tick(300)
  cancelNext()
  await flush()
  assert.equal(results.length, 1)
})

test('результаты разделены на места и виды, переходы открывают конкретный вид и спот', async () => {
  const { HeaderSearch, HeaderSearchResults } = await server.ssrLoadModule('/src/components/layout/header/HeaderSearch.tsx')
  const { HomePage } = await server.ssrLoadModule('/src/pages/home/HomePage.tsx')
  const parsed = parseSearchResults(data, 1)
  const options = [
    { key: 'spot-12', name: 'Бухта Аякс', target: { kind: 'spot', place: parsed.spots[0] } },
    { key: 'species-4', name: 'Камбала', target: { kind: 'species', id: '4' } },
  ]
  const html = renderToStaticMarkup(createElement(HeaderSearchResults, { id: 'results', options, activeKey: 'species-4', onChoose() {} }))
  assert.match(html, /role="listbox"/)
  assert.match(html, /role="group" aria-label="Места"/)
  assert.match(html, /role="group" aria-label="Рыбы"/)
  assert.match(html, /id="results-species-4"[^>]*aria-selected="true"/)
  assert.match(html, /Бухта Аякс/)
  assert.match(html, /Камбала/)
  const input = renderToStaticMarkup(createElement(HeaderSearch, { cityId: 1, onNavigate() {} }))
  assert.match(input, /role="combobox"/)
  assert.match(input, /aria-expanded="false"/)
  assert.match(input, /maxLength="100"/)
  const props = { city: { id: 1, name: 'Владивосток', coordinates: [131.9, 43], timeZone: 'Asia/Vladivostok' }, onSectionChange() {}, onAddCatch() {}, catchOrigin: 'home', user: null, onSignOut() {} }
  const speciesPage = renderToStaticMarkup(createElement(HomePage, { ...props, section: 'fish', searchNavigation: { target: options[1].target, revision: 1 } }))
  assert.match(speciesPage, /Загружаем рыб/)
  assert.doesNotMatch(speciesPage, /placeholder="Найти рыбу"/)
  const map = renderToStaticMarkup(createElement(HomePage, { ...props, section: 'places', searchNavigation: { target: options[0].target, revision: 2 } }))
  assert.match(map, /aria-label="Подробности места: Бухта Аякс"/)
  assert.match(map, /Загружаем подробности места/)
})
