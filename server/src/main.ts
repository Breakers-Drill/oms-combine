import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import './types/env.types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Настройка CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = parseInt(process.env.PORT, 10);
  await app.listen(port);

  console.log(`🚀 OMS Server is running on: http://localhost:${port}`);
  console.log(`🔧 Runner Engine URL: ${process.env.RUNNER_ENGINE_URL}`);
  console.log(`📁 Data Directory: ${process.env.DATA_DIR}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start OMS Server:', error);
  process.exit(1);
});
