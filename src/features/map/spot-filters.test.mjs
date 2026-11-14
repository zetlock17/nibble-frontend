import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadFilterOptions, spotsQuery } from './spot-filters.ts'

// node --experimental-strip-types --test src/features/map/spot-filters.test.mjs
test('запрос мест содержит только выбранные фильтры', () => {
  assert.equal(spotsQuery(1), 'city_id=1')
  assert.equal(spotsQuery(1, { speciesId: '4', methodId: '' }), 'city_id=1&species_id=4')
  assert.equal(spotsQuery(2, { speciesId: '4', methodId: '3' }), 'city_id=2&species_id=4&method_id=3')
})

test('варианты фильтра берутся из ответа API и отклоняют неверные данные', async () => {
  const original = globalThis.fetch
  const respond = (body, ok = true) => { globalThis.fetch = async () => ({ ok, status: ok ? 200 : 500, json: async () => body }) }
  try {
    respond([{ id: 1, name: ' Спиннинг ' }])
    assert.deepEqual(await loadFilterOptions('/fishing-methods', '/api/', new AbortController().signal), [{ value: '1', label: 'Спиннинг' }])
    respond([{ id: 'x', name: 'Ошибка' }])
    await assert.rejects(loadFilterOptions('/species', '/api', new AbortController().signal))
    respond([], false)
    await assert.rejects(loadFilterOptions('/species', '/api', new AbortController().signal))
  } finally { globalThis.fetch = original }
})
