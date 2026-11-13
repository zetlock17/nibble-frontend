export function movePhoto(index: number, direction: -1 | 1, count: number) {
  return Math.max(0, Math.min(Math.max(0, count - 1), index + direction))
}
