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

### Vercel

The Vite frontend is served as static files. `api/finnhub.js` exports the shared Node.js server from `backend/app.mjs` as a Vercel Function for Finnhub REST and WebSocket requests. An explicit rewrite in `vercel.json` routes `/api/finnhub/:path*` to this function, including nested paths such as `/api/finnhub/stock/profile2`. The function does not start its own listener or read `.env.local`.

1. Import the GitHub repository into Vercel and select the **Hobby** plan for this personal portfolio project.
2. Set the Root Directory to the directory containing `package.json` and `vercel.json`. Leave it at the repository root if those files are already there.
3. Use the **Vite** framework preset and **Node.js 22.x**. `vercel.json` configures `npm run build` and the `dist` output directory. Do not configure `npm start` on Vercel.
4. Add `NEWS_STOCK_API_KEY` in the project's Environment Variables for **Production** and, if needed, **Preview**. Do not upload `.env.local`. The optional `VITE_COINGECKO_API_KEY` is client-visible.
5. Set the production branch to **main** in the project's Git settings. Pushes and merges to this branch trigger production builds and deployments through the GitHub integration.
6. Deploy, then check `/api/finnhub/status`, stock quotes, and live prices. Also refresh a nested application page to verify SPA routing.

Redeploy after changing environment variables. The frontend and API use the same domain, including preview deployment domains.

Vercel's [WebSocket support](https://vercel.com/docs/functions/websockets) is currently in beta. The function is configured with a 300-second maximum duration; connections close at the platform's duration limit. The stock price hook reconnects and resubscribes automatically. Verify this behavior on the deployed application, because local Node.js tests do not reproduce Vercel's runtime or routing.

See [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) and [Git deployments](https://vercel.com/docs/git).

### Standalone Node.js server

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

## SEO and browser icon

`public/favicon.svg` supplies the browser tab icon. The HTML includes a default title, description, and Open Graph and Twitter metadata. `src/components/PageMetadata.tsx` updates titles and descriptions when navigating between pages; personal watchlist, portfolio, and settings pages receive `noindex, follow` after rendering.

Once the production domain is known, set `VITE_SITE_URL` to its origin (for example, `https://your-project.vercel.app`) and rebuild. This enables canonical links and `og:url` without publishing localhost or preview URLs as canonical addresses. The value is public and contains no credentials.

This is a client-rendered SPA: route-specific metadata requires JavaScript, and social crawlers that do not execute JavaScript see the default dashboard metadata. There is no prerendering or sitemap yet. `noindex` is an indexing hint, not access control. See [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Publishing source code

- Keep real keys in `.env.local` or in the hosting platform's server environment variables.
- `.env.local`, `node_modules`, and `dist` are ignored by Git. Commit `.env.example` with placeholder values only.
- The current `.gitignore` ignores `*.local`; add ignore rules before using other secret files such as `.env` or `.env.production`.
- Every `VITE_` variable is client-visible. Never use this prefix for the Finnhub key.

## Code checks

```bash
node --test tests/backend.test.mjs
npm run lint
npm run format:check
npm run build
```
