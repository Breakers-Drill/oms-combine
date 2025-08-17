import { Module } from '@nestjs/common';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';
import { LogsModule } from '../logs/logs.module';
import { FileSystemService } from '../../services/filesystem.service';
import { GitService } from '../../services/git.service';
import { RunnerService } from '../../services/runner.service';

@Module({
  imports: [LogsModule],
  controllers: [RepositoryController],
  providers: [
    RepositoryService,
    FileSystemService,
    GitService,
    RunnerService,
  ],
  exports: [RepositoryService],
})
export class RepositoryModule { }
