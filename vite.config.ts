import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const apiTarget = 'http://149.154.68.183'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        cookiePathRewrite: { '/auth': '/api/auth' },
        configure(proxy) {
          proxy.on('proxyReq', (upstream, request) => {
            // Translate only the dev frontend's own origin; preserve foreign origins for backend validation.
            if (request.headers.origin === `http://${request.headers.host}`) upstream.setHeader('Origin', apiTarget)
          })
          proxy.on('proxyRes', (response, request) => {
            const loopback = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(request.headers.host ?? '')
            const encrypted = 'encrypted' in request.socket && request.socket.encrypted === true
            if (!loopback || encrypted || !/^\/api\/auth\/(?:login|refresh|logout)(?:\?|$)/.test(request.url ?? '')) return
            // Safari rejects Secure cookies on HTTP localhost; this exception is limited to the local dev proxy.
            const cookies = response.headers['set-cookie']
            if (cookies) response.headers['set-cookie'] = cookies.map((cookie) => cookie.replace(/;\s*Secure\b/gi, ''))
          })
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
