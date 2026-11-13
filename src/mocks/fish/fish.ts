import greenling from '@/assets/images/fish/greenling.jpg'
import smelt from '@/assets/images/fish/smelt.jpg'
import flounder from '@/assets/images/fish/flounder.jpg'
import mackerel from '@/assets/images/fish/mackerel.jpg'
import herring from '@/assets/images/fish/herring.jpg'
import cod from '@/assets/images/fish/cod.jpg'
import type { Fish } from '@/features/fish/fish'

// Демонстрационный набор по макету. Способы ловли и места обитания заданы для проверки фильтров и требуют проверки по источникам.
export const fishMock: Fish[] = [
  { id: 'greenling', catchMonths: [5, 6, 7, 8, 9, 10], methods: ['spinning', 'bottom'], habitats: ['sea'], name: 'Терпуг', image: greenling, description: 'Держится у камней и зарослей водорослей.', period: 'Май – октябрь', seasons: ['spring', 'summer', 'autumn'] },
  // Ноябрьский лов подтверждён наблюдениями; источник и границы проверки — в SOURCES.md.
  { id: 'smelt', catchMonths: [11, 12, 1, 2, 3, 4], methods: ['float', 'ice'], habitats: ['sea', 'river'], name: 'Корюшка', image: smelt, description: 'Собирается в стаи в бухтах и у устьев рек.', period: 'Ноябрь – апрель', seasons: ['autumn', 'winter', 'spring'] },
  { id: 'flounder', catchMonths: [5, 6, 7, 8, 9, 10, 11], methods: ['bottom'], habitats: ['sea'], name: 'Камбала', image: flounder, description: 'Лежит на песчаном и илистом дне.', period: 'Май – ноябрь', seasons: ['spring', 'summer', 'autumn'] },
  { id: 'mackerel', catchMonths: [7, 8, 9, 10], methods: ['spinning'], habitats: ['sea'], name: 'Скумбрия', image: mackerel, description: 'Летом подходит к берегу вслед за мальком.', period: 'Июль – октябрь', seasons: ['summer', 'autumn'] },
  { id: 'herring', catchMonths: [3, 4, 5], methods: ['spinning', 'float'], habitats: ['sea'], name: 'Сельдь', image: herring, description: 'Весной подходит к мелководью бухт.', period: 'Март – май', seasons: ['spring'] },
  { id: 'cod', catchMonths: [10, 11, 12, 1, 2, 3], methods: ['bottom', 'spinning'], habitats: ['sea'], name: 'Треска', image: cod, description: 'Донная рыба, чаще встречается на глубине.', period: 'Октябрь – март', seasons: ['autumn', 'winter', 'spring'] },
]
