export const maxPhotoSize = 10 * 1024 * 1024

export function photoError(file: { size: number; type: string }) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Выберите фото в формате JPEG или PNG.'
  if (!file.size) return 'Файл пустой. Выберите другое фото.'
  if (file.size > maxPhotoSize) return 'Фото больше 10 МБ. Уменьшите файл или выберите другое.'
  return ''
}

export function validateCatch(draft: { hasPhoto: boolean; description: string; fishIds: readonly string[]; placeId: string }, fish: readonly { id: string }[], places: readonly { id: string }[]) {
  if (draft.fishIds.some((id) => !fish.some((item) => item.id === id))) return 'Выберите рыбу из списка.'
  if (draft.placeId && !places.some((item) => item.id === draft.placeId)) return 'Выберите место из списка или отметку на карте.'
  if (draft.description.length > 3000) return 'Сократите описание до 3000 символов.'
  if (!draft.hasPhoto && !draft.description.trim()) return 'Добавьте фото или расскажите, как прошла рыбалка.'
  return ''
}
