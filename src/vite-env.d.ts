/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COINGECKO_API_KEY?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
