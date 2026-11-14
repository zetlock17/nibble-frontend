import { useEffect, useState } from 'react'
import { WeatherCard } from './WeatherCard'
import { loadWeather, WeatherNotFoundError } from './weather-api'
import type { WeatherState } from './weather'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export function WeatherWidget({ cityId, timeZone }: { cityId: number; timeZone: string }) {
  const [state, setState] = useState<WeatherState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    loadWeather({ cityId }, apiBase, signal).then((forecast) => {
      if (!controller.signal.aborted) {
        setNow(Date.now())
        setState({ status: 'ready', forecast: { ...forecast, location: { ...forecast.location, timeZone } } })
      }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ status: error instanceof WeatherNotFoundError ? 'not-found' : 'error' })
    })
    return () => controller.abort()
  }, [cityId, timeZone, attempt])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }

  return <WeatherCard state={state} now={now} onRetry={retry} />
}
