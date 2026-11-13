import type { Fish } from './fish'

const timeZone = 'Asia/Vladivostok'

export function getSeasonalFish(fish: readonly Fish[], date: Date) {
  const month = Number(new Intl.DateTimeFormat('en', { timeZone, month: 'numeric' }).format(date))
  return {
    month: new Intl.DateTimeFormat('ru', { timeZone, month: 'long' }).format(date),
    fish: fish.filter((item) => item.catchMonths?.includes(month)),
  }
}
