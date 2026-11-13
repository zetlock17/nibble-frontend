import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { filterFish } from './fish.ts'

// node --experimental-strip-types --test src/features/fish/fish.test.mjs
test('поиск учитывает регистр, пробелы и ё; сезон сочетается с названием', () => {
  const fish = [
    { id: 'perch', name: 'Ёрш', seasons: ['summer'] },
    { id: 'cod', name: 'Треска', seasons: ['winter', 'spring'] },
  ]
  assert.deepEqual(filterFish(fish, '', 'all'), fish)
  assert.deepEqual(filterFish(fish, ' ЕРШ ', 'summer'), [fish[0]])
  assert.deepEqual(filterFish(fish, 'ёрш', 'winter'), [])
  assert.deepEqual(filterFish(fish, '', 'winter'), [fish[1]])
  assert.deepEqual(filterFish(fish, 'неизвестная рыба', 'all'), [])
})

test('справочник рендерит шесть карточек, фильтры и состояния без данных', async () => {
  const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' })
  try {
    const { FishGuide } = await server.ssrLoadModule('/src/features/fish/FishGuide.tsx')
    const { FishCard } = await server.ssrLoadModule('/src/features/fish/FishCard.tsx')
    const { fishMock } = await server.ssrLoadModule('/src/mocks/fish/fish.ts')
    const html = renderToStaticMarkup(createElement(FishGuide, { fish: fishMock }))
    assert.equal((html.match(/<article /g) ?? []).length, 6)
    assert.equal((html.match(/type="radio"/g) ?? []).length, 5)
    assert.match(html, /Справочник рыб/)
    assert.match(html, /type="search"/)
    assert.equal((html.match(/Период ловли:/g) ?? []).length, 6)
    assert.match(html, /Демонстрационные данные/)
    assert.match(renderToStaticMarkup(createElement(FishGuide, { fish: [] })), /В справочнике пока нет рыб/)
    const missing = renderToStaticMarkup(createElement(FishCard, { fish: { id: 'unknown', name: 'Рыба', seasons: [] } }))
    assert.match(missing, /Фото пока нет/)
    assert.match(missing, /Описание пока не добавлено/)
    assert.match(missing, /Сезон ловли неизвестен/)
  } finally {
    await server.close()
  }
})
