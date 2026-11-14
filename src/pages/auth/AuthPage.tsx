import { useState } from 'react'
import type { FormEvent } from 'react'
import logo from '@/assets/brand/logo.svg'
import chevronDown from '@/assets/icons/navigation/chevron-down.svg'
import authImage from '@/assets/images/auth/fishermen.webp'
import eyeIcon from '@/assets/icons/actions/eye.svg'
import eyeClosedIcon from '@/assets/icons/actions/eye_closed.svg'
import { Button } from '@/components/ui/button/Button'
import type { City } from '@/features/city/cities'
import type { AuthClient, Credentials } from '@/features/auth/auth-api'

type Props = {
  onBack: () => void
  onSignIn: (credentials: Credentials) => Promise<void>
  client: AuthClient
  cities: City[]
  cityStatus: 'loading' | 'ready' | 'empty' | 'error'
  onRetryCities: () => void
}

const fieldClass = 'min-h-12 w-full rounded-pill border border-divider px-4 text-base font-normal text-text focus-visible:outline-none'
const inputClass = `${fieldClass} bg-search/50`

export function AuthPage({ onBack, onSignIn, client, cities, cityStatus, onRetryCities }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const registering = mode === 'register'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = new FormData(event.currentTarget)
    const credentials = { email: String(form.get('email') ?? '').trim(), password: String(form.get('password') ?? '') }
    setError('')
    setNotice('')
    if (registering && !cities.some((item) => item.id === Number(city))) {
      setError('Выберите город из списка.')
      return
    }
    setPending(true)
    try {
      if (registering) {
        await client.register({ ...credentials, display_name: name.trim(), city_id: Number(city) })
        setMode('login')
        setNotice('Аккаунт создан. Если вход не завершится, войдите с указанными почтой и паролем.')
      }
      await onSignIn(credentials)
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== 'TypeError' && cause.name !== 'TimeoutError'
        ? cause.message : 'Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.')
    } finally { setPending(false) }
  }

  return (
    <main className="h-svh overflow-y-auto bg-page px-4 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto flex min-h-full max-w-360 flex-col">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} disabled={pending} className="inline-flex items-center gap-2 rounded-pill border-0 bg-transparent p-1 text-text" aria-label="Клёв, на главную">
            <img className="size-5" src={logo} alt="" />
            <span className="text-2xl leading-none font-extrabold tracking-tighter">клёв</span>
          </button>
          <button type="button" onClick={onBack} disabled={pending} className="rounded-pill border-0 bg-transparent px-3 py-2 text-sm font-bold text-text-muted">На главную</button>
        </div>
        <div className="mx-auto grid w-full max-w-300 flex-1 items-center gap-8 py-8 lg:grid-cols-2 lg:gap-10 lg:py-10">
          <section className="mx-auto w-full max-w-110 lg:order-2" aria-labelledby="auth-title">
            <h1 id="auth-title" className="m-0 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{registering ? 'Создать аккаунт' : 'Войти в Клёв'}</h1>
            <p className="mt-3 mb-7 text-sm leading-6 text-text-muted">{registering ? 'Расскажите немного о себе, чтобы создать профиль.' : 'Войдите, чтобы перейти к своему профилю.'}</p>
            <form className="flex flex-col gap-4" onSubmit={submit} aria-busy={pending}>
              <fieldset disabled={pending} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
              <label className="flex flex-col gap-2 text-sm font-bold">Почта<input className={inputClass} type="email" name="email" autoComplete="email" required /></label>
              <label className="flex flex-col gap-2 text-sm font-bold">Пароль<span className="relative block"><input className={`${inputClass} pr-14`} type={showPassword ? 'text' : 'password'} name="password" minLength={registering ? 8 : 1} autoComplete={registering ? 'new-password' : 'current-password'} required /><button type="button" aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} className="absolute inset-y-0 right-2 flex w-11 items-center justify-center rounded-pill border-0 bg-transparent" onClick={() => setShowPassword(!showPassword)}><img className="size-6" src={showPassword ? eyeClosedIcon : eyeIcon} alt="" /></button></span></label>
              {registering && <>
                <label className="flex flex-col gap-2 text-sm font-bold">Отображаемое имя<input className={inputClass} name="name" autoComplete="nickname" value={name} onChange={(event) => setName(event.target.value)} required pattern=".*\S.*" title="Введите имя" maxLength={100} /></label>
                <label className="flex flex-col gap-2 text-sm font-bold">Город<span className="relative block"><select className={`${fieldClass} cursor-pointer appearance-none bg-surface pr-10`} disabled={cityStatus !== 'ready'} name="city" value={city} onChange={(event) => setCity(event.target.value)} required><option value="">Выберите город</option>{cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><img className="pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2" src={chevronDown} alt="" /></span></label>
              </>}
              {registering && cityStatus !== 'ready' && <p role="status" className="m-0 text-sm text-text-muted">{cityStatus === 'loading' ? 'Загружаем города…' : cityStatus === 'empty' ? 'Список городов пуст.' : 'Не удалось загрузить города.'} {cityStatus !== 'loading' && <button type="button" onClick={onRetryCities} className="bg-transparent p-0 text-focus underline">Повторить</button>}</p>}
              {notice && <p role="status" className="m-0 text-sm text-text-muted">{notice}</p>}
              {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
              <Button type="submit" disabled={pending || (registering && cityStatus !== 'ready')} variant="strong" size="md" className="mt-2 w-full">{pending ? 'Подождите…' : registering ? 'Зарегистрироваться' : 'Войти'}</Button>
              </fieldset>
            </form>
            <p className="mt-6 mb-0 text-center text-sm text-text-muted">
              {registering ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
              <button type="button" disabled={pending} onClick={() => { setMode(registering ? 'login' : 'register'); setError(''); setNotice(''); setShowPassword(false) }} className="rounded-sm border-0 bg-transparent p-0 font-bold text-primary-strong">{registering ? 'Войти' : 'Зарегистрироваться'}</button>
            </p>
          </section>
          <div className="relative order-first min-h-44 sm:min-h-72 lg:order-1 lg:min-h-150 lg:self-stretch" aria-hidden="true">
            <img src={authImage} alt="" className="absolute inset-0 m-auto size-5/6 object-contain" />
          </div>
        </div>
      </div>
    </main>
  )
}
