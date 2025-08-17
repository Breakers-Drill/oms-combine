import { Module } from '@nestjs/common';
import { MicroservicesModule } from './modules/microservices/microservices.module';
import { RepositoryModule } from './modules/repository/repository.module';
import { LogsModule } from './modules/logs/logs.module';

@Module({
  imports: [
    MicroservicesModule,
    RepositoryModule,
    LogsModule,
  ],
})
export class AppModule { }
