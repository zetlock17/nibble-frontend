import { authFetch } from '../auth/authed-fetch.ts'

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

export type FeedComment = { id: string; text: string | null; authorId: string | null; authorName: string; createdAt: string }
export type CommentsPage = { comments: FeedComment[]; nextCursor: number | null }

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseComment(value: unknown): FeedComment {
  if (!record(value) || typeof value.id !== 'number' || typeof value.created_at !== 'string') throw new Error('Invalid comment')
  const author = record(value.author) && typeof value.author.id === 'number' && typeof value.author.display_name === 'string' ? value.author : null
  const hidden = value.is_hidden === true || typeof value.text !== 'string'
  return {
    id: String(value.id),
    text: hidden ? null : String(value.text),
    authorId: author ? String(author.id) : null,
    authorName: author ? String(author.display_name) : 'Автор неизвестен',
    createdAt: value.created_at,
  }
}

export function parseCommentsPage(value: unknown): CommentsPage {
  if (!record(value) || !Array.isArray(value.items)) throw new Error('Invalid comments page')
  const cursor = value.next_cursor
  if (cursor != null && typeof cursor !== 'number') throw new Error('Invalid comments cursor')
  return { comments: value.items.map(parseComment), nextCursor: cursor ?? null }
}

export async function loadComments(postId: string, cursor: number | null, signal: AbortSignal) {
  const query = cursor === null ? 'limit=20' : `limit=20&cursor=${cursor}`
  return parseCommentsPage(await (await authFetch(`/posts/${postId}/comments?${query}`, { signal })).json())
}

export async function addComment(postId: string, text: string) {
  const response = await authFetch(`/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
  return parseComment(await response.json())
}

export const deleteComment = (postId: string, commentId: string) => authFetch(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' })
