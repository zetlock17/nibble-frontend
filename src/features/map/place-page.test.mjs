import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

test('карточка и страница места показывают доступные данные и действия', async () => {
  const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' })
  try {
    const { PlaceCard } = await server.ssrLoadModule('/src/features/map/PlaceCard.tsx')
    const { PlacePage } = await server.ssrLoadModule('/src/features/map/PlacePage.tsx')
    const { PlaceDetails } = await server.ssrLoadModule('/src/features/map/PlaceDetails.tsx')
    const place = { id: '1', name: 'Бухта', area: 'Остров', coordinates: [131.87, 43.02], fishIds: [] }
    const card = renderToStaticMarkup(createElement(PlaceCard, { place, onSelect() {}, onOpen() {} }))
    assert.match(card, /aria-label="Подробнее: Бухта"/)
    assert.match(card, /Показать на карте/)
    const page = renderToStaticMarkup(createElement(PlacePage, { place, cityName: 'Владивосток', onBack() {}, onMap() {} }))
    assert.match(page, /Владивосток, Остров/)
    assert.match(page, /43\.02, 131\.87/)
    assert.match(page, /Фото пока нет/)
    assert.match(page, /Загружаем описание/)
    assert.match(page, /Карта мест/)
    const preview = renderToStaticMarkup(createElement(PlaceDetails, { place, onOpen() {} }))
    assert.match(preview, /<h2[^>]*><button[^>]*cursor-pointer[^>]*>Бухта<\/button><\/h2>/)
    assert.match(preview, /Подробнее/)
    assert.doesNotMatch(preview, /<dialog/)
  } finally {
    await server.close()
  }
})
