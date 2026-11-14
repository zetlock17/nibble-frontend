import { useEffect, useRef } from 'react'
import arrowIcon from '@/assets/icons/actions/arrow_up.svg'
import fishImage from '@/assets/images/guides/fish-identification.png'
import knotsImage from '@/assets/images/guides/fishing-knots.png'
import flounderImage from '@/assets/images/fish/flounder.jpg'
import codImage from '@/assets/images/fish/cod.jpg'
import clinchPhoto from '@/assets/images/guides/improved-clinch.jpg'
import uniDiagram from '@/assets/images/guides/uni-knot.jpg'

const articles = {
  'article-knots': {
    title: 'Узлы для рыбалки',
    intro: 'Как привязать крючок и соединить основную леску с поводком. Начните с двух узлов и потренируйтесь дома на толстой леске.',
    image: knotsImage,
    sections: [
      { title: 'Улучшенный клинч для крючка', paragraphs: [
        'Узел подходит для крепления лески или поводка к крючку с колечком, вертлюгу или приманке. Проденьте свободный конец лески в колечко и оберните его вокруг основной лески пять или шесть раз.',
        'Верните конец к крючку, проденьте его в небольшую петлю возле колечка, а затем в большую петлю, которая получилась после этого. Смочите узел и затяните, придерживая оба конца лески. Обрежьте свободный конец.',
      ] },
      { title: 'Двойной уни для соединения лесок', paragraphs: [
        'Этим узлом можно соединить основную леску с поводком. Положите концы лесок навстречу друг другу с нахлёстом. Одним концом сделайте петлю и пять раз оберните его вокруг обеих лесок, пропуская через петлю. Подтяните витки, но пока не затягивайте окончательно.',
        'Повторите то же другим концом с противоположной стороны. Смочите леску между узлами и потяните за основные концы в разные стороны, чтобы узлы сошлись. Подрежьте свободные концы.',
      ] },
      { title: 'Проверьте перед забросом', paragraphs: [
        'Затягивайте узел постепенно и проверяйте его несколькими потягиваниями. Если витки легли неровно или леска повреждена, перевяжите узел. Для незнакомой лески сверьтесь с рекомендациями её производителя.',
      ] },
    ],
    sources: [
      { label: 'Улучшенный клинч — Take Me Fishing', url: 'https://www.takemefishing.org/blog/april-2018/improved-clinch-knot-fishing-knot-tying-steps/' },
      { label: 'Двойной уни — Take Me Fishing', url: 'https://www.takemefishing.org/how-to-fish/how-tie-fishing-knots/line-joining-knots/' },
    ],
  },
  'article-fish': {
    title: 'Какую рыбу поймал?',
    intro: 'Название рыбы не всегда можно определить по одному признаку. Сравните форму тела, плавники и окраску, а если сомневаетесь, оставьте вид неизвестным.',
    image: fishImage,
    sections: [
      { title: 'Начните с формы тела', paragraphs: [
        'Посмотрите на рыбу целиком: тело может быть вытянутым, высоким или плоским. Обратите внимание на форму хвоста, расположение рта и пропорции головы. Эти признаки помогут сузить круг похожих рыб.',
      ] },
      { title: 'Рассмотрите плавники и окраску', paragraphs: [
        'Сравните количество и расположение плавников, их форму, пятна и полосы. У похожих видов могут различаться колючие и мягкие лучи плавников. Цвет помогает при поиске, но лучше сверять сразу несколько признаков.',
      ] },
      { title: 'Сделайте понятные фотографии', paragraphs: [
        'Снимите рыбу целиком сбоку при хорошем освещении. Затем отдельно сфотографируйте голову, плавники и необычные отметины, если они видны. По таким снимкам проще сравнить находку с определителем или обратиться к специалисту.',
      ] },
      { title: 'Сверьтесь с определителем', paragraphs: [
        'Ищите виды, встречающиеся в районе улова, и сравнивайте описания, а не только фотографии. В FishBase можно посмотреть признаки рыб по научному названию. Если отличия неясны, не угадывайте вид по одной фотографии.',
      ] },
    ],
    sources: [
      { label: 'Признаки для определения рыб — FishBase', url: 'https://fishbase.se/manual/english/FishBaseThe_MORPHOLOGY_Table.htm' },
      { label: 'Проверка видов по фотографиям — NOAA Fisheries', url: 'https://www.fisheries.noaa.gov/new-england-mid-atlantic/fisheries-observers/species-verification-program' },
      { label: 'Быстрое определение рыб — FishBase', url: 'https://www.fishbase.se/manual/English/fishbaseQuick_Identification.htm' },
    ],
  },
} as const

export function ArticlePage({ article, onBack }: { article: keyof typeof articles; onBack: () => void }) {
  const content = articles[article]
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  return (
    <section className="w-full min-w-0 pb-8" aria-labelledby="article-title">
      <button type="button" onClick={onBack} className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-sm border-0 bg-transparent p-0 text-sm font-bold text-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <img src={arrowIcon} alt="" className="size-4 -rotate-90" />Главная
      </button>
      <article className="rounded-4xl bg-surface p-5 sm:p-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <div className="min-w-0 flex-1">
            <h1 ref={headingRef} tabIndex={-1} id="article-title" className="m-0 text-3xl leading-tight font-extrabold outline-none sm:text-4xl">{content.title}</h1>
            <p className="mt-4 mb-0 text-base leading-7 text-text-muted">{content.intro}</p>
          </div>
          <img src={content.image} alt="" className="h-48 w-full object-contain sm:h-56 sm:w-64 sm:shrink-0" />
        </header>
        <div className="mt-8 flex w-full min-w-0 flex-col gap-7">
          {content.sections.map((section, index) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="m-0 text-xl leading-7 font-extrabold">{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="m-0 text-base leading-7">{paragraph}</p>)}
              {article === 'article-knots' && index === 0 && (
                <figure className="m-0 mt-2 w-full max-w-160">
                  <img src={clinchPhoto} alt="Незатянутый улучшенный клинч, завязанный из шнура на кольце" loading="lazy" className="h-auto w-full rounded-2xl" />
                  <figcaption className="mt-2 text-xs leading-5 text-text-muted">Улучшенный клинч до затягивания. <a href="https://commons.wikimedia.org/wiki/File:Barb._02_Verbesserter_Clinchknoten.jpg" target="_blank" rel="noopener noreferrer" className="text-focus underline underline-offset-4">Фото: Der Barbar</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="text-focus underline underline-offset-4">CC BY-SA 4.0</a>.</figcaption>
                </figure>
              )}
              {article === 'article-knots' && index === 1 && (
                <>
                  <figure className="m-0 mt-2 w-full max-w-160">
                    <img src={uniDiagram} alt="Этапы вязания одиночного узла уни на кольце" loading="lazy" className="h-auto w-full rounded-2xl" />
                    <figcaption className="mt-2 text-xs leading-5 text-text-muted">На рисунке одиночный уни на кольце. В двойном уни такие узлы вяжутся на двух лесках. <a href="https://commons.wikimedia.org/wiki/File:Uni_knot.jpg" target="_blank" rel="noopener noreferrer" className="text-focus underline underline-offset-4">Рисунок: Snapper G</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer" className="text-focus underline underline-offset-4">CC BY-SA 3.0</a>.</figcaption>
                  </figure>
                  <a href="https://onthewater.com/four-knots-need-know" target="_blank" rel="noopener noreferrer" className="w-fit rounded-sm text-sm leading-6 font-semibold text-focus underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Посмотреть пошаговые рисунки обоих узлов<span className="sr-only">, откроется в новой вкладке</span></a>
                </>
              )}
              {article === 'article-fish' && index === 0 && (
                <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <figure className="m-0 min-w-0">
                    <img src={flounderImage} alt="Камбала с плоским телом" loading="lazy" className="h-56 w-full rounded-2xl object-cover sm:h-64" />
                    <figcaption className="mt-2 text-xs leading-5 text-text-muted">Звёздчатая камбала. <a href="https://commons.wikimedia.org/wiki/File:Starry_Flounder.JPG" target="_blank" rel="noopener noreferrer" className="text-focus underline underline-offset-4">Фото: Wikimedia Commons</a></figcaption>
                  </figure>
                  <figure className="m-0 min-w-0">
                    <img src={codImage} alt="Тихоокеанская треска с вытянутым телом" loading="lazy" className="h-56 w-full rounded-2xl object-cover sm:h-64" />
                    <figcaption className="mt-2 text-xs leading-5 text-text-muted">Тихоокеанская треска. <a href="https://commons.wikimedia.org/wiki/File:Gadus_macrocephalus_Kamo_4.jpg" target="_blank" rel="noopener noreferrer" className="text-focus underline underline-offset-4">Фото: Totti</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="text-focus underline underline-offset-4">CC BY-SA 4.0</a>.</figcaption>
                  </figure>
                </div>
              )}
            </section>
          ))}
          <section className="flex flex-col gap-3" aria-labelledby="article-sources">
            <h2 id="article-sources" className="m-0 text-xl leading-7 font-extrabold">Источники</h2>
            <div className="flex flex-col items-start gap-3">
              {content.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-sm text-sm leading-6 font-semibold text-focus underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{source.label}<span className="sr-only">, откроется в новой вкладке</span></a>)}
            </div>
          </section>
        </div>
      </article>
    </section>
  )
}
