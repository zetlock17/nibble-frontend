export type ScrollVisibility = { position: number; offset: number; upTravel: number; animate: boolean }

export function finishHiding(state: ScrollVisibility, visibleRemainder: number): ScrollVisibility {
  return { ...state, offset: state.offset + Math.max(0, visibleRemainder), upTravel: 0, animate: true }
}

export function getScrollVisibility(state: ScrollVisibility, position: number, height: number, maxScroll: number): ScrollVisibility {
  const top = Math.max(0, Math.min(maxScroll, position))
  const delta = top - state.position
  if (top === 0) return { position: 0, offset: 0, upTravel: 0, animate: state.offset > 0 }
  if (delta === 0) return state
  if (delta > 0) {
    return { position: top, offset: Math.min(height, state.offset + delta), upTravel: 0, animate: false }
  }
  const upTravel = state.upTravel - delta
  return { position: top, offset: upTravel >= 12 ? 0 : state.offset, upTravel, animate: upTravel >= 12 }
}
