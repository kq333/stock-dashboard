# Stock Dashboard

A React and TypeScript dashboard for stock and cryptocurrency prices, market news, and earnings and IPO calendars.

## Setup

Use the Node.js version specified in `.nvmrc` (22.23.1). Run the following commands from the directory containing `package.json`:

```bash
npm ci
```

## Environment

Copy `.env.example` to `.env.local` and configure the required Finnhub key:

```powershell
Copy-Item .env.example .env.local
```

On macOS or Linux, use `cp .env.example .env.local` instead.

```env
NEWS_STOCK_API_KEY=your_finnhub_key
```

`NEWS_STOCK_API_KEY` is server-only. Do not rename it with a `VITE_` prefix. The browser talks to the same-origin `/api/finnhub` proxy, and the proxy adds the key on the server.

The CoinGecko demo key is optional and is intentionally client-visible:

```env
VITE_COINGECKO_API_KEY=your_optional_coingecko_demo_key
```

If you do not have a CoinGecko demo key, remove this variable or leave its value empty. Do not leave the example placeholder as its value: the application sends any nonempty value to CoinGecko.

Restart the development server after changing environment variables. Changes to `VITE_` variables require a new production build because these values are included in the browser bundle.

## Development

```bash
npm run dev
```

Vite proxies Finnhub REST and WebSocket requests during development.

Open the local URL printed by Vite in the terminal.

## Production

```bash
npm run build
npm start
```

The production server serves `dist`, proxies approved Finnhub endpoints, and bridges the Finnhub WebSocket without sending the API key to the browser. Set `PORT` through the deployment environment when a port other than `4173` is required.

Open `http://localhost:4173` when using the default port. `npm run preview` starts the same production server and also requires a build first.

On a hosting platform, configure `NEWS_STOCK_API_KEY` as a server environment variable. For local use, the server reads `.env.local` from the working directory. Restart the production server after changing the Finnhub key.

Deployment requires a Node.js process and WebSocket support. Static hosting alone, including GitHub Pages, cannot run the included Finnhub proxy. Publishing the source repository on GitHub is separate from hosting the application.

## Configuration check

Visit `/api/finnhub/status` on the running application. It returns `{ "configured": true }` when a non-placeholder Finnhub key is present. This checks configuration only; it does not verify the key with Finnhub. Without a configured key, Finnhub REST requests return HTTP 503 and live price connections are rejected.

## Publishing source code

- Keep real keys in `.env.local` or in the hosting platform's server environment variables.
- `.env.local`, `node_modules`, and `dist` are ignored by Git. Commit `.env.example` with placeholder values only.
- The current `.gitignore` ignores `*.local`; add ignore rules before using other secret files such as `.env` or `.env.production`.
- Every `VITE_` variable is client-visible. Never use this prefix for the Finnhub key.

## Code checks

```bash
npm run lint
npm run format:check
npm run build
```
