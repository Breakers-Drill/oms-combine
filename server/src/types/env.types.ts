declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      RUNNER_ENGINE_URL: string;
      DATA_DIR: string;
      NGINX_CONFIG_PATH: string;
      WEBSOCKET_PORT: string;
      LOG_LEVEL: string;
      LOG_FILE: string;
    }
  }
}

export {};
