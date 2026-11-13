import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

const originalWindow = globalThis.window
const originalDocument = globalThis.document

afterEach(() => {
  globalThis.window = originalWindow
  globalThis.document = originalDocument
})

async function setup(name) {
  const scripts = []
  let onTimeout
  globalThis.window = {
    setTimeout(callback) { onTimeout = callback; return 1 },
    clearTimeout() {},
  }
  globalThis.document = {
    createElement() { return { remove() { this.removed = true } } },
    head: { append(script) { scripts.push(script) } },
  }
  const { loadYandexMaps } = await import(`./yandex-maps.ts?test=${name}`)
  return { loadYandexMaps, scripts, timeout: () => onTimeout() }
}

test('shares SDK loading between concurrent mounts and waits for API readiness', async () => {
  const { loadYandexMaps, scripts } = await setup('concurrent')
  let ready
  const api = { ready: new Promise((resolve) => { ready = resolve }) }
  const first = loadYandexMaps('test key&')
  assert.equal(loadYandexMaps('test key&'), first)
  assert.equal(scripts.length, 1)
  assert.equal(new URL(scripts[0].src).searchParams.get('apikey'), 'test key&')
  assert.equal(new URL(scripts[0].src).searchParams.get('lang'), 'ru_RU')
  window.ymaps3 = api
  let resolved = false
  first.then(() => { resolved = true })
  const loading = scripts[0].onload()
  await Promise.resolve()
  assert.equal(resolved, false)
  ready()
  await loading
  assert.equal(await first, api)
})

test('removes failed script and allows another attempt', async () => {
  const { loadYandexMaps, scripts } = await setup('retry')
  const failed = loadYandexMaps('test')
  scripts[0].onerror()
  await assert.rejects(failed)
  assert.equal(scripts[0].removed, true)
  const retry = loadYandexMaps('test')
  assert.equal(scripts.length, 2)
  const api = { ready: Promise.resolve() }
  window.ymaps3 = api
  await scripts[1].onload()
  assert.equal(await retry, api)
})

test('rejects stalled loading after timeout', async () => {
  const { loadYandexMaps, scripts, timeout } = await setup('timeout')
  const pending = loadYandexMaps('test')
  timeout()
  await assert.rejects(pending)
  assert.equal(scripts[0].removed, true)
})

test('handles SDK readiness rejection', async () => {
  const { loadYandexMaps, scripts } = await setup('ready-error')
  const pending = loadYandexMaps('test')
  window.ymaps3 = { ready: Promise.reject(new Error('Invalid key')) }
  await scripts[0].onload()
  await assert.rejects(pending)
  assert.equal(scripts[0].removed, true)
})
