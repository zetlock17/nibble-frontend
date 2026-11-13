import assert from 'node:assert/strict'
import { test } from 'node:test'
import { movePhoto } from './photo-carousel.ts'

test('moves through the gallery without wrapping beyond the first or last photo', () => {
  let index = 0
  assert.equal(movePhoto(index, -1, 3), 0)
  index = movePhoto(index, 1, 3)
  assert.equal(index, 1)
  index = movePhoto(index, 1, 3)
  assert.equal(index, 2)
  assert.equal(movePhoto(index, 1, 3), 2)
  assert.equal(movePhoto(index, -1, 3), 1)
  assert.equal(movePhoto(0, 1, 1), 0)
  assert.equal(movePhoto(0, 1, 0), 0)
})
