import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button/Button'
import type { Place } from './place'
import { loadSpotDetails } from './spots'
import { PlaceDetails } from './PlaceDetails'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export function SpotDetails({ place }: { place: Place }) {
  const [result, setResult] = useState<{ data: Place } | { error: true } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    loadSpotDetails(place.id, apiBase, signal).then((data) => {
      if (!controller.signal.aborted) setResult({ data })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ error: true })
    })
    return () => controller.abort()
  }, [place.id, attempt])

  if (result && 'data' in result) return <PlaceDetails place={result.data} />
  return (
    <div className="flex flex-col items-start gap-3 rounded-4xl bg-surface p-5" role="status">
      <h2 className="m-0 text-2xl font-extrabold">{place.name}</h2>
      <p className="m-0 text-sm text-text-muted">{result ? 'Не удалось загрузить подробности места. Попробуйте ещё раз.' : 'Загружаем подробности места…'}</p>
      {result && <Button onClick={() => { setResult(null); setAttempt((value) => value + 1) }}>Повторить</Button>}
    </div>
  )
}
