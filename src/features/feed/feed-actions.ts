import { authFetch } from '@/features/auth/auth-api'

export const setLike = (postId: string, liked: boolean) => authFetch(`/posts/${postId}/like`, { method: liked ? 'POST' : 'DELETE' })
export const setFollow = (userId: string, follow: boolean) => authFetch(`/users/${userId}/follow`, { method: follow ? 'PUT' : 'DELETE' })

export async function uploadImage(file: File) {
  const body = new FormData()
  body.append('file', file)
  const data = await (await authFetch('/files/image', { method: 'POST', body })).json() as { key?: unknown }
  if (typeof data.key !== 'string' || !data.key) throw new Error('Invalid upload response')
  return data.key
}

export type NewPost = { text: string; mediaKeys: string[]; spotId?: number; speciesIds: number[] }

export async function createPost({ text, mediaKeys, spotId, speciesIds }: NewPost) {
  await authFetch('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      media: mediaKeys,
      spot_id: spotId ?? null,
      species: speciesIds.map((id) => ({ species_id: id })),
      show_spot: spotId !== undefined,
      show_date: false,
    }),
  })
}
