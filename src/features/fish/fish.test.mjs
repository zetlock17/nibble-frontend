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

test('способ и место обитания сочетаются с поиском и сезоном, неизвестные признаки не угадываются', () => {
  const fish = [
    { id: 'smelt', name: 'Корюшка', seasons: ['winter'], methods: ['ice', 'float'], habitats: ['sea', 'river'] },
    { id: 'flounder', name: 'Камбала', seasons: ['summer'], methods: ['bottom'], habitats: ['sea'] },
    { id: 'unknown', name: 'Рыба', seasons: ['winter'] },
  ]
  assert.deepEqual(filterFish(fish, ' КОРЮШКА ', 'winter', 'ice', 'river'), [fish[0]])
  assert.deepEqual(filterFish(fish, '', 'all', 'float', 'sea'), [fish[0]])
  assert.deepEqual(filterFish(fish, '', 'all', 'bottom', 'river'), [])
  assert.deepEqual(filterFish(fish, '', 'summer', 'ice', ''), [])
  assert.deepEqual(filterFish(fish, '', 'all', '', 'lake'), [])
  assert.deepEqual(filterFish(fish, '', 'all'), fish)
})

test('справочник показывает загрузку, карточки отображают данные и запасные состояния', async () => {
  const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' })
  try {
    const { FishGuide } = await server.ssrLoadModule('/src/features/fish/FishGuide.tsx')
    const { FishCard } = await server.ssrLoadModule('/src/features/fish/FishCard.tsx')
    const { FishDetails } = await server.ssrLoadModule('/src/features/fish/FishDetails.tsx')
    const { AddCatchPage } = await server.ssrLoadModule('/src/pages/add-catch/AddCatchPage.tsx')
    const { fishMock } = await server.ssrLoadModule('/src/mocks/fish/fish.ts')
    const html = renderToStaticMarkup(createElement(FishGuide))
    assert.match(html, /Справочник рыб/)
    assert.match(html, /Загружаем рыб/)
    assert.match(html, /type="search"/)
    assert.doesNotMatch(html, /Демонстрационные данные/)
    assert.match(html, /Фильтры по способу ловли и месту обитания пока недоступны/)
    const card = renderToStaticMarkup(createElement(FishCard, { fish: fishMock[0], onSelect() {} }))
    assert.match(card, /aria-label="Подробнее: Терпуг"/)
    for (const status of ['loading', 'error', 'ready']) {
      const form = renderToStaticMarkup(createElement(AddCatchPage, { fish: { fish: [], status, retry() {} }, city: null, origin: 'home', active: false, onBack() {} }))
      assert.match(form, status === 'loading' ? /Загружаем рыб/ : status === 'error' ? /Не удалось загрузить рыб/ : /В справочнике пока нет рыб/)
    }
    const detailed = renderToStaticMarkup(createElement(FishDetails, { fish: fishMock[0], onBack() {} }))
    assert.match(detailed, /Терпуг/)
    assert.match(detailed, /35 см/)
    assert.match(detailed, /Май: период ловли/)
    const sparse = renderToStaticMarkup(createElement(FishDetails, { fish: { id: 'unknown', name: 'Рыба', seasons: [] }, onBack() {} }))
    assert.match(sparse, /Фото пока нет/)
    assert.match(sparse, /Месяцы ловли пока не указаны/)
    assert.match(sparse, /Подробное описание пока не добавлено/)
    const missing = renderToStaticMarkup(createElement(FishCard, { fish: { id: 'unknown', name: 'Рыба', seasons: [] }, onSelect() {} }))
    assert.match(missing, /Фото пока нет/)
    assert.match(missing, /Описание пока не добавлено/)
    assert.match(missing, /Сезон ловли неизвестен/)
  } finally {
    await server.close()
  }
})
