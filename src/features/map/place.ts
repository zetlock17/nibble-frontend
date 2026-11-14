export type Place = {
  id: string
  name: string
  coordinates?: [number, number]
  species?: readonly { id: string; name: string }[]
  methods?: readonly string[]
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
