import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FileSystemService } from '../../services/filesystem.service';
import { GitService } from '../../services/git.service';
import { DockerService } from '../../services/docker.service';
import { LogsService } from '../logs/logs.service';
import type { Microservice, CreateMicroserviceDto, UpdateMicroserviceDto } from '../../types/microservice.types';
import type { DetailedError } from '../../types/command-result.types';

@Injectable()
export class MicroservicesService {
  private readonly logger = new Logger(MicroservicesService.name);

  constructor(
    private readonly fileSystemService: FileSystemService,
    private readonly gitService: GitService,
    private readonly dockerService: DockerService,
    private readonly logsService: LogsService,
  ) { }

  async getAllMicroservices(): Promise<Microservice[]> {
    try {
      const dataDir = process.env.DATA_DIR;
      const serviceNames = await this.fileSystemService.listDirectories(dataDir);

      const microservices: Microservice[] = [];

      for (const serviceName of serviceNames) {
        try {
          const microservice = await this.getMicroservice(serviceName);
          if (microservice) {
            microservices.push(microservice);
          }
        } catch (error) {
          this.logger.warn(`Failed to get microservice ${serviceName}:`, error);
        }
      }

      return microservices;
    } catch (error) {
      this.logger.error('Failed to get all microservices:', error);
      throw new Error('Failed to retrieve microservices');
    }
  }

  async getMicroservice(serviceName: string): Promise<Microservice | null> {
    try {
      const serviceDir = await this.fileSystemService.getServiceDirectory(serviceName);

      // Проверяем что директория существует и содержит git репозиторий
      if (!await this.fileSystemService.directoryExists(serviceDir) ||
        !await this.fileSystemService.directoryExists(`${serviceDir}/.git`)) {
        return null;
      }

      // Получаем информацию из Git
      const repository = await this.gitService.getRemoteUrl(serviceDir, serviceName);
      const branch = await this.gitService.getCurrentBranch(serviceDir, serviceName);
      const lastCommit = await this.gitService.getLastCommit(serviceDir, serviceName);

      // Получаем статус из Docker
      const status = await this.dockerService.getContainerStatus(serviceName);
      const containers = await this.dockerService.getContainers(serviceName);

      // Читаем переменные окружения
      const envPath = `${serviceDir}/.env`;
      let environmentVariables: Record<string, string> = {};
      if (await this.fileSystemService.fileExists(envPath)) {
        const envContent = await this.fileSystemService.readFile(envPath);
        environmentVariables = this.parseEnvFile(envContent);
      }

      // Читаем docker-compose.yaml для получения портов
      const composePath = `${serviceDir}/docker-compose.yaml`;
      let ports: any[] = [];
      if (await this.fileSystemService.fileExists(composePath)) {
        const composeContent = await this.fileSystemService.readFile(composePath);
        ports = this.parseDockerComposePorts(composeContent);
      }

      return {
        id: serviceName,
        name: serviceName,
        repository,
        branch,
        status,
        containers,
        ports,
        environmentVariables,
        lastCommit,
        createdAt: lastCommit.date,
        updatedAt: lastCommit.date,
      };
    } catch (error) {
      this.logger.error(`Failed to get microservice ${serviceName}:`, error);
      return null;
    }
  }

  async createMicroservice(dto: CreateMicroserviceDto): Promise<Microservice> {
    try {
      const { name, repository, branch, environmentVariables } = dto;

      // Проверяем уникальность имени
      const existingService = await this.getMicroservice(name);
      if (existingService) {
        throw new BadRequestException(`Microservice with name '${name}' already exists`);
      }

      // Создаем директорию для сервиса
      const serviceDir = await this.fileSystemService.getServiceDirectory(name);

      // Клонируем репозиторий
      await this.gitService.clone(repository, serviceDir, name);

      // Переключаемся на нужную ветку
      await this.gitService.checkout(serviceDir, branch, name);

      // Проверяем наличие docker-compose.yaml
      const composePath = `${serviceDir}/docker-compose.yaml`;
      if (!await this.fileSystemService.fileExists(composePath)) {
        throw new BadRequestException('docker-compose.yaml not found in repository');
      }

      // Создаем .env файл
      const envContent = this.generateEnvFile(environmentVariables);
      await this.fileSystemService.writeFile(`${serviceDir}/.env`, envContent);

      // Получаем созданный микросервис
      const microservice = await this.getMicroservice(name);
      if (!microservice) {
        throw new Error('Failed to create microservice');
      }

      await this.logsService.addLog({
        level: 'success',
        message: `Microservice '${name}' created successfully`,
        serviceId: name,
        source: 'system',
      });

      return microservice;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logsService.addLog({
        level: 'error',
        message: `Failed to create microservice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        serviceId: dto.name,
        source: 'system',
      });

      throw new Error(`Failed to create microservice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deployMicroservice(serviceName: string): Promise<void> {
    try {
      const serviceDir = await this.fileSystemService.getServiceDirectory(serviceName);

      // Обновляем код из репозитория
      await this.gitService.pull(serviceDir, serviceName);

      // Запускаем контейнеры
      await this.dockerService.composeUp(serviceDir, serviceName);

      await this.logsService.addLog({
        level: 'success',
        message: `Microservice '${serviceName}' deployed successfully`,
        serviceId: serviceName,
        source: 'system',
      });
    } catch (error) {
      await this.logsService.addLog({
        level: 'error',
        message: `Failed to deploy microservice '${serviceName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        serviceId: serviceName,
        source: 'system',
      });
      throw error;
    }
  }

  async stopMicroservice(serviceName: string): Promise<void> {
    try {
      const serviceDir = await this.fileSystemService.getServiceDirectory(serviceName);
      await this.dockerService.composeDown(serviceDir, serviceName);

      await this.logsService.addLog({
        level: 'success',
        message: `Microservice '${serviceName}' stopped successfully`,
        serviceId: serviceName,
        source: 'system',
      });
    } catch (error) {
      await this.logsService.addLog({
        level: 'error',
        message: `Failed to stop microservice '${serviceName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        serviceId: serviceName,
        source: 'system',
      });
      throw error;
    }
  }

  async deleteMicroservice(serviceName: string): Promise<void> {
    try {
      // Останавливаем контейнеры если они запущены
      const status = await this.dockerService.getContainerStatus(serviceName);
      if (status === 'running') {
        await this.stopMicroservice(serviceName);
      }

      // Удаляем контейнеры
      const containers = await this.dockerService.getContainers(serviceName);
      for (const container of containers) {
        await this.dockerService.removeContainer(container.name, serviceName);
      }

      // Удаляем директорию
      const serviceDir = await this.fileSystemService.getServiceDirectory(serviceName);
      await this.fileSystemService.removeDirectory(serviceDir);

      await this.logsService.addLog({
        level: 'success',
        message: `Microservice '${serviceName}' deleted successfully`,
        serviceId: serviceName,
        source: 'system',
      });
    } catch (error) {
      await this.logsService.addLog({
        level: 'error',
        message: `Failed to delete microservice '${serviceName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        serviceId: serviceName,
        source: 'system',
      });
      throw error;
    }
  }

  private parseEnvFile(content: string): Record<string, string> {
    const env: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex);
          const value = trimmed.substring(equalIndex + 1);
          env[key] = value;
        }
      }
    }

    return env;
  }

  private generateEnvFile(environmentVariables: Record<string, string>): string {
    return Object.entries(environmentVariables)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  }

  private parseDockerComposePorts(content: string): any[] {
    // Простой парсер для портов из docker-compose.yaml
    // В реальном приложении лучше использовать YAML парсер
    const ports: any[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('ports:') || trimmed.includes('- "') || trimmed.includes('- \'')) {
        const portMatch = trimmed.match(/"([^"]+)"|'([^']+)'/);
        if (portMatch) {
          const portString = portMatch[1] || portMatch[2];
          if (portString) {
            const [host, container] = portString.split(':');
            if (host && container) {
              ports.push({
                host,
                container,
                protocol: 'tcp',
              });
            }
          }
        }
      }
    }

    return ports;
  }
}
