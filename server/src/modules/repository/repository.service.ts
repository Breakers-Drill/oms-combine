import { Injectable, Logger } from '@nestjs/common';
import { GitService } from '../../services/git.service';
import { FileSystemService } from '../../services/filesystem.service';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);

  constructor(
    private readonly gitService: GitService,
    private readonly fileSystemService: FileSystemService,
    private readonly logsService: LogsService,
  ) { }

  async validateRepository(repository: string): Promise<{
    valid: boolean;
    branches?: string[];
    error?: string;
  }> {
    try {
      await this.logsService.addLog({
        level: 'info',
        message: `Validating repository: ${repository}`,
        source: 'system',
      });

      const branches = await this.gitService.getBranches(repository);

      await this.logsService.addLog({
        level: 'success',
        message: `Repository validated successfully. Found ${branches.length} branches`,
        source: 'system',
      });

      return {
        valid: true,
        branches,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logsService.addLog({
        level: 'error',
        message: `Repository validation failed: ${errorMessage}`,
        source: 'system',
      });

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  async getBranches(repository: string): Promise<string[]> {
    return this.gitService.getBranches(repository);
  }

  async analyzeBranch(repository: string, branch: string): Promise<{
    hasDockerCompose: boolean;
    hasEnvExample: boolean;
    suggestedEnvVars: string[];
    error?: string;
  }> {
    try {
      // Создаем временную директорию для анализа
      const tempDir = `/tmp/oms-analysis-${Date.now()}`;

      await this.logsService.addLog({
        level: 'info',
        message: `Analyzing branch '${branch}' from repository: ${repository}`,
        source: 'system',
      });

      // Клонируем репозиторий во временную директорию
      await this.gitService.clone(repository, tempDir);
      await this.gitService.checkout(tempDir, branch);

      // Проверяем наличие docker-compose.yaml
      const hasDockerCompose = await this.fileSystemService.fileExists(`${tempDir}/docker-compose.yaml`);

      // Проверяем наличие .env.example
      const hasEnvExample = await this.fileSystemService.fileExists(`${tempDir}/.env.example`);

      // Читаем .env.example для получения списка переменных
      let suggestedEnvVars: string[] = [];
      if (hasEnvExample) {
        const envExampleContent = await this.fileSystemService.readFile(`${tempDir}/.env.example`);
        suggestedEnvVars = this.extractEnvVars(envExampleContent);
      }

      // Удаляем временную директорию
      await this.fileSystemService.removeDirectory(tempDir);

      await this.logsService.addLog({
        level: 'success',
        message: `Branch analysis completed. Docker Compose: ${hasDockerCompose}, Env Example: ${hasEnvExample}`,
        source: 'system',
      });

      return {
        hasDockerCompose,
        hasEnvExample,
        suggestedEnvVars,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logsService.addLog({
        level: 'error',
        message: `Branch analysis failed: ${errorMessage}`,
        source: 'system',
      });

      return {
        hasDockerCompose: false,
        hasEnvExample: false,
        suggestedEnvVars: [],
        error: errorMessage,
      };
    }
  }

  private extractEnvVars(content: string): string[] {
    const envVars: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex);
          envVars.push(key);
        }
      }
    }

    return envVars;
  }
}
