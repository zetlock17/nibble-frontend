export type City = { id: number; name: string; coordinates: [number, number]; timeZone: string }

export function parseCities(value: unknown): City[] {
  if (!Array.isArray(value)) throw new Error('Invalid city list')
  const ids = new Set<number>()
  return value.map((item: unknown) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) throw new Error('Invalid city')
    const city = item as Record<string, unknown>
    if (typeof city.id !== 'number' || !Number.isSafeInteger(city.id) || city.id <= 0 || ids.has(city.id)
      || typeof city.name !== 'string' || !city.name.trim() || typeof city.lat !== 'string' || !city.lat.trim()
      || typeof city.lon !== 'string' || !city.lon.trim() || typeof city.timezone !== 'string' || !city.timezone.trim()) throw new Error('Invalid city')
    const lat = Number(city.lat), lon = Number(city.lon)
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) throw new Error('Invalid city coordinates')
    try { new Intl.DateTimeFormat('ru-RU', { timeZone: city.timezone }) } catch { throw new Error('Invalid city timezone') }
    ids.add(city.id)
    return { id: city.id, name: city.name.trim(), coordinates: [lon, lat], timeZone: city.timezone }
  })
}

export async function loadCities(apiBase: string, signal: AbortSignal): Promise<City[]> {
  const response = await fetch(`${apiBase.replace(/\/+$/, '')}/cities`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`City request failed: ${response.status}`)
  return parseCities(await response.json())
}
