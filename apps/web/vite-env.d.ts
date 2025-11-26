/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_ENABLE_AI_CHAT?: string
  readonly VITE_ENABLE_TERMINAL?: string
  readonly VITE_ENABLE_MONITORING?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
