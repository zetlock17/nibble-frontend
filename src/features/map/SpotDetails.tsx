import { Button } from '@/components/ui/button/Button'
import type { Place } from './place'
import { PlaceDetails } from './PlaceDetails'
import { useSpotDetails } from './use-spot-details'

export function SpotDetails({ place, onOpen }: { place: Place; onOpen: (place: Place) => void }) {
  const { result, retry } = useSpotDetails(place.id)

  if (result && 'data' in result) return <PlaceDetails place={result.data} onOpen={onOpen} />
  return (
    <div className="flex flex-col items-start gap-3 rounded-4xl bg-surface p-5" role="status">
      <h2 className="m-0 text-2xl font-extrabold">{place.name}</h2>
      <p className="m-0 text-sm text-text-muted">{result ? 'Не удалось загрузить подробности места. Попробуйте ещё раз.' : 'Загружаем подробности места…'}</p>
      {result && <Button onClick={retry}>Повторить</Button>}
    </div>
  )
}
