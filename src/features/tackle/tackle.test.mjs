import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { filterTackle, formatTackleDate, getFarpostListingUrl, initialTackleFilters } from './tackle.ts'
import { loadFarpostListings, parseFarpostListings } from './tackle-api.ts'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
const sourceUrl = 'https://www.farpost.ru/vladivostok/sport/fish/rod-123.html'
const listing = { farpost_id: '123', title: 'Удилище', url: sourceUrl, price_rub: 3000, photo_urls: ['https://static.baza.farpost.ru/v/123_default'], seller_name: 'Клёв' }

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

test('маппер сохраняет цену и фото, не придумывает категории, даты и продавца', () => {
  const [mapped] = parseFarpostListings([listing])
  assert.equal(mapped.id, 'farpost-123')
  assert.equal(mapped.title, 'Удилище')
  assert.equal(mapped.sourceUrl, sourceUrl)
  assert.equal(mapped.price, 3000)
  assert.deepEqual(mapped.images, listing.photo_urls)
  assert.deepEqual(mapped.seller, { name: 'Клёв' })
  assert.equal(mapped.category, undefined)
  assert.equal(mapped.publishedOn, undefined)
  const [missing] = parseFarpostListings([{ ...listing, price_rub: null, price_raw: 'Договорная', seller_name: null, photo_urls: [] }])
  assert.equal(missing.price, undefined)
  assert.equal(missing.seller, undefined)
  assert.deepEqual(missing.images, [])
  assert.equal(parseFarpostListings([{ ...listing, price_rub: 0 }])[0].price, 0)
  const [unsafe] = parseFarpostListings([{ ...listing, url: 'javascript:alert(1)', photo_urls: ['javascript:alert(1)', '//evil.com/image', ...listing.photo_urls, ...listing.photo_urls] }])
  assert.equal(unsafe.sourceUrl, undefined)
  assert.deepEqual(unsafe.images, listing.photo_urls)
})

test('запрашивает агрегатор с limit и сигналом отмены; не заменяет ошибки моками', async () => {
  const signal = new AbortController().signal
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/aggregator/farpost?limit=10')
    assert.equal(options.signal, signal)
    assert.equal(options.headers.Accept, 'application/json')
    return new Response(JSON.stringify([listing]))
  }
  assert.equal((await loadFarpostListings(10, '/api/', signal))[0].price, 3000)
  for (const limit of [0, 51, 1.5, NaN]) await assert.rejects(loadFarpostListings(limit, '/api', signal))
  globalThis.fetch = async () => new Response('[]')
  assert.deepEqual(await loadFarpostListings(10, '/api', signal), [])
  globalThis.fetch = async () => new Response(null, { status: 502 })
  await assert.rejects(loadFarpostListings(10, '/api', signal), /502/)
  globalThis.fetch = async () => { throw new DOMException('Cancelled', 'AbortError') }
  await assert.rejects(loadFarpostListings(10, '/api', signal), { name: 'AbortError' })
})

test('отклоняет повреждённые ответы и повторные ID', () => {
  for (const data of [null, {}, [null], [listing, listing]]) assert.throws(() => parseFarpostListings(data))
  for (const change of [{ farpost_id: 123 }, { farpost_id: '' }, { title: '' }, { url: null }, { price_rub: '3000' }, { price_rub: -1 }, { price_rub: Infinity }, { photo_urls: null }, { photo_urls: [5] }, { seller_name: {} }]) {
    assert.throws(() => parseFarpostListings([{ ...listing, ...change }]))
  }
})

test('каталог показывает объявления API, состояния и отсутствие необязательных данных', async () => {
  const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' })
  try {
    const { TackleCatalog } = await server.ssrLoadModule('/src/features/tackle/TackleCatalog.tsx')
    const { TackleCard } = await server.ssrLoadModule('/src/features/tackle/TackleCard.tsx')
    const { TackleSection } = await server.ssrLoadModule('/src/features/tackle/TackleSection.tsx')
    const state = { status: 'ready', listings: parseFarpostListings([listing]) }
    const html = renderToStaticMarkup(createElement(TackleCatalog, { state, onRetry() {} }))
    assert.equal((html.match(/<article /g) ?? []).length, 1)
    assert.equal((html.match(/target="_blank"/g) ?? []).length, 1)
    assert.match(html, new RegExp(`href="${sourceUrl}"`))
    assert.match(html, /3\s*000\s*₽/)
    assert.match(html, /Клёв/)
    assert.doesNotMatch(html, /Демонстрационные данные|Найдено:|Все категории|Удилища|Катушки|Приманки|Оснастка|Сначала новые/)
    assert.match(html, /Порядок Фарпоста/)
    for (const [state, expected] of [
      [{ status: 'loading' }, /Загружаем снасти/],
      [{ status: 'error' }, /Не удалось загрузить объявления/],
      [{ status: 'ready', listings: [] }, /Объявлений пока нет/],
    ]) assert.match(renderToStaticMarkup(createElement(TackleCatalog, { state, onRetry() {} })), expected)
    assert.match(renderToStaticMarkup(createElement(TackleCatalog, { state: { status: 'error' }, onRetry() {} })), /Повторить/)
    assert.match(renderToStaticMarkup(createElement(TackleSection)), /Загружаем снасти/)
    const [sparse] = parseFarpostListings([{ ...listing, price_rub: null, seller_name: null, photo_urls: [], url: 'javascript:alert(1)' }])
    const missing = renderToStaticMarkup(createElement(TackleCard, { listing: sparse }))
    for (const text of [/Фото пока нет/, /Цена не указана/, /Дата публикации неизвестна/, /Ссылка на объявление пока недоступна/]) assert.match(missing, text)
    assert.doesNotMatch(missing, /href=|Частное лицо|Магазин/)
  } finally { await server.close() }
})
