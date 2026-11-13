import catchPhoto from '@/assets/images/demo-catch.jpg'
import coastPhoto from '@/assets/images/profile/coast.jpg'
import beachPhoto from '@/assets/images/profile/beach.jpg'
import lakePhoto from '@/assets/images/profile/lake.jpg'
import woodlandPhoto from '@/assets/images/profile/woodland.jpg'
import lakesidePhoto from '@/assets/images/profile/lakeside.jpg'
import forestPhoto from '@/assets/images/profile/forest.jpg'
import valleyPhoto from '@/assets/images/profile/valley.jpg'
import type { GridPhoto } from '@/components/ui/photo-grid/PhotoGrid'

// Иллюстративный альбом для вёрстки. Не связан с местами и отчётами профиля.
export const profilePhotosMock: readonly GridPhoto[] = [
  { id: 'demo-catch', src: catchPhoto, alt: 'Рыбак с уловом у воды.' },
  { id: 'demo-coast', src: coastPhoto, alt: 'Каменистый морской берег на закате.' },
  { id: 'demo-lake', src: lakePhoto, alt: 'Озеро у гор.' },
  { id: 'demo-beach', src: beachPhoto, alt: 'Песчаный берег и море.' },
  { id: 'demo-woodland', src: woodlandPhoto, alt: 'Лесная тропа среди деревьев.' },
  { id: 'demo-lakeside', src: lakesidePhoto, alt: 'Берег озера в окружении гор.' },
  { id: 'demo-forest', src: forestPhoto, alt: 'Солнечный свет в лесу.' },
  { id: 'demo-valley', src: valleyPhoto, alt: 'Горная долина в солнечном свете.' },
]
