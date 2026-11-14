export type Values = Record<string, string | boolean | string[]>
export type Item = { id: number } & Record<string, unknown>
export type OptionSource = 'cities' | 'species' | 'methods' | 'categories'
export type FieldKind = 'text' | 'textarea' | 'number' | 'decimal' | 'checkbox' | 'select' | 'multi' | 'months' | 'tags' | 'image'
export type Field = { previewKey?: string; key: string; label: string; kind: FieldKind; required?: boolean; options?: OptionSource; hint?: string; maxLength?: number }

export type Resource = {
  id: string
  title: string
  singular: string
  searchable: boolean
  canDelete: boolean
  listPath: (query: string) => string
  itemPath: (id: number) => string
  // Путь для чтения полной записи перед правкой, если список возвращает краткие данные.
  detailPath?: (id: number) => string
  createPath: string
  columns: { label: string; value: (item: Item) => string }[]
  fields: Field[]
  toForm: (item: Item) => Values
  toBody: (values: Values, creating: boolean) => Record<string, unknown>
}

export const optionPaths: Record<OptionSource, { path: string; label: (item: Item) => string }> = {
  cities: { path: '/cities', label: (item) => String(item.name) },
  species: { path: '/species', label: (item) => String(item.name) },
  methods: { path: '/fishing-methods', label: (item) => String(item.name) },
  categories: { path: '/admin/tackle/categories', label: (item) => String(item.name) },
}

export const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

const text = (value: unknown) => typeof value === 'string' ? value : ''
const list = (value: unknown) => Array.isArray(value) ? value.map(String) : []
const number = (value: unknown) => typeof value === 'number' ? String(value) : ''
const str = (value: Values[string] | undefined) => typeof value === 'string' ? value.trim() : ''
const orNull = (value: Values[string] | undefined) => str(value) || null
const int = (value: Values[string] | undefined) => str(value) === '' ? null : Number(str(value))
const ints = (value: Values[string] | undefined) => Array.isArray(value) ? value.map(Number) : []
const textList = (value: Values[string] | undefined) => Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : []

export const resources: Resource[] = [
  {
    id: 'species', title: 'Рыбы', singular: 'рыбу', searchable: true, canDelete: true,
    listPath: (query) => `/admin/species${query}`, itemPath: (id) => `/admin/species/${id}`, createPath: '/admin/species',
    columns: [
      { label: 'Название', value: (item) => text(item.name) },
      { label: 'Кратко', value: (item) => text(item.short_description) },
      { label: 'Сезон', value: (item) => list(item.months).map((month) => monthNames[Number(month) - 1]).join(', ') || 'не указан' },
    ],
    fields: [
      { key: 'name', label: 'Название', kind: 'text', required: true, maxLength: 100 },
      { key: 'short_description', label: 'Краткое описание', kind: 'text', required: true, maxLength: 200 },
      { key: 'latin_name', label: 'Латинское название', kind: 'text', maxLength: 150 },
      { key: 'image_key', label: 'Фото', kind: 'image', required: true, previewKey: 'image_url' },
      { key: 'months', label: 'Месяцы клёва', kind: 'months' },
      { key: 'typical_length_cm', label: 'Обычная длина, см', kind: 'number' },
      { key: 'typical_weight_g', label: 'Обычный вес, г', kind: 'number' },
      { key: 'description', label: 'Описание', kind: 'textarea', maxLength: 10000 },
      { key: 'identification', label: 'Как узнать рыбу', kind: 'textarea', maxLength: 10000 },
      { key: 'aliases', label: 'Другие названия', kind: 'tags', hint: 'Через запятую.' },
    ],
    toForm: (item) => ({
      name: text(item.name), short_description: text(item.short_description), latin_name: text(item.latin_name),
      image_key: '', image_url: text(item.image_url), months: list(item.months), typical_length_cm: number(item.typical_length_cm), typical_weight_g: number(item.typical_weight_g),
      description: text(item.description), identification: text(item.identification), aliases: list(item.aliases),
    }),
    toBody: (values) => ({
      name: str(values.name), short_description: str(values.short_description), latin_name: orNull(values.latin_name),
      ...(str(values.image_key) ? { image_key: str(values.image_key) } : {}),
      months: ints(values.months), typical_length_cm: int(values.typical_length_cm), typical_weight_g: int(values.typical_weight_g),
      description: orNull(values.description), identification: orNull(values.identification), aliases: textList(values.aliases),
    }),
  },
  {
    id: 'methods', title: 'Способы ловли', singular: 'способ ловли', searchable: false, canDelete: true,
    listPath: () => '/fishing-methods', itemPath: (id) => `/admin/fishing-methods/${id}`, createPath: '/admin/fishing-methods',
    columns: [{ label: 'Название', value: (item) => text(item.name) }],
    fields: [{ key: 'name', label: 'Название', kind: 'text', required: true, maxLength: 100 }],
    toForm: (item) => ({ name: text(item.name) }),
    toBody: (values) => ({ name: str(values.name) }),
  },
  {
    id: 'spots', title: 'Места', singular: 'место', searchable: true, canDelete: true,
    listPath: (query) => `/admin/spots${query}`, itemPath: (id) => `/admin/spots/${id}`, detailPath: (id) => `/admin/spots/${id}`, createPath: '/admin/spots',
    columns: [
      { label: 'Название', value: (item) => text(item.name) },
      { label: 'Район', value: (item) => text(item.area) || 'не указан' },
      { label: 'Статус', value: (item) => item.is_active === false ? 'скрыто' : 'на карте' },
    ],
    fields: [
      { key: 'name', label: 'Название', kind: 'text', required: true, maxLength: 150 },
      { key: 'city_id', label: 'Город', kind: 'select', options: 'cities', required: true },
      { key: 'area', label: 'Район', kind: 'text', maxLength: 150 },
      { key: 'lat', label: 'Широта', kind: 'decimal', required: true, hint: 'От −90 до 90, дробная часть через точку.' },
      { key: 'lon', label: 'Долгота', kind: 'decimal', required: true, hint: 'От −180 до 180.' },
      { key: 'photo_key', label: 'Фото', kind: 'image', previewKey: 'photo_url' },
      { key: 'description', label: 'Описание', kind: 'textarea', maxLength: 5000 },
      { key: 'species_ids', label: 'Рыбы', kind: 'multi', options: 'species' },
      { key: 'method_ids', label: 'Способы ловли', kind: 'multi', options: 'methods' },
      { key: 'aliases', label: 'Другие названия', kind: 'tags', hint: 'Через запятую.' },
      { key: 'is_active', label: 'Показывать на карте', kind: 'checkbox' },
    ],
    toForm: (item) => ({
      name: text(item.name), city_id: number(item.city_id), area: text(item.area), lat: text(item.lat), lon: text(item.lon), photo_key: '', photo_url: text(item.photo_url),
      description: text(item.description),
      species_ids: Array.isArray(item.species) ? item.species.map((entry) => String((entry as { id: unknown }).id)) : [],
      method_ids: Array.isArray(item.methods) ? item.methods.map((entry) => String((entry as { id: unknown }).id)) : [],
      aliases: list(item.aliases), is_active: item.is_active !== false,
    }),
    toBody: (values) => ({
      name: str(values.name), city_id: int(values.city_id), area: orNull(values.area), lat: str(values.lat), lon: str(values.lon),
      ...(str(values.photo_key) ? { photo_key: str(values.photo_key) } : {}),
      description: orNull(values.description), species_ids: ints(values.species_ids), method_ids: ints(values.method_ids),
      aliases: textList(values.aliases), is_active: values.is_active === true,
    }),
  },
  {
    id: 'categories', title: 'Категории снастей', singular: 'категорию', searchable: false, canDelete: true,
    listPath: () => '/admin/tackle/categories', itemPath: (id) => `/admin/tackle/categories/${id}`, createPath: '/admin/tackle/categories',
    columns: [{ label: 'Название', value: (item) => text(item.name) }, { label: 'Порядок', value: (item) => number(item.sort_order) }],
    fields: [
      { key: 'name', label: 'Название', kind: 'text', required: true, maxLength: 100 },
      { key: 'sort_order', label: 'Порядок в списке', kind: 'number', hint: 'Меньше число — выше в списке.' },
    ],
    toForm: (item) => ({ name: text(item.name), sort_order: number(item.sort_order) }),
    toBody: (values) => ({ name: str(values.name), sort_order: int(values.sort_order) ?? 0 }),
  },
  {
    id: 'links', title: 'Снасти', singular: 'ссылку на снасть', searchable: true, canDelete: true,
    listPath: (query) => `/admin/tackle/links${query}`, itemPath: (id) => `/admin/tackle/links/${id}`, createPath: '/admin/tackle/links',
    columns: [
      { label: 'Название', value: (item) => text(item.title) },
      { label: 'Цена от, ₽', value: (item) => number(item.price_from_rub) || 'не указана' },
      { label: 'Статус', value: (item) => item.is_active === false ? 'скрыто' : 'показывается' },
    ],
    fields: [
      { key: 'title', label: 'Название', kind: 'text', required: true, maxLength: 150 },
      { key: 'url', label: 'Ссылка на товар', kind: 'text', required: true },
      { key: 'category_id', label: 'Категория', kind: 'select', options: 'categories', required: true },
      { key: 'city_id', label: 'Город', kind: 'select', options: 'cities', required: true },
      { key: 'price_from_rub', label: 'Цена от, ₽', kind: 'number' },
      { key: 'image_url', label: 'Адрес картинки', kind: 'text', maxLength: 2000 },
      { key: 'sort_order', label: 'Порядок в списке', kind: 'number' },
      { key: 'is_active', label: 'Показывать в каталоге', kind: 'checkbox' },
    ],
    toForm: (item) => ({
      title: text(item.title), url: text(item.url), category_id: number(item.category_id), city_id: number(item.city_id),
      price_from_rub: number(item.price_from_rub), image_url: text(item.image_url), sort_order: number(item.sort_order), is_active: item.is_active !== false,
    }),
    toBody: (values) => ({
      title: str(values.title), url: str(values.url), category_id: int(values.category_id), city_id: int(values.city_id),
      price_from_rub: int(values.price_from_rub), image_url: orNull(values.image_url), sort_order: int(values.sort_order) ?? 0, is_active: values.is_active === true,
    }),
  },
]
