import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { filterTackle, formatTackleDate, getFarpostListingUrl, initialTackleFilters } from './tackle.ts'

// node --experimental-strip-types --test src/features/tackle/tackle.test.mjs
test('поиск, категория и границы цены работают совместно; сортировка не меняет исходный массив', () => {
  const items = [
    { id: 'rod', title: 'Удилище', category: 'rods', price: 11000, publishedOn: '2026-11-10' },
    { id: 'snap', title: 'Вертлюг', category: 'rigs', price: 600, publishedOn: '2026-11-09', seller: { name: 'Клёв' } },
    { id: 'unknown', title: 'Снасти' },
  ]
  const filter = (changes) => filterTackle(items, { ...initialTackleFilters, ...changes }).map(({ id }) => id)
  assert.deepEqual(filter({ query: ' КЛЕВ ', category: 'rigs', minPrice: '600', maxPrice: '600' }), ['snap'])
  assert.deepEqual(filter({ query: 'УДИЛИЩЕ', category: 'rigs' }), [])
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
  const valid = 'https://www.farpost.ru/vladivostok/sport/fish/rod-123.html'
  assert.equal(getFarpostListingUrl(valid), valid)
  for (const url of [undefined, 'javascript:alert(1)', 'https://farpost.ru.evil.com/vladivostok/sport/fish/rod-123.html', 'https://www.farpost.ru/', valid.replace('https:', 'http:'), valid.replace('www.', 'user:password@www.')]) {
    assert.equal(getFarpostListingUrl(url), undefined)
  }
})

test('каталог показывает моки, состояния данных и карточку без необязательных полей', async () => {
  const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' })
  try {
    const { TackleCatalog } = await server.ssrLoadModule('/src/features/tackle/TackleCatalog.tsx')
    const { TackleCard } = await server.ssrLoadModule('/src/features/tackle/TackleCard.tsx')
    const { tackleMock } = await server.ssrLoadModule('/src/mocks/tackle/listings.ts')
    const html = renderToStaticMarkup(createElement(TackleCatalog, { state: tackleMock }))
    assert.equal((html.match(/<article /g) ?? []).length, 7)
    assert.equal((html.match(/target="_blank"/g) ?? []).length, 7)
    assert.doesNotMatch(html, /Демонстрационные данные|Найдено:|type="radio"/)
    assert.equal((html.match(/<select/g) ?? []).length, 2)
    assert.match(html, /Все категории/)
    for (const [state, expected] of [
      [{ status: 'loading' }, /Загружаем снасти/],
      [{ status: 'error' }, /Не удалось загрузить объявления/],
      [{ status: 'ready', listings: [], demo: false }, /Объявлений пока нет/],
    ]) assert.match(renderToStaticMarkup(createElement(TackleCatalog, { state })), expected)
    const missing = renderToStaticMarkup(createElement(TackleCard, { listing: { id: 'missing', title: 'Без данных', sourceUrl: 'javascript:alert(1)' } }))
    for (const text of [/Фото пока нет/, /Цена не указана/, /Дата публикации неизвестна/, /Ссылка на объявление пока недоступна/]) assert.match(missing, text)
    assert.doesNotMatch(missing, /href=|Частное лицо|Магазин/)
  } finally { await server.close() }
})
