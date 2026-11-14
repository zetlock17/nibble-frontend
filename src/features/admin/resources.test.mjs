import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resources } from './resources.ts'

// node --experimental-strip-types --test src/features/admin/resources.test.mjs
const byId = (id) => resources.find((resource) => resource.id === id)

test('рыба: форма и тело запроса, фото отправляется только после выбора', () => {
  const species = byId('species')
  const form = species.toForm({ id: 1, name: 'Камбала', short_description: 'Донная рыба', months: [5, 6], aliases: ['флаундра'], typical_length_cm: 30, typical_weight_g: null })
  assert.deepEqual(form.months, ['5', '6'])
  assert.equal(form.typical_length_cm, '30')
  assert.equal(form.typical_weight_g, '')
  const body = species.toBody({ ...form, aliases: ['флаундра', ' ', ' камбала '] }, false)
  assert.equal('image_key' in body, false)
  assert.deepEqual([body.months, body.aliases, body.typical_length_cm, body.typical_weight_g, body.latin_name], [[5, 6], ['флаундра', 'камбала'], 30, null, null])
  assert.equal(species.toBody({ ...form, image_key: 'image/abc.jpg' }, true).image_key, 'image/abc.jpg')
})

test('место: связанные рыбы и способы берутся из подробной записи', () => {
  const spots = byId('spots')
  const form = spots.toForm({ id: 3, name: 'Бухта', city_id: 1, lat: '43.1', lon: '131.9', is_active: false, species: [{ id: 4 }], methods: [{ id: 2 }, { id: 5 }] })
  assert.deepEqual([form.species_ids, form.method_ids, form.is_active], [['4'], ['2', '5'], false])
  const body = spots.toBody(form, false)
  assert.deepEqual([body.city_id, body.lat, body.species_ids, body.method_ids, body.is_active, 'photo_key' in body], [1, '43.1', [4], [2, 5], false, false])
})

test('снасть: пустые необязательные поля становятся null, порядок по умолчанию 0', () => {
  const body = byId('links').toBody({ title: ' Удилище ', url: 'https://example.com', category_id: '2', city_id: '1', price_from_rub: '', image_url: '', sort_order: '', is_active: true }, true)
  assert.deepEqual([body.title, body.price_from_rub, body.image_url, body.sort_order, body.category_id], ['Удилище', null, null, 0, 2])
})
