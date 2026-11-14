import { useEffect, useState } from 'react'
import { TackleCatalog } from './TackleCatalog'
import { fetchTackle, type TackleState } from './tackle'

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export function TackleSection() {
  const [state, setState] = useState<TackleState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    fetchTackle(apiBase, controller.signal).then(setState).catch(() => {
      if (!controller.signal.aborted) setState({ status: 'error' })
    })
    return () => controller.abort()
  }, [])

  return <TackleCatalog state={state} />
}
