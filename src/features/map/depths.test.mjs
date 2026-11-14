import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { afterEach, test } from 'node:test'
import { createDepthLayer, depthBands, depthColor, depthPalette, loadDepths, parseDepths } from './depths.ts'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

const ring = [[131, 43], [132, 43], [132, 44], [131, 43]]
const hole = [[131.1, 43.1], [131.2, 43.1], [131.2, 43.2], [131.1, 43.1]]
function collection(from = 0, to = 2) {
  return {
    type: 'FeatureCollection', attribution: 'NOAA ETOPO 2022',
    features: [{ type: 'Feature', properties: { depth_from: from, depth_to: to }, geometry: { type: 'MultiPolygon', coordinates: [[ring, hole], [ring]] } }],
  }
}

test('validates the boundary: ranges, geometry type, closed rings and coordinate order', () => {
  const data = parseDepths(collection(50, null))
  assert.equal(data.features[0].properties.depth_to, null)
  assert.deepEqual(data.features[0].geometry.coordinates[0], [ring, hole])
  assert.equal(parseDepths({ type: 'FeatureCollection', features: [], attribution: null }).features.length, 0)
  for (const mutate of [
    (d) => { d.features[0].geometry.type = 'Polygon' },
    (d) => { d.features[0].geometry.coordinates = [] },
    (d) => { d.features[0].geometry.coordinates[0][0][0] = [43, 131] },
    (d) => { d.features[0].geometry.coordinates[0][0].pop() },
    (d) => { d.features[0].properties.depth_from = -1 },
    (d) => { d.features[0].properties.depth_to = 0 },
    (d) => { delete d.features[0].properties.depth_to },
    (d) => { d.features[0].properties.depth_to = Infinity },
    (d) => { d.attribution = {} },
  ]) {
    const invalid = structuredClone(collection())
    mutate(invalid)
    assert.throws(() => parseDepths(invalid))
  }
})

test('shares requests by API and city, retries failures, and never substitutes demo data', async () => {
  const urls = []
  let fail = false
  globalThis.fetch = async (url, options) => {
    urls.push(url)
    assert.equal(options.headers.Accept, 'application/json')
    return new Response(JSON.stringify(collection()), { status: fail ? 503 : 200 })
  }
  const first = loadDepths(1, '/test-api/')
  assert.equal(loadDepths(1, '/test-api'), first)
  await first
  await loadDepths(2, '/test-api')
  await loadDepths(1, '/other-api')
  assert.deepEqual(urls, ['/test-api/depths?city_id=1', '/test-api/depths?city_id=2', '/other-api/depths?city_id=1'])
  fail = true
  await assert.rejects(loadDepths(3, '/test-api'), /503/)
  fail = false
  await loadDepths(3, '/test-api')
  assert.equal(urls.length, 5)
  await assert.rejects(loadDepths(0), /city/)
  assert.equal(urls.length, 5)
  globalThis.fetch = async () => new Response(JSON.stringify({ features: [] }))
  await assert.rejects(loadDepths(4, '/test-api'), /collection/)
  globalThis.fetch = async () => new Response(JSON.stringify(collection()))
  await loadDepths(4, '/test-api')
})

test('legend uses actual sorted ranges and the same six theme colors as map features', () => {
  const data = parseDepths({ ...collection(), features: [...collection(50, null).features, ...collection(5, 10).features, ...collection(5, 10).features] })
  assert.deepEqual(depthBands(data), [{ from: 5, to: 10 }, { from: 50, to: null }])
  const css = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8')
  const expected = ['#c8ebff', '#96d2f5', '#64b4eb', '#3c8cd7', '#1e64be', '#0f3c96']
  depthPalette.forEach((color, index) => {
    assert.ok(css.includes(`${color.token}: ${expected[index]};`))
    assert.equal(depthColor(color.from), color)
  })
  assert.equal(depthColor(75).from, 50)
})

function setupLayer(data) {
  const children = new Set()
  const created = []
  const map = {
    addLayer(feature) { assert.ok(!children.has(feature)); children.add(feature) },
    removeLayer(feature) { assert.ok(children.has(feature)); children.delete(feature) },
  }
  const api = { polygon(latlngs, options) { const layer = { latlngs, options }; created.push(layer); return layer } }
  const colors = new Map(depthPalette.map(({ token }) => [token, 'test-color']))
  return { layer: createDepthLayer(map, api, data, colors), children, created }
}

test('draws separate polygons with holes, reuses SDK features, and removes only depth objects', async () => {
  const { layer, children, created } = setupLayer(parseDepths(collection()))
  const marker = { marker: true }
  children.add(marker)
  await layer.show(new AbortController().signal)
  assert.equal(children.size, 3)
  assert.deepEqual(created[0].latlngs, [ring, hole].map((points) => points.map(([lng, lat]) => [lat, lng])))
  assert.deepEqual(created[0].options, { fillColor: 'test-color', fillOpacity: 0.55, stroke: false, interactive: false })
  layer.hide()
  layer.hide()
  assert.deepEqual([...children], [marker])
  await layer.show(new AbortController().signal)
  assert.equal(created.length, 2)
  assert.equal(children.size, 3)
  layer.hide()
})

test('switching off during chunked rendering prevents late polygons and supports immediate re-enable', async () => {
  const data = collection()
  data.features[0].geometry.coordinates = Array.from({ length: 60 }, () => [ring])
  const { layer, children, created } = setupLayer(parseDepths(data))
  const controller = new AbortController()
  const pending = layer.show(controller.signal)
  // The first batch runs before this timer; the second yields to cancellation.
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(children.size, 24)
  controller.abort()
  layer.hide()
  const resumed = layer.show(new AbortController().signal)
  await assert.rejects(pending, { name: 'AbortError' })
  await resumed
  assert.equal(children.size, 60)
  assert.equal(created.length, 60)
  layer.hide()
  assert.equal(children.size, 0)
})
