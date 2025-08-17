import { Module } from '@nestjs/common';
import { MicroservicesController } from './microservices.controller';
import { MicroservicesService } from './microservices.service';
import { LogsModule } from '../logs/logs.module';
import { FileSystemService } from '../../services/filesystem.service';
import { GitService } from '../../services/git.service';
import { DockerService } from '../../services/docker.service';
import { RunnerService } from '../../services/runner.service';

@Module({
  imports: [LogsModule],
  controllers: [MicroservicesController],
  providers: [
    MicroservicesService,
    FileSystemService,
    GitService,
    DockerService,
    RunnerService,
  ],
  exports: [MicroservicesService],
})
export class MicroservicesModule { }
