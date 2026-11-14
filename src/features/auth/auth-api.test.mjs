import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AuthError, createAuthClient, parseAuthUser } from './auth-api.ts'

const user = { id: 7, email: 'angler@example.com', display_name: 'Иван Рыбак', city_id: 1, role: 'user', avatar_url: null, bio: 'Ловлю с берега.' }
const credentials = { email: user.email, password: 'password123' }
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
const tokens = (token = 'access-one', expires = 900) => json({ access_token: token, token_type: 'bearer', expires_in: expires })

function mockFetch(t, handler) {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(init.credentials, 'include')
    assert.equal(init.cache, 'no-store')
    assert.ok(init.signal instanceof AbortSignal)
    calls.push({ url, init })
    return handler(url, init, calls)
  })
  return calls
}

test('проверяет пользователя и отклоняет некорректные данные и адрес аватара', () => {
  assert.deepEqual(parseAuthUser(user), { id: 7, email: user.email, name: 'Иван Рыбак', initials: 'ИР', cityId: 1, role: 'user', avatarUrl: null, bio: user.bio })
  for (const change of [{ id: 0 }, { city_id: -1 }, { role: 'owner' }, { display_name: ' ' }, { avatar_url: 'javascript:alert(1)' }, { bio: 42 }]) {
    assert.throws(() => parseAuthUser({ ...user, ...change }))
  }
})

test('регистрация отправляет контракт бэка; вход получает профиль через bearer', async (t) => {
  const calls = mockFetch(t, (url, init) => {
    if (url.endsWith('/register')) {
      assert.deepEqual(JSON.parse(init.body), { ...credentials, display_name: user.display_name, city_id: 1 })
      return json(user, 201)
    }
    if (url.endsWith('/login')) { assert.deepEqual(JSON.parse(init.body), credentials); return tokens() }
    assert.equal(init.headers.Authorization, 'Bearer access-one')
    return json(user)
  })
  const client = createAuthClient('/api/')
  await client.register({ ...credentials, display_name: user.display_name, city_id: 1 })
  assert.equal(calls.length, 1)
  assert.equal((await client.login(credentials)).id, 7)
  assert.deepEqual(calls.map(({ url }) => url), ['/api/auth/register', '/api/auth/login', '/api/auth/me'])
})

test('перезагрузка восстанавливает пользователя по cookie без сохранённого access token', async (t) => {
  const calls = mockFetch(t, (url, init) => {
    if (url.endsWith('/refresh')) { assert.equal(init.method, 'POST'); assert.equal(init.headers.Authorization, undefined); return tokens('restored') }
    assert.equal(init.headers.Authorization, 'Bearer restored')
    return json(user)
  })
  assert.equal((await createAuthClient('/api').restore()).name, user.display_name)
  assert.equal(calls.length, 2)
})

test('отсутствие сессии даёт гостя; сбой сервера остаётся ошибкой с возможностью повтора', async (t) => {
  let status = 401
  mockFetch(t, () => json({ detail: 'Invalid credentials or token' }, status))
  const client = createAuthClient('/api')
  assert.equal(await client.restore(), null)
  status = 503
  await assert.rejects(client.restore(), (error) => error instanceof AuthError && error.status === 503)
})

test('параллельные запросы используют одно обновление сессии', async (t) => {
  let refreshes = 0
  mockFetch(t, async (url, init) => {
    if (url.endsWith('/refresh')) { refreshes++; await new Promise((resolve) => setTimeout(resolve, 5)); return tokens('shared') }
    assert.equal(init.headers.Authorization, 'Bearer shared')
    return json(user)
  })
  const client = createAuthClient('/api')
  await Promise.all([client.currentUser(), client.currentUser(), client.restore()])
  assert.equal(refreshes, 1)
})

test('401 обновляет токен и повторяет запрос только один раз', async (t) => {
  let refreshes = 0
  mockFetch(t, (url, init) => {
    if (url.endsWith('/refresh')) { refreshes++; return tokens(`token-${refreshes}`) }
    return init.headers.Authorization === 'Bearer token-1' ? json({}, 401) : json(user)
  })
  const client = createAuthClient('/api')
  assert.equal((await client.currentUser()).id, 7)
  assert.equal(refreshes, 2)
})

test('не зацикливает повтор при отклонении обновлённого токена', async (t) => {
  let calls = 0
  mockFetch(t, (url) => { calls++; return url.endsWith('/refresh') ? tokens() : json({}, 401) })
  await assert.rejects(createAuthClient('/api').currentUser(), AuthError)
  assert.equal(calls, 4)
})

test('обновляет истёкший токен перед защищённым запросом', async (t) => {
  let clock = 1000000
  t.mock.method(Date, 'now', () => clock)
  let refreshes = 0
  mockFetch(t, (url) => {
    if (url.endsWith('/refresh')) { refreshes++; return tokens(`token-${refreshes}`) }
    return json(user)
  })
  const client = createAuthClient('/api')
  await client.currentUser()
  clock += 900000
  await client.currentUser()
  assert.equal(refreshes, 2)
})

test('выход отзывает cookie и удаляет access token; сетевой сбой не имитирует выход', async (t) => {
  let rejectLogout = true
  let refreshed = false
  mockFetch(t, (url, init) => {
    if (url.endsWith('/login')) return tokens()
    if (url.endsWith('/logout')) {
      assert.equal(init.method, 'POST')
      return rejectLogout ? json({}, 503) : new Response(null, { status: 204 })
    }
    if (url.endsWith('/refresh')) { refreshed = true; return json({}, 401) }
    assert.equal(init.headers.Authorization, 'Bearer access-one')
    return json(user)
  })
  const client = createAuthClient('/api')
  await client.login(credentials)
  await assert.rejects(client.logout(), AuthError)
  await client.currentUser()
  assert.equal(refreshed, false)
  rejectLogout = false
  await client.logout()
  await assert.rejects(client.currentUser(), AuthError)
  assert.equal(refreshed, true)
})

test('ошибки входа, занятой почты и валидации понятны пользователю', async (t) => {
  let status = 401
  mockFetch(t, () => json({}, status))
  const client = createAuthClient('/api')
  await assert.rejects(client.login(credentials), /Неверная почта или пароль/)
  status = 409
  await assert.rejects(client.register({ ...credentials, display_name: 'Иван', city_id: 1 }), /уже зарегистрирована/)
  status = 422
  await assert.rejects(client.register({ ...credentials, display_name: 'Иван', city_id: 1 }), /Проверьте поля/)
})

test('отклоняет повреждённый ответ токена до запроса профиля', async (t) => {
  const calls = mockFetch(t, () => json({ access_token: ' ', token_type: 'bearer', expires_in: 900 }))
  await assert.rejects(createAuthClient('/api').login(credentials), /Некорректный ответ авторизации/)
  assert.equal(calls.length, 1)
})
