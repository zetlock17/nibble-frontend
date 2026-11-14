import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { test } from 'node:test'
import { createServer as createViteServer } from 'vite'
import config from '../../../vite.config.ts'

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

test('прокси меняет путь cookie при входе и выходе, сохраняя проверку чужого Origin', async (t) => {
  const upstream = createHttpServer((request, response) => {
    const logout = request.url.endsWith('/logout')
    response.setHeader('Set-Cookie', `refresh_token=${logout ? '' : 'test-cookie'}; Path=/auth; HttpOnly; SameSite=Lax${logout ? '; Max-Age=0' : ''}`)
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
  assert.equal((await login.json()).origin, config.server.proxy['/api'].target)

  const logout = await fetch(`${frontend}/api/auth/logout`, { method: 'POST', headers: { Origin: frontend, Cookie: 'refresh_token=test-cookie' } })
  assert.match(logout.headers.get('set-cookie'), /Path=\/api\/auth;/)
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/)
  assert.equal((await logout.json()).cookie, 'refresh_token=test-cookie')

  const foreign = await fetch(`${frontend}/api/auth/refresh`, { method: 'POST', headers: { Origin: 'https://foreign.example' } })
  assert.equal((await foreign.json()).origin, 'https://foreign.example')
  const noOrigin = await fetch(`${frontend}/api/auth/refresh`, { method: 'POST' })
  assert.equal((await noOrigin.json()).origin, null)
})
