import process from 'node:process'
import { createDashboardServer } from './backend/app.mjs'

try {
  process.loadEnvFile('.env.local')
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
}

const PORT = Number(process.env.PORT) || 4173
const server = createDashboardServer({ serveStatic: true })

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Stock Dashboard server running on http://localhost:${PORT}`)
})
