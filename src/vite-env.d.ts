/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEWS_STOCK_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
