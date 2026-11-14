import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { loadSpecies, loadSpeciesDetails, loadFishingMethods, speciesToFish } from './species-api.ts'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
const short = { id: 12, name: 'Корюшка', short_description: 'Небольшая рыба', image_url: '', months: [] }
const details = { ...short, latin_name: null, description: 'Описание', identification: 'Признаки', typical_length_cm: 20, typical_weight_g: 60 }
const signal = new AbortController().signal
const response = (data) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })

test('maps numeric IDs, nullable details, months and unknown season without mock data', () => {
  const fish = speciesToFish(details)
  assert.equal(fish.id, '12')
  assert.equal(fish.image, undefined)
  assert.equal(fish.period, undefined)
  assert.deepEqual(fish.seasons, [])
  assert.equal(fish.details.description, 'Описание')
  assert.equal(fish.details.identification, 'Признаки')
  assert.equal(fish.details.typicalLengthCm, 20)
  assert.equal(fish.details.typicalWeightG, 60)
  assert.equal(fish.details.latinName, undefined)
  const seasonal = speciesToFish({ ...short, months: [12, 1, 3, 3], image_url: 'https://example.com/fish.jpg' })
  assert.deepEqual(seasonal.catchMonths, [1, 3, 12])
  assert.deepEqual(seasonal.seasons, ['winter', 'spring'])
  assert.equal(seasonal.period, 'Янв, Мар, Дек')
  assert.equal(seasonal.image, 'https://example.com/fish.jpg')
  assert.equal(speciesToFish({ ...short, image_url: 'javascript:alert(1)' }).image, undefined)
  assert.equal(speciesToFish({ ...short, months: Array.from({ length: 12 }, (_, i) => i + 1) }).period, 'Круглый год')
})

test('requests species with encoded query and backend Season values; omits all', async () => {
  const requests = []
  globalThis.fetch = async (url, options) => { requests.push({ url, options }); return response([short]) }
  assert.equal((await loadSpecies('', 'all', '/api/', signal))[0].id, '12')
  assert.equal(requests[0].url, '/api/species')
  for (const season of ['winter', 'spring', 'summer', 'autumn']) {
    await loadSpecies('  Ёрш & окунь  ', season, '/api', signal)
    const url = new URL(requests.at(-1).url, 'https://example.com')
    assert.equal(url.searchParams.get('q'), 'Ёрш & окунь')
    assert.equal(url.searchParams.get('season'), season)
    assert.equal(requests.at(-1).options.signal, signal)
  }
})

test('loads detail endpoint and methods with string IDs', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(url, '/api/species/12')
    return response(details)
  }
  assert.equal((await loadSpeciesDetails('12', '/api', signal)).details.typicalWeightG, 60)
  globalThis.fetch = async (url) => {
    assert.equal(url, '/api/fishing-methods')
    return response([{ id: 8, name: 'Спиннинг' }])
  }
  assert.deepEqual(await loadFishingMethods('/api', signal), [{ value: '8', label: 'Спиннинг' }])
})

test('rejects HTTP errors, malformed data, mismatching detail ID and invalid identifiers', async () => {
  globalThis.fetch = async () => new Response(null, { status: 503 })
  await assert.rejects(loadSpecies('', 'all', '/api', signal), /503/)
  for (const data of [null, {}, [{ ...short, id: '12' }], [{ ...short, months: [13] }]]) {
    globalThis.fetch = async () => response(data)
    await assert.rejects(loadSpecies('', 'all', '/api', signal))
  }
  for (const data of [{ ...details, id: 13 }, { ...details, typical_weight_g: -1 }, short]) {
    globalThis.fetch = async () => response(data)
    await assert.rejects(loadSpeciesDetails('12', '/api', signal))
  }
  for (const id of ['cod', '../12', '0', '9007199254740993']) await assert.rejects(loadSpeciesDetails(id, '/api', signal))
  globalThis.fetch = async () => response([{ id: 1, name: '' }])
  await assert.rejects(loadFishingMethods('/api', signal))
})
