import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import process from 'node:process'
import { WebSocket, WebSocketServer } from 'ws'

try {
  process.loadEnvFile('.env.local')
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
}

const PORT = Number(process.env.PORT) || 4173
const DIST_DIRECTORY = resolve('dist')
const FINNHUB_API_KEY = process.env.NEWS_STOCK_API_KEY
const IS_FINNHUB_CONFIGURED = Boolean(
  FINNHUB_API_KEY && FINNHUB_API_KEY !== 'replace_with_your_finnhub_api_key',
)
const FINNHUB_ENDPOINTS = new Map([
  ['/quote', ['symbol']],
  ['/stock/profile2', ['symbol']],
  ['/stock/market-status', ['exchange']],
  ['/news', ['category']],
  ['/calendar/earnings', ['from', 'to']],
  ['/calendar/ipo', ['from', 'to']],
])
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

const sendJson = (response, status, body) => {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

const proxyFinnhubRequest = async (request, response, requestUrl) => {
  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  if (!IS_FINNHUB_CONFIGURED) {
    sendJson(response, 503, { error: 'Finnhub server key is not configured.' })
    return
  }

  const endpoint = requestUrl.pathname.replace(/^\/api\/finnhub/, '')
  const allowedParameters = FINNHUB_ENDPOINTS.get(endpoint)

  if (!allowedParameters) {
    sendJson(response, 404, { error: 'Finnhub endpoint is not available.' })
    return
  }

  const upstreamUrl = new URL(`https://finnhub.io/api/v1${endpoint}`)
  allowedParameters.forEach((parameter) => {
    const value = requestUrl.searchParams.get(parameter)
    if (value) upstreamUrl.searchParams.set(parameter, value)
  })
  upstreamUrl.searchParams.set('token', FINNHUB_API_KEY)

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json' },
    })
    const body = await upstreamResponse.arrayBuffer()

    response.writeHead(upstreamResponse.status, {
      'Cache-Control': 'no-store',
      'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json',
    })
    response.end(Buffer.from(body))
  } catch {
    sendJson(response, 502, { error: 'Could not reach Finnhub.' })
  }
}

const serveApplication = async (request, response, requestUrl) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405)
    response.end()
    return
  }

  let pathname
  try {
    pathname = decodeURIComponent(requestUrl.pathname)
  } catch {
    response.writeHead(400)
    response.end()
    return
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const requestedPath = resolve(DIST_DIRECTORY, relativePath)
  const isInsideDist =
    requestedPath === DIST_DIRECTORY || requestedPath.startsWith(`${DIST_DIRECTORY}${sep}`)

  if (!isInsideDist) {
    response.writeHead(403)
    response.end()
    return
  }

  let filePath = requestedPath
  try {
    const fileStats = await stat(filePath)
    if (!fileStats.isFile()) filePath = resolve(DIST_DIRECTORY, 'index.html')
  } catch {
    filePath = resolve(DIST_DIRECTORY, 'index.html')
  }

  try {
    const body = await readFile(filePath)
    response.writeHead(200, {
      'Cache-Control': filePath.endsWith('index.html')
        ? 'no-cache'
        : 'public, max-age=31536000, immutable',
      'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
    })
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
}

const server = createServer(async (request, response) => {
  let requestUrl
  try {
    requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  } catch {
    sendJson(response, 400, { error: 'Invalid request URL.' })
    return
  }

  if (requestUrl.pathname === '/api/finnhub/status') {
    sendJson(response, 200, { configured: IS_FINNHUB_CONFIGURED })
    return
  }

  if (requestUrl.pathname.startsWith('/api/finnhub/')) {
    await proxyFinnhubRequest(request, response, requestUrl)
    return
  }

  await serveApplication(request, response, requestUrl)
})

const webSocketServer = new WebSocketServer({ noServer: true })

server.on('upgrade', (request, socket, head) => {
  let requestUrl
  let isSameOrigin
  try {
    requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    const requestOrigin = request.headers.origin
    isSameOrigin = !requestOrigin || new URL(requestOrigin).host === (request.headers.host ?? '')
  } catch {
    socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n')
    return
  }

  if (requestUrl.pathname !== '/api/finnhub/ws' || !IS_FINNHUB_CONFIGURED || !isSameOrigin) {
    socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n')
    socket.destroy()
    return
  }

  webSocketServer.handleUpgrade(request, socket, head, (clientSocket) => {
    const upstreamSocket = new WebSocket(
      `wss://ws.finnhub.io?token=${encodeURIComponent(FINNHUB_API_KEY)}`,
    )
    const pendingMessages = []

    clientSocket.on('message', (message) => {
      try {
        const payload = JSON.parse(message.toString())
        const isValidMessage =
          (payload.type === 'subscribe' || payload.type === 'unsubscribe') &&
          typeof payload.symbol === 'string' &&
          /^[A-Z0-9.:_-]{1,40}$/.test(payload.symbol)

        if (!isValidMessage) return
        if (upstreamSocket.readyState === WebSocket.OPEN) {
          upstreamSocket.send(message, { binary: false })
        } else {
          pendingMessages.push(message)
        }
      } catch {
        // Ignore malformed client messages.
      }
    })

    upstreamSocket.on('open', () => {
      pendingMessages
        .splice(0)
        .forEach((message) => upstreamSocket.send(message, { binary: false }))
    })
    upstreamSocket.on('message', (message, isBinary) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(message, { binary: isBinary })
      }
    })
    upstreamSocket.on('error', () => clientSocket.close(1011, 'Finnhub connection failed'))
    upstreamSocket.on('close', () => clientSocket.close())
    clientSocket.on('close', () => upstreamSocket.close())
    clientSocket.on('error', () => upstreamSocket.close())
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Stock Dashboard server running on http://localhost:${PORT}`)
})
