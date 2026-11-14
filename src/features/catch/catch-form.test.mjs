import assert from 'node:assert/strict'
import { test } from 'node:test'
import { maxPhotoSize, photoError, validateCatch } from './catch-form.ts'

test('photo accepts JPEG/PNG up to 10 MB and rejects empty or unsupported files', () => {
  assert.equal(photoError({ type: 'image/png', size: maxPhotoSize }), '')
  assert.equal(photoError({ type: 'image/jpeg', size: 1 }), '')
  assert.ok(photoError({ type: 'image/png', size: maxPhotoSize + 1 }))
  assert.ok(photoError({ type: 'image/png', size: 0 }))
  assert.ok(photoError({ type: 'image/svg+xml', size: 10 }))
})

test('catch allows multiple known species, hidden place; photo and text are both required', () => {
  const fish = [{ id: 'cod' }, { id: 'smelt' }]
  const places = [{ id: 'novik' }]
  const draft = { hasPhoto: true, description: 'Улов с берега', fishIds: ['cod', 'smelt'], placeId: 'novik' }
  const check = (overrides = {}) => validateCatch({ ...draft, ...overrides }, fish, places)
  assert.equal(check(), '')
  assert.equal(check({ fishIds: [], placeId: '' }), '')
  assert.ok(check({ description: '' }))
  assert.ok(check({ hasPhoto: false }))
  assert.ok(check({ description: '  ' }))
  assert.ok(check({ fishIds: ['своя рыба'] }))
  assert.ok(check({ placeId: '131.9,43.1' }))
  assert.ok(check({ description: 'a'.repeat(3001) }))
  assert.equal(check({ description: 'a'.repeat(3000) }), '')
})
