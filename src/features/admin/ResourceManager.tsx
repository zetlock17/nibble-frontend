import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import fishIcon from '@/assets/icons/fishing/fish.svg'
import { Button } from '@/components/ui/button/Button'
import { SearchSelect } from '@/components/ui/select/SearchSelect'
import { uploadImage } from '@/features/feed/feed-actions'
import { adminError, adminGet, adminSend, deleteFile, useAdminData } from './admin-api'
import type { Option } from './admin-api'
import { monthNames, optionPaths } from './resources'
import type { Field, Item, OptionSource, Resource, Values } from './resources'

export const fieldClass = 'min-h-11 w-full rounded-pill border border-divider bg-surface px-4 text-sm text-text outline-none'
const areaClass = 'min-h-32 w-full rounded-3xl border border-divider bg-surface p-4 text-sm leading-6 text-text outline-none'

function useOptions(sources: readonly OptionSource[]) {
  const [options, setOptions] = useState<Partial<Record<OptionSource, Option[]>>>({})
  const [failed, setFailed] = useState(false)
  const key = sources.join(',')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all(sources.map(async (source) => {
      const items = await adminGet<Item[]>(optionPaths[source].path, controller.signal)
      return [source, items.map((item) => ({ value: String(item.id), label: optionPaths[source].label(item) }))] as const
    })).then((entries) => { if (!controller.signal.aborted) setOptions(Object.fromEntries(entries)) })
      .catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
    // sources меняется только вместе с key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { options, failed }
}

function validate(fields: readonly Field[], values: Values, creating: boolean) {
  for (const field of fields) {
    const value = values[field.key]
    if (field.required && (field.kind !== 'image' || creating) && (typeof value === 'string' ? !value.trim() : !value)) return `Заполните поле «${field.label}».`
    if (field.kind === 'number' && typeof value === 'string' && value.trim() && !/^\d+$/.test(value.trim())) return `В поле «${field.label}» нужно целое число.`
    if (field.kind === 'decimal' && typeof value === 'string' && value.trim() && !Number.isFinite(Number(value))) return `В поле «${field.label}» нужно число.`
  }
  if (typeof values.lat === 'string' && Math.abs(Number(values.lat)) > 90) return 'Широта должна быть от −90 до 90.'
  if (typeof values.lon === 'string' && Math.abs(Number(values.lon)) > 180) return 'Долгота должна быть от −180 до 180.'
  return ''
}

// Файл попадает на сервер сразу после выбора. Пока запись не сохранена, «Убрать» удаляет его оттуда.
function ImageField({ value, currentUrl, onChange, label }: { value: string; currentUrl?: string; onChange: (key: string) => void; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<{ status: 'idle' | 'busy' | 'error'; preview?: string }>({ status: 'idle' })
  const previewRef = useRef<string>(undefined)

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current) }, [])

  function setPreview(url?: string) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = url
    setState((current) => ({ ...current, preview: url }))
  }

  async function pick(file?: File) {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) { setState({ status: 'error', preview: state.preview }); return }
    setState({ status: 'busy', preview: state.preview })
    try {
      const key = await uploadImage(file)
      if (value) void deleteFile(value)
      onChange(key)
      setPreview(URL.createObjectURL(file))
      setState((current) => ({ ...current, status: 'idle' }))
    } catch { setState({ status: 'error', preview: state.preview }) }
  }

  function discard() {
    if (value) void deleteFile(value)
    onChange('')
    setPreview(undefined)
    setState({ status: 'idle' })
  }

  const shown = value ? state.preview : currentUrl
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex h-40 w-full max-w-72 items-center justify-center overflow-hidden rounded-3xl bg-accent-soft">
        {shown ? <img src={shown} alt={value ? 'Новое фото' : 'Текущее фото'} className="size-full object-cover" /> : <span className="px-4 text-center text-sm text-text-muted">Фото не выбрано</span>}
      </div>
      <p className="m-0 text-xs text-text-muted" role="status">
        {state.status === 'busy' ? 'Загружаем фото…' : value ? 'Новое фото. Оно заменит прежнее после сохранения.' : currentUrl ? 'Текущее фото. Чтобы заменить его, выберите новое.' : 'JPEG или PNG до 10 МБ.'}
      </p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" aria-label={label} className="sr-only" tabIndex={-1} onChange={(event) => { void pick(event.target.files?.[0]); event.target.value = '' }} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={state.status === 'busy'} onClick={() => inputRef.current?.click()}>{shown ? 'Заменить фото' : 'Выбрать фото'}</Button>
        {value && <Button variant="secondary" disabled={state.status === 'busy'} onClick={discard}>Убрать новое фото</Button>}
      </div>
      {state.status === 'error' && <p className="m-0 text-xs text-danger" role="alert">Не удалось загрузить фото. Нужен JPEG или PNG до 10 МБ.</p>}
    </div>
  )
}

function FieldInput({ field, value, currentUrl, options, onChange, id }: { field: Field; value: Values[string]; currentUrl?: string; options: Option[]; onChange: (value: Values[string]) => void; id: string }) {
  const stringValue = typeof value === 'string' ? value : ''
  const listValue = Array.isArray(value) ? value : []
  switch (field.kind) {
    case 'textarea': return <textarea id={id} className={areaClass} maxLength={field.maxLength} value={stringValue} onChange={(event) => onChange(event.target.value)} />
    case 'checkbox': return <input id={id} type="checkbox" className="size-5 accent-focus" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
    case 'select': return (
      <select id={id} className={fieldClass} value={stringValue} onChange={(event) => onChange(event.target.value)}>
        <option value="">Выберите…</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    )
    case 'multi': return <SearchSelect label={field.label} placeholder="Выбрать" icon={fishIcon} options={options} value={listValue} onChange={onChange} multiple />
    case 'months': return (
      <div className="flex flex-wrap gap-2" role="group" aria-label={field.label}>
        {monthNames.map((name, index) => {
          const month = String(index + 1)
          const checked = listValue.includes(month)
          return (
            <label key={month} className={`inline-flex min-h-9.5 cursor-pointer items-center rounded-pill border border-divider px-3 text-sm ${checked ? 'bg-selection font-bold text-focus' : 'bg-surface'}`}>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => onChange(checked ? listValue.filter((item) => item !== month) : [...listValue, month])} />{name}
            </label>
          )
        })}
      </div>
    )
    case 'tags': return <input id={id} className={fieldClass} value={listValue.join(',')} onChange={(event) => onChange(event.target.value.split(','))} />
    case 'image': return <ImageField value={stringValue} currentUrl={currentUrl} onChange={onChange} label={field.label} />
    default: return <input id={id} className={fieldClass} type="text" inputMode={field.kind === 'number' ? 'numeric' : field.kind === 'decimal' ? 'decimal' : undefined} maxLength={field.maxLength} value={stringValue} onChange={(event) => onChange(event.target.value)} />
  }
}

function ResourceForm({ resource, initial, itemId, onDone, onCancel }: { resource: Resource; initial: Values; itemId: number | null; onDone: () => void; onCancel: () => void }) {
  const formId = useId()
  const [values, setValues] = useState(initial)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const creating = itemId === null
  const sources = [...new Set(resource.fields.flatMap((field) => field.options ? [field.options] : []))]
  const { options, failed } = useOptions(sources)

  function cancel() {
    for (const field of resource.fields) {
      const key = values[field.key]
      if (field.kind === 'image' && typeof key === 'string' && key) void deleteFile(key)
    }
    onCancel()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const error = validate(resource.fields, values, creating)
    if (error) { setMessage(error); return }
    setBusy(true)
    setMessage('')
    try {
      await adminSend(creating ? resource.createPath : resource.itemPath(itemId), creating ? 'POST' : 'PATCH', resource.toBody(values, creating))
      onDone()
    } catch (cause) {
      setMessage(adminError(cause))
      setBusy(false)
    }
  }

  return (
    <form className="flex flex-col gap-5 rounded-4xl bg-surface p-4 sm:p-6" onSubmit={submit} aria-label={creating ? `Добавить ${resource.singular}` : `Изменить ${resource.singular}`}>
      <h2 className="m-0 text-xl font-extrabold">{creating ? `Добавить ${resource.singular}` : `Изменить ${resource.singular}`}</h2>
      {failed && <p className="m-0 text-sm text-danger" role="alert">Не удалось загрузить списки для выбора. Закройте форму и откройте снова.</p>}
      {resource.fields.map((field) => {
        const id = `${formId}-${field.key}`
        return (
          <div key={field.key} className={field.kind === 'checkbox' ? 'flex items-center gap-3' : 'flex flex-col gap-2'}>
            <label htmlFor={id} className="text-sm font-bold">{field.label}{field.required && (field.kind !== 'image' || creating) ? ' *' : ''}</label>
            <FieldInput id={id} field={field} value={values[field.key]} currentUrl={field.previewKey && typeof values[field.previewKey] === 'string' ? String(values[field.previewKey]) || undefined : undefined} options={field.options ? options[field.options] ?? [] : []} onChange={(value) => { setValues((current) => ({ ...current, [field.key]: value })); setMessage('') }} />
            {field.hint && <p className="m-0 text-xs text-text-muted">{field.hint}</p>}
          </div>
        )
      })}
      {message && <p className="m-0 text-sm text-danger" role="alert">{message}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="md" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить'}</Button>
        <Button variant="secondary" size="md" onClick={cancel} disabled={busy}>Отмена</Button>
      </div>
    </form>
  )
}

export function ResourceManager({ resource }: { resource: Resource }) {
  const [query, setQuery] = useState('')
  const [applied, setApplied] = useState('')
  const [editor, setEditor] = useState<{ id: number | null; initial: Values } | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [opening, setOpening] = useState<number | null>(null)
  const search = applied ? `?q=${encodeURIComponent(applied)}` : ''
  const list = useAdminData<Item[]>(resource.listPath(search))

  async function edit(item: Item) {
    setMessage('')
    setOpening(item.id)
    try {
      const full = resource.detailPath ? await adminGet<Item>(resource.detailPath(item.id)) : item
      setEditor({ id: item.id, initial: resource.toForm(full) })
    } catch (cause) { setMessage(adminError(cause)) } finally { setOpening(null) }
  }

  async function remove(id: number) {
    setConfirmId(null)
    setMessage('')
    try {
      await adminSend(resource.itemPath(id), 'DELETE')
      list.reload()
    } catch (cause) { setMessage(adminError(cause)) }
  }

  if (editor) {
    return <ResourceForm key={editor.id ?? 'new'} resource={resource} initial={editor.initial} itemId={editor.id} onCancel={() => setEditor(null)} onDone={() => { setEditor(null); list.reload() }} />
  }

  return (
    <section className="flex flex-col gap-4" aria-label={resource.title}>
      <div className="flex flex-wrap items-center gap-3">
        {resource.searchable && (
          <form className="flex min-w-0 flex-1 gap-2" role="search" onSubmit={(event) => { event.preventDefault(); setApplied(query.trim()) }}>
            <input className={`${fieldClass} max-w-80`} type="search" aria-label={`Поиск: ${resource.title}`} placeholder="Поиск по названию" value={query} onChange={(event) => setQuery(event.target.value)} />
            <Button type="submit" variant="secondary" size="md">Найти</Button>
          </form>
        )}
        <Button size="md" className="ml-auto" onClick={() => { setMessage(''); setEditor({ id: null, initial: resource.toForm({ id: 0 }) }) }}>Добавить {resource.singular}</Button>
      </div>
      {message && <p className="m-0 text-sm text-danger" role="alert">{message}</p>}
      {list.status === 'loading' ? <p className="m-0 rounded-4xl bg-surface p-6 text-sm text-text-muted" role="status">Загружаем…</p>
        : list.status === 'error' ? (
          <div className="rounded-4xl bg-surface p-6" role="alert">
            <p className="m-0 text-sm text-text-muted">Не удалось загрузить список. Проверьте соединение и повторите.</p>
            <Button className="mt-4" variant="secondary" onClick={list.reload}>Повторить</Button>
          </div>
        ) : !list.data?.length ? <p className="m-0 rounded-4xl bg-surface p-6 text-sm text-text-muted" role="status">{applied ? 'Ничего не найдено. Попробуйте другой запрос.' : 'Записей пока нет.'}</p>
        : (
          <div className="overflow-x-auto rounded-4xl bg-surface p-2 sm:p-4">
            <table className="w-full min-w-120 border-collapse text-left text-sm">
              <thead><tr>{resource.columns.map((column) => <th key={column.label} scope="col" className="px-3 py-2 text-xs font-bold text-text-muted">{column.label}</th>)}<th scope="col" className="px-3 py-2"><span className="sr-only">Действия</span></th></tr></thead>
              <tbody>
                {list.data.map((item) => (
                  <tr key={item.id} className="border-t border-navigation-divider">
                    {resource.columns.map((column) => <td key={column.label} className="max-w-72 px-3 py-3 wrap-anywhere">{column.value(item)}</td>)}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="secondary" disabled={opening === item.id} onClick={() => void edit(item)}>{opening === item.id ? 'Открываем…' : 'Изменить'}</Button>
                        {resource.canDelete && (confirmId === item.id ? <>
                          <Button variant="danger" onClick={() => void remove(item.id)}>Удалить насовсем</Button>
                          <Button variant="secondary" onClick={() => setConfirmId(null)}>Отмена</Button>
                        </> : <Button variant="secondary" onClick={() => setConfirmId(item.id)}>Удалить</Button>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  )
}
