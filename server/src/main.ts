import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { join } from 'path';
import './types/env.types';

// Загружаем переменные окружения из .env файла
try {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex);
        const value = trimmed.substring(equalIndex + 1);
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch (error) {
  console.warn('No .env file found, using default environment variables');
}

// Проверяем наличие обязательных переменных окружения
const requiredEnvVars = [
  'PORT',
  'RUNNER_ENGINE_URL',
  'DATA_DIR',
  'NGINX_CONFIG_PATH',
  'WEBSOCKET_PORT',
  'LOG_LEVEL',
  'LOG_FILE'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please check your .env file or set the environment variable');
    process.exit(1);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Настройка CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Глобальный префикс для API
  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT, 10);
  await app.listen(port);

  console.log(`🚀 OMS Server is running on: http://localhost:${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}/api`);
  console.log(`🔧 Runner Engine URL: ${process.env.RUNNER_ENGINE_URL}`);
  console.log(`📁 Data Directory: ${process.env.DATA_DIR}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start OMS Server:', error);
  process.exit(1);
});
