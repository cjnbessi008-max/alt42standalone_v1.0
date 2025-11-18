/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MOODLE_URL: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
