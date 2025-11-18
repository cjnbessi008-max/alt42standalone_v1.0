/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LMS_API_URL: string
  readonly VITE_LMS_API_KEY?: string
  readonly VITE_LMS_ENABLE_TRACKING: string
  readonly VITE_LMS_ENABLE_AUTH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
