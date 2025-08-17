import { Module } from '@nestjs/common';
import { ExecController } from '../routes/exec.controller.js';
import { ExecService } from '../services/exec.service.js';

@Module({
  imports: [],
  controllers: [ExecController],
  providers: [ExecService]
})
export class AppModule {}

