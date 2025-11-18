/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOODLE_URL: string
  readonly VITE_MOODLE_WS_TOKEN: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_DEV_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
