import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { filterTackle, formatTackleDate, getFarpostListingUrl, initialTackleFilters } from './tackle.ts'
import { loadTackleListings, parseTackleListings } from './tackle-api.ts'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
const sourceUrl = 'https://www.farpost.ru/vladivostok/sport/fish/rod-123.html'
const listing = { id: 123, category: { id: 1, name: 'Удилища' }, title: 'Удилище', url: sourceUrl, price_from_rub: 3000, image_url: 'https://static.baza.farpost.ru/v/123_default', price_updated_at: '2026-11-10T12:00:00Z', notes: [] }

test('поиск и границы цены работают совместно; сортировка не меняет исходный массив', () => {
  const items = [
    { id: 'rod', title: 'Удилище', price: 11000 },
    { id: 'snap', title: 'Вертлюг', price: 600, seller: { name: 'Клёв' } },
    { id: 'unknown', title: 'Снасти' },
  ]
  const filter = (changes) => filterTackle(items, { ...initialTackleFilters, ...changes }).map(({ id }) => id)
  assert.deepEqual(filter({ query: ' КЛЕВ ', minPrice: '600', maxPrice: '600' }), ['snap'])
  assert.deepEqual(filter({ query: 'УДИЛИЩЕ', maxPrice: '600' }), [])
  assert.deepEqual(filter({ maxPrice: '0' }), [])
  assert.deepEqual(filter({ minPrice: '900', maxPrice: '600' }), [])
  assert.deepEqual(filter({ sort: 'price-asc' }), ['snap', 'rod', 'unknown'])
  assert.deepEqual(filter({ sort: 'price-desc' }), ['rod', 'snap', 'unknown'])
  assert.deepEqual(filter({}), ['rod', 'snap', 'unknown'])
  assert.deepEqual(items.map(({ id }) => id), ['rod', 'snap', 'unknown'])
})

test('неизвестные даты и небезопасные ссылки не выдаются за данные объявления', () => {
  assert.match(formatTackleDate('2026-11-10'), /10 ноября 2026/)
  for (const date of [undefined, 'no date', '2026-02-30', '2026-99-99']) assert.equal(formatTackleDate(date), undefined)
  assert.equal(getFarpostListingUrl(sourceUrl), sourceUrl)
  for (const url of [undefined, 'javascript:alert(1)', 'https://farpost.ru.evil.com/vladivostok/sport/fish/rod-123.html', 'https://www.farpost.ru/', sourceUrl.replace('https:', 'http:'), sourceUrl.replace('www.', 'user:password@www.')]) {
    assert.equal(getFarpostListingUrl(url), undefined)
  }
})

test('маппер сохраняет цену и фото, не выдаёт дату обновления цены за публикацию и не придумывает продавца', () => {
  const [mapped] = parseTackleListings([listing])
  assert.equal(mapped.id, '123')
  assert.equal(mapped.title, 'Удилище')
  assert.equal(mapped.sourceUrl, sourceUrl)
  assert.equal(mapped.price, 3000)
  assert.deepEqual(mapped.images, [listing.image_url])
  assert.equal(mapped.seller, undefined)
  assert.equal(mapped.category, undefined)
  assert.equal(mapped.publishedOn, undefined)
  const [missing] = parseTackleListings([{ ...listing, price_from_rub: null, image_url: null }])
  assert.equal(missing.price, undefined)
  assert.equal(missing.seller, undefined)
  assert.deepEqual(missing.images, [])
  assert.equal(parseTackleListings([{ ...listing, price_from_rub: 0 }])[0].price, 0)
  const [unsafe] = parseTackleListings([{ ...listing, url: 'javascript:alert(1)', image_url: 'javascript:alert(1)' }])
  assert.equal(unsafe.sourceUrl, undefined)
  assert.deepEqual(unsafe.images, [])
  assert.deepEqual(parseTackleListings([{ ...listing, image_url: '//evil.com/image' }])[0].images, [])
})

test('запрашивает каталог БД с limit и сигналом отмены; не заменяет ошибки моками', async () => {
  const signal = new AbortController().signal
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/tackle?limit=10')
    assert.equal(options.signal, signal)
    assert.equal(options.headers.Accept, 'application/json')
    return new Response(JSON.stringify([listing]))
  }
  assert.equal((await loadTackleListings(10, '/api/', signal))[0].price, 3000)
  for (const limit of [0, 101, 1.5, NaN]) await assert.rejects(loadTackleListings(limit, '/api', signal))
  globalThis.fetch = async () => new Response('[]')
  assert.deepEqual(await loadTackleListings(10, '/api', signal), [])
  globalThis.fetch = async () => new Response(null, { status: 502 })
  await assert.rejects(loadTackleListings(10, '/api', signal), /502/)
  globalThis.fetch = async () => { throw new DOMException('Cancelled', 'AbortError') }
  await assert.rejects(loadTackleListings(10, '/api', signal), { name: 'AbortError' })
})

test('отклоняет повреждённые ответы и повторные ID', () => {
  for (const data of [null, {}, [null], [listing, listing]]) assert.throws(() => parseTackleListings(data))
  for (const change of [{ id: '123' }, { id: 0 }, { id: -1 }, { id: 1.5 }, { id: NaN }, { id: Number.MAX_SAFE_INTEGER + 1 }, { title: '' }, { url: null }, { price_from_rub: '3000' }, { price_from_rub: -1 }, { price_from_rub: Infinity }, { image_url: [5] }]) {
    assert.throws(() => parseTackleListings([{ ...listing, ...change }]))
  }
})

test('каталог показывает объявления API, состояния и отсутствие необязательных данных', async () => {
  const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' })
  try {
    const { TackleCatalog } = await server.ssrLoadModule('/src/features/tackle/TackleCatalog.tsx')
    const { TackleCard } = await server.ssrLoadModule('/src/features/tackle/TackleCard.tsx')
    const { TackleSection } = await server.ssrLoadModule('/src/features/tackle/TackleSection.tsx')
    const state = { status: 'ready', listings: parseTackleListings([listing]) }
    const html = renderToStaticMarkup(createElement(TackleCatalog, { state, onRetry() {} }))
    assert.equal((html.match(/<article /g) ?? []).length, 1)
    assert.equal((html.match(/target="_blank"/g) ?? []).length, 1)
    assert.match(html, new RegExp(`href="${sourceUrl}"`))
    assert.match(html, /3\s*000\s*₽/)
    assert.doesNotMatch(html, /Демонстрационные данные|Найдено:|Все категории|Удилища|Катушки|Приманки|Оснастка|Сначала новые/)
    assert.match(html, /По умолчанию/)
    for (const [state, expected] of [
      [{ status: 'loading' }, /Загружаем снасти/],
      [{ status: 'error' }, /Не удалось загрузить объявления/],
      [{ status: 'ready', listings: [] }, /Объявлений пока нет/],
    ]) assert.match(renderToStaticMarkup(createElement(TackleCatalog, { state, onRetry() {} })), expected)
    assert.match(renderToStaticMarkup(createElement(TackleCatalog, { state: { status: 'error' }, onRetry() {} })), /Повторить/)
    assert.match(renderToStaticMarkup(createElement(TackleSection)), /Загружаем снасти/)
    const [sparse] = parseTackleListings([{ ...listing, price_from_rub: null, image_url: null, url: 'javascript:alert(1)' }])
    const missing = renderToStaticMarkup(createElement(TackleCard, { listing: sparse }))
    for (const text of [/Фото пока нет/, /Цена не указана/, /Дата публикации неизвестна/, /Ссылка на объявление пока недоступна/]) assert.match(missing, text)
    assert.doesNotMatch(missing, /href=|Частное лицо|Магазин/)
  } finally { await server.close() }
})
