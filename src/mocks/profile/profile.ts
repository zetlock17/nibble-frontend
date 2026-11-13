import coverPhoto from '@/assets/images/demo-catch.jpg'
import { headerMock } from '@/mocks/header/header'
import type { FeedPost } from '@/features/feed/feed-model'

// Вымышленный профиль. Фото иллюстративное, из существующих моков ленты.
export const profileMock = {
  ...headerMock.user,
  id: 'demo-anna',
  city: headerMock.city,
  bio: 'Чаще рыбачу с берега на Русском. Записываю, на что брало, чтобы в следующий раз не вспоминать на ходу.',
  followersCount: 42,
  cover: { src: coverPhoto, alt: 'Рыбалка у воды. Иллюстративная обложка профиля.' },
}

export const profilePostsMock: readonly FeedPost[] = [
  {
    id: 'demo-anna-greenling',
    author: profileMock,
    publishedAt: '2026-05-10T12:05:00+10:00',
    fishingDate: '2026-05-10',
    image: { src: coverPhoto, alt: 'Рыбак с уловом у воды. Иллюстративное фото.' },
    fish: { id: 'greenling', name: 'Терпуг' },
    place: { id: 'ajax', name: 'Бухта Аякс' },
    text: 'Посидела с удочкой у берега. Терпуг брал на пескожила, ближе к обеду поклёвки стихли.',
    likesCount: 5,
    commentsCount: 2,
    source: { type: 'community' },
  },
  {
    id: 'demo-anna-flounder',
    author: profileMock,
    publishedAt: '2026-05-08T18:20:00+10:00',
    fishingDate: '2026-05-08',
    fish: { id: 'flounder', name: 'Камбала' },
    text: 'Поймала две камбалы. Фото не сделала, место пока оставлю при себе.',
    likesCount: 3,
    commentsCount: 0,
    source: { type: 'community' },
  },
]
