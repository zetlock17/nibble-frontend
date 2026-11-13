import assert from 'node:assert/strict'
import { test } from 'node:test'
import { scrollPageFromWheel } from './wheel-scroll.ts'

test('forwards pixel, line and page wheel deltas once to the content', () => {
  const calls = []
  const area = { clientHeight: 600, scrollHeight: 1800, scrollBy: (options) => calls.push(options) }
  let prevented = 0
  const wheel = { ctrlKey: false, shiftKey: false, deltaX: 0, deltaY: 3, deltaMode: 0, preventDefault: () => prevented++ }
  scrollPageFromWheel(wheel, area, 24)
  scrollPageFromWheel({ ...wheel, deltaMode: 1 }, area, 24)
  scrollPageFromWheel({ ...wheel, deltaMode: 2, deltaY: -1 }, area, 24)
  assert.deepEqual(calls.map((call) => call.top), [3, 72, -600])
  assert.ok(calls.every((call) => call.behavior === 'instant'))
  assert.equal(prevented, 3)
})

test('preserves zoom, horizontal gestures and non-scrolling content', () => {
  const unexpected = () => assert.fail('gesture must remain native')
  const area = { clientHeight: 600, scrollHeight: 1800, scrollBy: unexpected }
  const wheel = { ctrlKey: false, shiftKey: false, deltaX: 0, deltaY: 3, deltaMode: 0, preventDefault: unexpected }
  for (const change of [{ ctrlKey: true }, { shiftKey: true }, { deltaY: 0 }, { deltaX: 20 }]) {
    scrollPageFromWheel({ ...wheel, ...change }, area, 24)
  }
  scrollPageFromWheel(wheel, { ...area, scrollHeight: 600 }, 24)
})
