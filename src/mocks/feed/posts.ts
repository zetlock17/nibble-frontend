import catchPhoto from '@/assets/images/demo-catch.jpg'
import type { FeedState } from '@/features/feed/feed-model'

// Фиксированный пример по макету. Авторы и отчёты вымышлены, фото иллюстративное.
// Фото: https://images.unsplash.com/photo-1506873589908-63bc22175dd7
export const feedMockReferenceTime = '2026-05-13T12:00:00+10:00'

const novik = { id: 'novik', name: 'Бухта Новик' }
const sobol = { id: 'sobol', name: 'Бухта Соболь' }
const greenling = { id: 'greenling', name: 'Терпуг' }
const smelt = { id: 'smelt', name: 'Корюшка' }

export const feedMock: FeedState = {
  status: 'ready',
  posts: [
    {
      id: 'demo-dmitry-catch',
      author: { id: 'demo-dmitry', name: 'Дмитрий Рыбаков', initials: 'ДР', avatarUrl: catchPhoto },
      publishedAt: '2026-05-13T05:45:00+10:00',
      fishingDate: '2026-05-13',
      image: { src: catchPhoto, alt: 'Рыбак держит пойманную рыбу у воды. Иллюстративное фото.' },
      fish: greenling,
      place: novik,
      text: 'Вышел к шести, поклёвки начались почти сразу. Брал на пескожила, заброс недалеко от камней. Вода спокойная, ветер со спины.',
      likesCount: 3,
      commentsCount: 14,
      source: { type: 'community' },
    },
    {
      id: 'demo-olga-catch',
      author: { id: 'demo-olga', name: 'Ольга Ли', initials: 'ОЛ' },
      publishedAt: '2026-05-12T19:10:00+10:00',
      fishingDate: '2026-05-12',
      fish: { id: 'flounder', name: 'Камбала' },
      text: 'Сегодня без фото. Посидела у воды пару часов, поймала две камбалы. Место пока оставлю при себе.',
      likesCount: 8,
      commentsCount: 3,
      source: { type: 'community' },
    },
    {
      id: 'demo-telegram-catch',
      author: { id: 'demo-telegram-channel', name: 'Рыбалка на Русском', initials: 'ТГ' },
      publishedAt: '2026-05-12T13:32:00+10:00',
      fishingDate: '2026-05-12',
      image: { src: catchPhoto, alt: 'Рыбак с уловом на берегу. Иллюстративное фото.' },
      fish: smelt,
      place: sobol,
      text: 'На Соболе корюшка подошла около девяти. На мелкую блесну брала у самого берега, к десяти стало тише.',
      likesCount: 12,
      commentsCount: 2,
      source: { type: 'telegram' },
    },
    {
      id: 'demo-text-post',
      author: { id: 'demo-alexey', name: 'Алексей', initials: 'А' },
      publishedAt: null,
      text: 'В этот раз приехал просто посмотреть на море. Удочку даже не доставал.',
      likesCount: 0,
      commentsCount: 0,
      source: { type: 'community' },
    },
  ],
}
