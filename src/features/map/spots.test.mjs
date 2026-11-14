import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { loadSpotDetails, loadSpots, parseSpot, parseSpotDetails } from './spots.ts'
import { createSpotMarkers } from './spot-markers.ts'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document
afterEach(() => { globalThis.fetch = originalFetch; globalThis.document = originalDocument })

const spot = { id: 12, city_id: 1, name: 'Бухта Аякс', area: null, lat: '43.029808', lon: '131.940298', photo_url: null }
const details = { ...spot, description: 'Описание места', species: [{ id: 4, name: 'Камбала', image_url: '/fish.png' }], methods: [{ id: 3, name: 'Донная' }] }

test('converts decimal coordinates to longitude/latitude and keeps backend species IDs', () => {
  const parsed = parseSpotDetails(details)
  assert.deepEqual(parsed.coordinates, [131.940298, 43.029808])
  assert.deepEqual(parsed.species, [{ id: '4', name: 'Камбала' }])
  assert.deepEqual(parsed.methods, ['Донная'])
  assert.equal(parsed.image, undefined)
  assert.equal(parsed.description, 'Описание места')
})

test('rejects malformed API data instead of inventing coordinates or using mock records', () => {
  for (const change of [{ lat: null }, { lat: ' ' }, { lat: 91 }, { lon: 'NaN' }, { lon: 181 }, { id: 0 }, { city_id: '1' }, { name: '' }, { photo_url: 'javascript:alert(1)' }, { photo_url: '//other.host/image' }]) {
    assert.throws(() => parseSpot({ ...spot, ...change }))
  }
  assert.throws(() => parseSpotDetails({ ...details, species: [{ name: 'Камбала' }] }))
  assert.throws(() => parseSpotDetails({ ...details, methods: null }))
})

test('loads list and details separately, passes cancellation, and checks HTTP failures', async () => {
  const signal = new AbortController().signal
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    return { ok: true, json: async () => url.includes('?') ? [spot] : details }
  }
  assert.equal((await loadSpots(1, '/api/', signal)).length, 1)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].url, '/api/spots?city_id=1')
  assert.equal(requests[0].options.signal, signal)
  assert.equal((await loadSpotDetails('12', '/api', signal)).description, 'Описание места')
  assert.equal(requests[1].url, '/api/spots/12')
  globalThis.fetch = async () => ({ ok: false, status: 503 })
  await assert.rejects(loadSpots(1, '/api', signal), /503/)
  await assert.rejects(loadSpotDetails('12', '/api', signal), /503/)
})

test('handles empty list and rejects responses from a different city or spot', async () => {
  const signal = new AbortController().signal
  globalThis.fetch = async () => ({ ok: true, json: async () => [] })
  assert.deepEqual(await loadSpots(1, '/api', signal), [])
  globalThis.fetch = async () => ({ ok: true, json: async () => [spot] })
  await assert.rejects(loadSpots(2, '/api', signal), /city/)
  globalThis.fetch = async () => ({ ok: true, json: async () => details })
  await assert.rejects(loadSpotDetails('13', '/api', signal), /ID/)
})

function markerEnvironment() {
  globalThis.document = {
    createElement() {
      return { attributes: {}, setAttribute(key, value) { this.attributes[key] = value }, append() {}, addEventListener(event, callback) { this[event] = callback } }
    },
  }
  const attached = new Set()
  const map = {}
  const api = {
    divIcon: (options) => options,
    marker: (latlng, options) => ({
      latlng, options,
      addTo() { attached.add(this); return this },
      remove() { assert.ok(attached.delete(this)) },
    }),
  }
  return { map, api, attached }
}

test('markers attach containers at real spot coordinates and detach on cleanup', () => {
  const { map, api, attached } = markerEnvironment()
  const place = parseSpot(spot)
  const result = createSpotMarkers(map, api, [place], place.id)
  const marker = [...attached][0]
  assert.deepEqual(marker.latlng, [43.029808, 131.940298])
  assert.ok(marker.options.zIndexOffset > 0)
  assert.deepEqual(result.containers, [{ place, element: marker.options.icon.html }])
  result.remove()
  assert.equal(attached.size, 0)
})

test('removes already attached markers if the map library fails halfway through', () => {
  const { map, api, attached } = markerEnvironment()
  const createMarker = api.marker
  let created = 0
  api.marker = (...args) => {
    if (++created === 2) throw new Error('SDK failed')
    return createMarker(...args)
  }
  assert.throws(() => createSpotMarkers(map, api, [parseSpot(spot), parseSpot({ ...spot, id: 13 })], undefined), /SDK failed/)
  assert.equal(attached.size, 0)
})
