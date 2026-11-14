import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

test('shows one article with navigation and a seasonal block without the removed note', async () => {
  const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' })
  try {
    const { HomeResources } = await server.ssrLoadModule('/src/pages/home/HomeResources.tsx')
    const { ArticlePage } = await server.ssrLoadModule('/src/pages/article/ArticlePage.tsx')
    const { fishMock } = await server.ssrLoadModule('/src/mocks/fish/fish.ts')
    const { getSeasonalFish } = await server.ssrLoadModule('/src/features/fish/seasonal-fish.ts')
    assert.deepEqual(getSeasonalFish(fishMock, new Date('2026-11-14T00:00:00Z')).fish.map((item) => item.id), ['smelt', 'flounder', 'cod'])
    const html = renderToStaticMarkup(createElement(HomeResources, { fish: [], onOpenGuide() {}, onOpenArticle() {} }))
    assert.equal((html.match(/<article /g) ?? []).length, 1)
    assert.match(html, /Узлы для рыбалки/)
    assert.doesNotMatch(html, /Какую рыбу поймал/)
    assert.match(html, /Предыдущая статья/)
    assert.match(html, /Следующая статья/)
    assert.ok(html.indexOf('aria-label="Следующая статья"') < html.indexOf('>Подробнее'))
    assert.doesNotMatch(html, /Материал пока готовится/)
    assert.match(html, /На этот месяц периодов ловли пока нет/)
    assert.match(html, /В справочник/)
    assert.match(html, /Источники/)
    assert.match(html, /https:\/\/nauch-tr\.dalrybvtuz\.ru\/images\/Issues\/73\/73-05\.pdf/)
    assert.ok(html.indexOf('>Источники</button>') < html.indexOf('В справочник'))
    assert.doesNotMatch(html, /Периоды из демо/)
    const knots = renderToStaticMarkup(createElement(ArticlePage, { article: 'article-knots', onBack() {} }))
    const fish = renderToStaticMarkup(createElement(ArticlePage, { article: 'article-fish', onBack() {} }))
    assert.match(knots, /Улучшенный клинч/)
    assert.match(knots, /line-joining-knots/)
    assert.match(fish, /Признаки для определения рыб/)
    assert.match(fish, /fisheries\.noaa\.gov/)
    assert.match(knots, /Главная/)
  } finally {
    await server.close()
  }
})
