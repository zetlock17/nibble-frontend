import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterPlaces } from './filter-places.ts'

test('combines area and fishing access, includes dual access and excludes unknown data', () => {
  const places = [
    { id: 'shore', area: 'Владивосток', fishingFrom: ['shore'] },
    { id: 'both', area: 'Остров Русский', fishingFrom: ['shore', 'boat'] },
    { id: 'unknown' },
  ]
  const ids = (area, from) => filterPlaces(places, area, from).map((place) => place.id)
  assert.deepEqual(ids('', ''), ['shore', 'both', 'unknown'])
  assert.deepEqual(ids('', 'shore'), ['shore', 'both'])
  assert.deepEqual(ids('', 'boat'), ['both'])
  assert.deepEqual(ids('Остров Русский', 'boat'), ['both'])
  assert.deepEqual(ids('Владивосток', 'boat'), [])
  assert.deepEqual(ids('Окрестности', ''), [])
  assert.deepEqual(filterPlaces([], '', ''), [])
})
