export type Place = {
  id: string
  name: string
  area?: string
  image?: string
  images?: readonly string[]
  description?: string
  fishIds: readonly string[]
  fishingAccess?: string
  fishingFrom?: readonly ('shore' | 'boat')[]
  details?: string
  shore?: string
  preparation?: string
}
