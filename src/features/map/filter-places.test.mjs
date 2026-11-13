import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterPlaces } from './filter-places.ts'

test('filters fishing access, includes dual access and excludes unknown data only with a filter', () => {
  const places = [
    { id: 'shore', area: 'Владивосток', fishingFrom: ['shore'] },
    { id: 'both', area: 'Остров Русский', fishingFrom: ['shore', 'boat'] },
    { id: 'unknown' },
  ]
  const ids = (from) => filterPlaces(places, from).map((place) => place.id)
  assert.deepEqual(ids(''), ['shore', 'both', 'unknown'])
  assert.deepEqual(ids('shore'), ['shore', 'both'])
  assert.deepEqual(ids('boat'), ['both'])
  assert.deepEqual(ids('unknown'), [])
  assert.deepEqual(filterPlaces([], ''), [])
})
