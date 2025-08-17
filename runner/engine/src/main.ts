import 'reflect-metadata';
import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module.js';

// Загружаем переменные окружения из .env файла
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const port = Number(process.env.PORT);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Engine listening on http://0.0.0.0:${port}`);
}

bootstrap();

