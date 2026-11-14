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
