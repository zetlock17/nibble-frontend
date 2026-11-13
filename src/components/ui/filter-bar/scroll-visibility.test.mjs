import assert from 'node:assert/strict'
import { test } from 'node:test'
import { finishHiding, getScrollVisibility } from './scroll-visibility.ts'

test('hides progressively, reveals after deliberate upward motion, and handles reversals', () => {
  let state = { position: 0, offset: 0, upTravel: 0, animate: false }
  state = getScrollVisibility(state, 5, 60, 1000)
  assert.equal(state.offset, 5)
  assert.equal(state.animate, false)
  state = getScrollVisibility(state, 100, 60, 1000)
  assert.equal(state.offset, 60)
  state = getScrollVisibility(state, 94, 60, 1000)
  assert.equal(state.offset, 60)
  state = getScrollVisibility(state, 87, 60, 1000)
  assert.equal(state.offset, 0)
  assert.equal(state.animate, true)
  state = getScrollVisibility({ ...state, offset: 24 }, 90, 60, 1000)
  assert.equal(state.offset, 27)
  assert.equal(state.animate, false)
  assert.equal(getScrollVisibility(state, -5, 60, 1000).offset, 0)
})

test('ignores overscroll bounce at the bottom and works with resized or empty panels', () => {
  const state = { position: 100, offset: 60, upTravel: 0, animate: false }
  assert.equal(getScrollVisibility(state, 120, 60, 100), state)
  assert.equal(getScrollVisibility(state, 150, 40, 1000).offset, 40)
  assert.equal(getScrollVisibility(state, 0, 0, 0).offset, 0)
})

test('hides the entire panel including the header gap and preserves that gap on reveal', () => {
  const height = 60
  const inset = 16
  const initial = { position: 0, offset: 0, upTravel: 0, animate: false }
  const hidden = getScrollVisibility(initial, 100, height + inset, 1000)
  assert.equal(inset - hidden.offset + height, 0)
  const revealed = getScrollVisibility(hidden, 80, height + inset, 1000)
  assert.equal(inset - revealed.offset, inset)
})

test('finishes a short downward gesture without leaving a visible strip', () => {
  const state = { position: 200, offset: 63, upTravel: 0, animate: false }
  const finished = finishHiding(state, 12.5)
  assert.equal(finished.offset, 75.5)
  assert.equal(finished.animate, true)
  assert.equal(12.5 - (finished.offset - state.offset), 0)
  assert.equal(finishHiding(state, -2).offset, state.offset)
  const reversed = getScrollVisibility({ ...finished, offset: 70 }, 204, 76, 1000)
  assert.equal(reversed.offset, 74)
  assert.equal(reversed.animate, false)
  assert.equal(getScrollVisibility(finished, 180, 76, 1000).offset, 0)
})
