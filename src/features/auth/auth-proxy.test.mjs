import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { test } from 'node:test'
import { createServer as createViteServer } from 'vite'
import config from '../../../vite.config.ts'

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

test('прокси меняет путь cookie при входе и выходе, сохраняя проверку чужого Origin', async (t) => {
  const upstream = createHttpServer((request, response) => {
    const logout = request.url.endsWith('/logout')
    response.setHeader('Set-Cookie', `refresh_token=${logout ? '' : 'test-cookie'}; Path=/auth; HttpOnly; SameSite=Lax; Secure${logout ? '; Max-Age=0' : ''}`)
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ origin: request.headers.origin ?? null, cookie: request.headers.cookie ?? null }))
  })
  await listen(upstream)
  t.after(() => new Promise((resolve) => upstream.close(resolve)))
  const upstreamUrl = `http://127.0.0.1:${upstream.address().port}`
  const vite = await createViteServer({
    ...config, configFile: false, root: new URL('../../../', import.meta.url).pathname,
    server: { ...config.server, host: '127.0.0.1', port: 0, strictPort: true, proxy: {
      '/api': { ...config.server.proxy['/api'], target: upstreamUrl },
    } },
  })
  t.after(() => vite.close())
  await vite.listen()
  const frontend = `http://127.0.0.1:${vite.httpServer.address().port}`
  const login = await fetch(`${frontend}/api/auth/login`, { method: 'POST', headers: { Origin: frontend } })
  assert.match(login.headers.get('set-cookie'), /Path=\/api\/auth;/)
  assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/)
  assert.doesNotMatch(login.headers.get('set-cookie'), /;\s*Secure(?:;|$)/i)
  assert.equal((await login.json()).origin, config.server.proxy['/api'].target)

  const logout = await fetch(`${frontend}/api/auth/logout`, { method: 'POST', headers: { Origin: frontend, Cookie: 'refresh_token=test-cookie' } })
  assert.match(logout.headers.get('set-cookie'), /Path=\/api\/auth;/)
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/)
  assert.doesNotMatch(logout.headers.get('set-cookie'), /;\s*Secure(?:;|$)/i)
  assert.equal((await logout.json()).cookie, 'refresh_token=test-cookie')

  const foreign = await fetch(`${frontend}/api/auth/refresh`, { method: 'POST', headers: { Origin: 'https://foreign.example' } })
  assert.equal((await foreign.json()).origin, 'https://foreign.example')
  const noOrigin = await fetch(`${frontend}/api/auth/refresh`, { method: 'POST' })
  assert.equal((await noOrigin.json()).origin, null)
})

test('исключение Secure ограничено локальным HTTP и не меняет ответы без cookie', async () => {
  const { EventEmitter } = await import('node:events')
  const proxy = new EventEmitter()
  config.server.proxy['/api'].configure(proxy)
  const cookie = 'refresh_token=test; Path=/auth; HttpOnly; SameSite=Lax; Secure'
  for (const host of ['localhost:5173', '127.0.0.1:5173', '[::1]:5173']) {
    const response = { headers: { 'set-cookie': [cookie] } }
    proxy.emit('proxyRes', response, { headers: { host }, url: '/api/auth/refresh', socket: {} })
    assert.equal(response.headers['set-cookie'][0], cookie.replace('; Secure', ''))
  }
  for (const [host, encrypted, url] of [
    ['example.com', false, '/api/auth/refresh'],
    ['192.168.1.2:5173', false, '/api/auth/refresh'],
    ['localhost:5173', true, '/api/auth/refresh'],
    ['localhost:5173', false, '/api/posts'],
  ]) {
    const response = { headers: { 'set-cookie': [cookie] } }
    proxy.emit('proxyRes', response, { headers: { host }, url, socket: { encrypted } })
    assert.deepEqual(response.headers['set-cookie'], [cookie])
  }
  const noCookie = { headers: {} }
  proxy.emit('proxyRes', noCookie, { headers: { host: 'localhost:5173' }, url: '/api/auth/login', socket: {} })
  assert.deepEqual(noCookie.headers, {})
})

test('cookie сохраняет вход после нескольких перезагрузок локального HTTP-фронта', async (t) => {
  const { createAuthClient } = await import('./auth-api.ts')
  const user = { id: 7, email: 'angler@example.com', display_name: 'Рыбак', city_id: 1, role: 'user', avatar_url: null, bio: null }
  let session = ''
  let rotations = 0
  const upstream = createHttpServer((request, response) => {
    response.setHeader('Content-Type', 'application/json')
    if (request.url.endsWith('/me')) {
      response.end(JSON.stringify(user))
      return
    }
    if (!request.url.endsWith('/login') && request.headers.cookie !== `refresh_token=${session}`) {
      response.statusCode = 401
      response.end('{}')
      return
    }
    const logout = request.url.endsWith('/logout')
    session = logout ? '' : `session-${++rotations}`
    response.setHeader('Set-Cookie', `refresh_token=${session}; Path=/auth; HttpOnly; SameSite=Lax; Secure${logout ? '; Max-Age=0' : ''}`)
    response.statusCode = logout ? 204 : 200
    response.end(logout ? undefined : JSON.stringify({ access_token: 'access', token_type: 'bearer', expires_in: 900 }))
  })
  await listen(upstream)
  t.after(() => new Promise((resolve) => upstream.close(resolve)))
  const vite = await createViteServer({
    ...config, configFile: false, root: new URL('../../../', import.meta.url).pathname,
    server: { ...config.server, host: '127.0.0.1', port: 0, strictPort: true, hmr: false, proxy: {
      '/api': { ...config.server.proxy['/api'], target: `http://127.0.0.1:${upstream.address().port}` },
    } },
  })
  t.after(() => vite.close())
  await vite.listen()
  const frontend = `http://127.0.0.1:${vite.httpServer.address().port}`
  const networkFetch = globalThis.fetch
  let cookie = ''
  let cookiePath = ''
  // Model browsers that reject Secure cookies on HTTP, including Safari on localhost.
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const headers = new Headers(init.headers)
    if (cookie && new URL(url).pathname.startsWith(cookiePath)) headers.set('Cookie', cookie)
    const response = await networkFetch(url, { ...init, headers })
    const received = response.headers.get('set-cookie')
    if (received && !/;\s*Secure(?:;|$)/i.test(received)) {
      cookie = /;\s*Max-Age=0(?:;|$)/i.test(received) ? '' : received.split(';')[0]
      cookiePath = received.match(/;\s*Path=([^;]+)/i)?.[1] ?? '/'
    }
    return response
  })
  await createAuthClient(`${frontend}/api`).login({ email: user.email, password: 'password123' })
  for (let reload = 0; reload < 3; reload++) {
    const client = createAuthClient(`${frontend}/api`)
    assert.equal((await client.restore())?.id, user.id)
  }
  assert.equal(rotations, 4)
  const client = createAuthClient(`${frontend}/api`)
  await client.logout()
  assert.equal(cookie, '')
  assert.equal(await createAuthClient(`${frontend}/api`).restore(), null)
})
