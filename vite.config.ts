import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const finnhubStatusPlugin = (configured: boolean): Plugin => ({
  name: 'finnhub-proxy-status',
  configureServer(server) {
    server.middlewares.use('/api/finnhub/status', (_request, response) => {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ configured }))
    })

    if (!configured) {
      server.middlewares.use('/api/finnhub', (_request, response) => {
        response.statusCode = 503
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ error: 'Finnhub server key is not configured.' }))
      })
    }
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const finnhubApiKey = env.NEWS_STOCK_API_KEY
  const isFinnhubConfigured = Boolean(
    finnhubApiKey && finnhubApiKey !== 'replace_with_your_finnhub_api_key',
  )

  return {
    envPrefix: 'VITE_',
    plugins: [
      finnhubStatusPlugin(isFinnhubConfigured),
      tailwindcss(),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: isFinnhubConfigured
      ? {
          proxy: {
            '/api/finnhub/ws': {
              changeOrigin: true,
              rewrite: () => `/?token=${encodeURIComponent(finnhubApiKey)}`,
              target: 'wss://ws.finnhub.io',
              ws: true,
            },
            '/api/finnhub': {
              changeOrigin: true,
              rewrite: (path) => {
                const upstreamPath = path.replace(/^\/api\/finnhub/, '')
                const separator = upstreamPath.includes('?') ? '&' : '?'
                return `${upstreamPath}${separator}token=${encodeURIComponent(finnhubApiKey)}`
              },
              target: 'https://finnhub.io/api/v1',
            },
          },
        }
      : undefined,
  }
})
