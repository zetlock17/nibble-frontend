import assert from 'node:assert/strict'
import { test } from 'node:test'
import { revealPlace } from './reveal-place.ts'

test('reveals details without a competing focus scroll and respects reduced motion', () => {
  const events = []
  const overview = { scrollIntoView: (options) => events.push(['scroll', options]) }
  const details = { focus: (options) => events.push(['focus', options]) }
  revealPlace(overview, details, false)
  assert.deepEqual(events, [
    ['focus', { preventScroll: true }],
    ['scroll', { behavior: 'smooth', block: 'start' }],
  ])
  events.length = 0
  revealPlace(overview, details, true)
  assert.equal(events[1][1].behavior, 'instant')
  assert.doesNotThrow(() => revealPlace(null, null, true))
})
