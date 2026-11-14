import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { formatPostDate, getTelegramPostUrl, initialFeedFilters } from './feed-model.ts'
import { feedQuery, parseFeedPage } from './feed-api.ts'

// node --experimental-strip-types --test src/features/feed/feed.test.mjs
const referenceTime = '2026-05-13T12:00:00+10:00'
const apiPost = (overrides = {}) => ({
  id: 7, kind: 'fishing_report', text: ' Поймал корюшку ', published_at: '2026-05-12T09:10:00Z', fishing_date: null,
  source: { id: 2, type: 'telegram', name: 'Канал', url: 'https://t.me/channel' }, author: null, spot: null, species: [], media: [],
  likes_count: 0, comments_count: 0, tg_reactions_count: 5, tg_comments_count: null, original_url: 'https://t.me/channel/1', ...overrides,
})

test('запрос ленты содержит город, фильтры и курсор', () => {
  assert.equal(feedQuery(1, initialFeedFilters), 'city_id=1&limit=20')
  assert.equal(feedQuery(1, { source: 'community', placeId: '3', fishId: '4' }, 'abc=='), 'city_id=1&limit=20&source=klev&spot_id=3&species_id=4&cursor=abc%3D%3D')
})

test('публикация из API превращается в карточку ленты, неполные данные остаются пустыми', () => {
  const page = parseFeedPage({ items: [
    apiPost(),
    apiPost({ id: 8, source: { id: 1, type: 'klev', name: 'Клёв', url: null }, author: { id: 9, display_name: 'Анна Соколова', avatar_url: null, is_following: false }, likes_count: 3, comments_count: 2,
      spot: { id: 4, name: 'Бухта Новик' }, species: [{ id: 6, name: 'Камбала', quantity: 2, max_weight_g: null }], media: [{ type: 'video', url: 'https://x/v.mp4' }, { type: 'photo', url: 'https://x/p.jpg' }] }),
    apiPost({ id: 9, source: { id: 3, type: 'vk', name: 'VK', url: null } }),
  ], next_cursor: 'next' })
  assert.equal(page.nextCursor, 'next')
  assert.equal(page.posts.length, 2)
  const [telegram, community] = page.posts
  assert.deepEqual([telegram.author.name, telegram.author.id, telegram.likesCount, telegram.commentsCount, telegram.text, telegram.image], ['Канал', 'source-2', 5, 0, 'Поймал корюшку', undefined])
  assert.deepEqual(telegram.source, { type: 'telegram', url: 'https://t.me/channel/1' })
  assert.deepEqual([community.author.name, community.author.initials, community.likesCount, community.commentsCount, community.source.type], ['Анна Соколова', 'АС', 3, 2, 'community'])
  assert.deepEqual([community.place, community.fish, community.image.src], [{ id: '4', name: 'Бухта Новик' }, { id: '6', name: 'Камбала' }, 'https://x/p.jpg'])
  assert.equal(parseFeedPage({ items: [], next_cursor: null }).nextCursor, null)
  assert.throws(() => parseFeedPage({ items: [{ id: 'x' }] }))
  assert.throws(() => parseFeedPage([]))
})

test('дата публикации учитывает часовой пояс Владивостока и неизвестную дату', () => {
  assert.equal(formatPostDate('2026-05-12T19:45:00Z', referenceTime), 'сегодня, 05:45')
  assert.equal(formatPostDate('2026-05-12T09:10:00Z', referenceTime), 'вчера, 19:10')
  assert.match(formatPostDate('2025-05-12T09:10:00Z', referenceTime), /12 мая 2025/)
  assert.equal(formatPostDate(null, referenceTime), 'Дата публикации неизвестна')
  assert.equal(formatPostDate('invalid', referenceTime), 'Дата публикации неизвестна')
  assert.match(formatPostDate('2026-05-12T09:10:00Z', 'invalid'), /12 мая 2026/)
})

test('ссылка на источник принимает HTTPS Telegram и отклоняет чужие домены и опасные схемы', () => {
  assert.equal(getTelegramPostUrl('https://t.me/example/1'), 'https://t.me/example/1')
  for (const url of [undefined, '', 'invalid', 'javascript:alert(1)', 'http://t.me/example/1', 'https://t.me.evil.test/example/1', 'https://t.me@evil.test', 'https://user:password@t.me/example/1']) {
    assert.equal(getTelegramPostUrl(url), undefined)
  }
})

test('карточки и лента рендерятся через Vite с необязательными данными и разными состояниями', async () => {
  const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' })
  try {
    const { PostCard } = await server.ssrLoadModule('/src/features/feed/PostCard.tsx')
    const { Feed } = await server.ssrLoadModule('/src/features/feed/Feed.tsx')
    const { ProfilePage } = await server.ssrLoadModule('/src/pages/profile/ProfilePage.tsx')
    const { profileMock, profilePostsMock } = await server.ssrLoadModule('/src/mocks/profile/profile.ts')
    const { profilePhotosMock } = await server.ssrLoadModule('/src/mocks/profile/photos.ts')
    const { PhotoGrid } = await server.ssrLoadModule('/src/components/ui/photo-grid/PhotoGrid.tsx')
    const { default: App } = await server.ssrLoadModule('/src/App.tsx')
    const { feedMock } = await server.ssrLoadModule('/src/mocks/feed/posts.ts')
    const renderCard = (post, extra = {}) => renderToStaticMarkup(createElement(PostCard, {
      post, referenceTime, liked: false, following: false, onLike() {}, onFollow() {}, ...extra,
    }))
    const communityPost = feedMock.posts[0]
    const communityHtml = renderCard(communityPost)
    assert.match(communityHtml, /Подписаться/)
    assert.match(communityHtml, /<time dateTime=/)
    assert.match(communityHtml, /alt="Рыбак держит/)
    assert.match(communityHtml, /Бухта Новик/)
    assert.match(communityHtml, /aria-pressed="false"/)
    assert.match(renderCard(communityPost, { liked: true, following: true }), /Вы подписаны/)
    assert.match(renderCard(communityPost, { liked: true }), /<span>4<\/span>/)
    const likedHtml = renderCard(communityPost, { liked: true })
    const heartMask = (html) => html.match(/mask-image:([^\"]+)/)?.[1]
    assert.ok(heartMask(communityHtml))
    assert.ok(heartMask(likedHtml))
    assert.match(heartMask(communityHtml), /^url\(&quot;.*&quot;\)$/)
    assert.match(heartMask(likedHtml), /^url\(&quot;.*&quot;\)$/)
    assert.notEqual(heartMask(communityHtml), heartMask(likedHtml))
    assert.match(renderCard(communityPost, { liked: true }), /text-danger/)
    assert.match(renderCard(communityPost, { liked: true }), /aria-pressed="true"/)
    assert.doesNotMatch(renderCard(communityPost, { onFollow: undefined }), /Подписаться/)

    const telegramPost = feedMock.posts[2]
    const telegramHtml = renderCard({ ...telegramPost, source: { type: 'telegram', url: 'https://t.me/example/1' } })
    assert.doesNotMatch(telegramHtml, /Подписаться/)
    assert.match(telegramHtml, /href="https:\/\/t.me\/example\/1"/)
    assert.match(telegramHtml, /rel="noopener noreferrer"/)
    assert.doesNotMatch(renderCard(telegramPost), /<a /)
    assert.match(renderCard(telegramPost), /Источник/)

    const textHtml = renderCard(feedMock.posts[3])
    assert.match(textHtml, /Дата публикации неизвестна/)
    assert.doesNotMatch(textHtml, /aspect-video|bg-photo-tag|Бухта|<time /)
    const noPhotoHtml = renderCard(feedMock.posts[1])
    assert.match(noPhotoHtml, /Камбала/)
    assert.doesNotMatch(noPhotoHtml, /aspect-video/)

    const renderFeed = (state) => renderToStaticMarkup(createElement(Feed, { state, referenceTime, filters: initialFeedFilters, onFiltersChange() {}, places: [], fish: [] }))
    const feedHtml = renderFeed(feedMock)
    assert.equal((feedHtml.match(/<article /g) ?? []).length, 4)
    assert.match(feedHtml, /aria-label="Фильтры ленты"/)
    assert.doesNotMatch(feedHtml, /VK|ВКонтакте/)
    assert.match(renderFeed({ status: 'loading' }), /aria-busy="true"/)
    assert.match(renderFeed({ status: 'error' }), /Не удалось загрузить ленту/)
    assert.match(renderFeed({ status: 'ready', posts: [] }), /Публикаций пока нет/)
    const renderProfile = (state) => renderToStaticMarkup(createElement(ProfilePage, { profile: profileMock, state, referenceTime, photos: profilePhotosMock }))
    const profileHtml = renderProfile({ status: 'ready', posts: profilePostsMock })
    assert.equal((profileHtml.match(/<article /g) ?? []).length, 2)
    assert.match(profileHtml, /Анна Соколова/)
    assert.match(profileHtml, /Редактировать профиль/)
    assert.match(profileHtml, /подписчика/)
    assert.match(profileHtml, /Фото с рыбалок/)
    const gridHtml = renderToStaticMarkup(createElement(PhotoGrid, { photos: profilePhotosMock }))
    assert.equal((gridHtml.match(/<a /g) ?? []).length, profilePhotosMock.length)
    assert.match(gridHtml, /target="_blank" rel="noopener noreferrer"/)
    assert.match(renderToStaticMarkup(createElement(PhotoGrid, { photos: [] })), /Фотографий пока нет/)
    assert.doesNotMatch(profileHtml, /Подписаться|Коллекция|подписок|Фильтры ленты/)
    assert.match(renderProfile({ status: 'ready', posts: [] }), /Публикаций пока нет/)
    assert.match(renderProfile({ status: 'loading' }), /aria-busy="true"/)
    assert.match(renderProfile({ status: 'error' }), /Не удалось загрузить публикации/)
    const appHtml = renderToStaticMarkup(createElement(App))
    assert.equal((appHtml.match(/<article /g) ?? []).length, 0)
    assert.match(appHtml, /id="main-content"/)
    assert.doesNotMatch(appHtml, /Демонстрационные публикации/)
  } finally {
    await server.close()
  }
})
