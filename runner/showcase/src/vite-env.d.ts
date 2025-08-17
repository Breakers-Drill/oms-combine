/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENGINE_URL: string;
  readonly VITE_SHOWCASE_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

