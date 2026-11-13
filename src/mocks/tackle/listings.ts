import type { TackleState } from '@/features/tackle/tackle'
import shimanoImage from '@/assets/images/tackle/shimano-salty-advance.jpg'
import daiwaImage from '@/assets/images/tackle/daiwa-spinning.jpg'
import ticaImage from '@/assets/images/tackle/tica-ticateam.jpg'
import salmonImage from '@/assets/images/tackle/salmon-tackle.jpg'
import squidImage from '@/assets/images/tackle/squid-rigs.jpg'
import swivelImage from '@/assets/images/tackle/swivel-snap.jpg'
import reelImage from '@/assets/images/tackle/tica-oxean.jpg'

// Цены и дни публикации из скриншотов пользователя; год демонстрационный.
// Последняя карточка взята из выдачи Фарпоста. Парсер пока не подключён.
export const tackleMock: TackleState = {
  status: 'ready',
  demo: true,
  listings: [
    {
      id: 'farpost-138256471', category: 'rods',
      title: 'Новое удилище Shimano Salty Advance Jigging B63ML (40-160g)',
      image: shimanoImage, price: 11000, publishedOn: '2026-11-10',
      sourceUrl: 'https://www.farpost.ru/vladivostok/sport/fish/novoe-udilishe-shimano-salty-advance-jigging-b63ml-40-160g-138256471.html',
    },
    {
      id: 'farpost-136727769', category: 'rigs',
      title: 'Продам снасти для рыбалки для ловли симы-кеты',
      image: salmonImage, price: 8000, publishedOn: '2026-11-09', seller: { name: 'Драйв-Детали' },
      sourceUrl: 'https://www.farpost.ru/vladivostok/sport/fish/prodam-snasti-dlja-rybalki-dlja-lovli-simy-kety-136727769.html',
    },
    {
      id: 'farpost-122429918', category: 'rigs', title: 'Карабин с вертлюгом M&W 250LB',
      image: swivelImage, price: 600, publishedOn: '2026-11-09', seller: { name: 'MAGURO' },
      sourceUrl: 'https://www.farpost.ru/vladivostok/sport/fish/karabin-s-vertljugom-m-w-250lb-122429918.html',
    },
    {
      id: 'farpost-138862826', category: 'rods', title: 'Спиннинг Daiwa',
      image: daiwaImage, price: 33000, publishedOn: '2026-11-04',
      sourceUrl: 'https://www.farpost.ru/vladivostok/sport/fish/spinning-daiwa-138862826.html',
    },
    {
      id: 'farpost-135327411', category: 'rigs', title: 'Оснастка на кальмара 14шт одним лотом. Япония',
      image: squidImage, price: 10000, publishedOn: '2026-11-02',
      sourceUrl: 'https://www.farpost.ru/vladivostok/sport/fish/osnastka-na-kalmara-14sht-odnim-lotom-japonija-135327411.html',
    },
    {
      id: 'farpost-137920108', category: 'rods', title: 'Троллинговое удилище Tica Ticateam BHLА6051, 180 см',
      image: ticaImage, price: 14000, publishedOn: '2026-10-04', seller: { name: 'СпортАктив' },
      sourceUrl: 'https://www.farpost.ru/vladivostok/sport/fish/trollingovoe-udilishe-tica-ticateam-bhla6051-180sm-137920108.html',
    },
    {
      id: 'farpost-133716993', category: 'reels', title: 'Катушка мультипликаторная Tica Oxean OX50',
      image: reelImage, price: 26000, publishedOn: '2026-10-04', seller: { name: 'СпортАктив' },
      sourceUrl: 'https://www.farpost.ru/vladivostok/sport/fish/katushka-multiplikatornaja-tica-oxean-ox50-133716993.html',
    },
  ],
}
