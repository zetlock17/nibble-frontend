import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSeasonalFish } from './seasonal-fish.ts'

test('selects exact calendar months in Vladivostok, including winter across years', () => {
  const fish = [
    { id: 'autumn', catchMonths: [9, 10] },
    { id: 'winter', catchMonths: [10, 11, 12, 1, 2, 3] },
    { id: 'unknown' },
  ]
  assert.deepEqual(getSeasonalFish(fish, new Date('2026-10-31T13:59:00Z')).fish.map((item) => item.id), ['autumn', 'winter'])
  const november = getSeasonalFish(fish, new Date('2026-10-31T14:00:00Z'))
  assert.equal(november.month, 'ноябрь')
  assert.deepEqual(november.fish.map((item) => item.id), ['winter'])
  assert.equal(getSeasonalFish(fish, new Date('2026-12-31T14:00:00Z')).month, 'январь')
  assert.deepEqual(getSeasonalFish(fish, new Date('2027-01-01T00:00:00Z')).fish.map((item) => item.id), ['winter'])
  assert.deepEqual(getSeasonalFish(fish, new Date('2027-06-01T00:00:00Z')).fish, [])
  assert.deepEqual(getSeasonalFish([], new Date('2027-01-01T00:00:00Z')).fish, [])
})
