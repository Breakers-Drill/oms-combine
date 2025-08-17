import { Injectable, Logger } from '@nestjs/common';
import { RunnerService } from './runner.service';
import type { ContainerInfo, PortMapping } from '../types/microservice.types';
import type { DetailedError } from '../types/command-result.types';

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);

  constructor(private readonly runnerService: RunnerService) { }

  async getContainers(serviceName?: string): Promise<ContainerInfo[]> {
    const filter = serviceName ? `--filter "label=com.docker.compose.project=${serviceName}"` : '';
    const command = `docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}" ${filter}`;

    const result = await this.runnerService.executeCommand(command);

    if (!result.success) {
      throw this.createDetailedError('docker_ps', command, result.error || 'Unknown error', [
        'Проверьте что Docker запущен',
        'Убедитесь что у вас есть права для выполнения docker команд',
      ], 'Запустите Docker и попробуйте снова');
    }

    const containers: ContainerInfo[] = [];
    for (const line of result.output) {
      if (line.trim() && !line.includes('CONTAINER ID')) {
        const parts = line.split('\t');
        if (parts.length >= 6 && parts[0] && parts[1] && parts[2] && parts[3] && parts[5]) {
          containers.push({
            id: parts[0],
            name: parts[1],
            image: parts[2],
            status: parts[3],
            ports: parts[4] ? parts[4].split(', ') : [],
            createdAt: parts[5],
          });
        }
      }
    }

    return containers;
  }

  async getContainerStatus(serviceName: string): Promise<'running' | 'stopped'> {
    const containers = await this.getContainers(serviceName);
    return containers.length > 0 ? 'running' : 'stopped';
  }

  async composeUp(directory: string, serviceId?: string): Promise<void> {
    const command = 'docker compose --env-file .env up -d';
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success) {
      throw this.createDetailedError('docker_compose_up', command, result.error || 'Unknown error', [
        'Проверьте что docker-compose.yaml файл существует',
        'Убедитесь что .env файл содержит все необходимые переменные',
        'Проверьте что Docker запущен',
        'Убедитесь что порты не заняты другими сервисами',
      ], 'Исправьте конфигурацию и попробуйте снова');
    }
  }

  async composeDown(directory: string, serviceId?: string): Promise<void> {
    const command = 'docker compose down';
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success) {
      throw this.createDetailedError('docker_compose_down', command, result.error || 'Unknown error', [
        'Проверьте что Docker запущен',
        'Убедитесь что контейнеры существуют',
      ], 'Попробуйте остановить контейнеры вручную');
    }
  }

  async removeContainer(containerName: string, serviceId?: string): Promise<void> {
    const command = `docker rm -f ${containerName}`;
    const result = await this.runnerService.executeCommand(command, {}, serviceId);

    if (!result.success) {
      throw this.createDetailedError('docker_rm', command, result.error || 'Unknown error', [
        'Проверьте что контейнер существует',
        'Убедитесь что у вас есть права для удаления контейнеров',
      ], 'Попробуйте удалить контейнер вручную');
    }
  }

  async inspectContainer(containerName: string, serviceId?: string): Promise<any> {
    const command = `docker inspect ${containerName}`;
    const result = await this.runnerService.executeCommand(command, {}, serviceId);

    if (!result.success) {
      throw this.createDetailedError('docker_inspect', command, result.error || 'Unknown error', [
        'Проверьте что контейнер существует',
        'Убедитесь что имя контейнера корректное',
      ], 'Проверьте имя контейнера и попробуйте снова');
    }

    try {
      return JSON.parse(result.output.join('\n'));
    } catch {
      throw new Error('Failed to parse docker inspect output');
    }
  }

  async getContainerLogs(containerName: string, tail: number = 100, serviceId?: string): Promise<string[]> {
    const command = `docker logs --tail=${tail} ${containerName}`;
    const result = await this.runnerService.executeCommand(command, {}, serviceId);

    if (!result.success) {
      throw this.createDetailedError('docker_logs', command, result.error || 'Unknown error', [
        'Проверьте что контейнер существует',
        'Убедитесь что контейнер запущен',
      ], 'Проверьте статус контейнера и попробуйте снова');
    }

    return result.output;
  }

  async getNetworks(): Promise<string[]> {
    const command = 'docker network ls --format "{{.Name}}"';
    const result = await this.runnerService.executeCommand(command);

    if (!result.success) {
      throw this.createDetailedError('docker_networks', command, result.error || 'Unknown error', [
        'Проверьте что Docker запущен',
        'Убедитесь что у вас есть права для выполнения docker команд',
      ], 'Запустите Docker и попробуйте снова');
    }

    return result.output.filter(line => line.trim());
  }

  async getVolumes(): Promise<string[]> {
    const command = 'docker volume ls --format "{{.Name}}"';
    const result = await this.runnerService.executeCommand(command);

    if (!result.success) {
      throw this.createDetailedError('docker_volumes', command, result.error || 'Unknown error', [
        'Проверьте что Docker запущен',
        'Убедитесь что у вас есть права для выполнения docker команд',
      ], 'Запустите Docker и попробуйте снова');
    }

    return result.output.filter(line => line.trim());
  }

  private createDetailedError(
    step: string,
    command: string,
    error: string,
    recommendations: string[],
    nextAction?: string,
  ): DetailedError {
    return {
      step,
      command,
      error,
      recommendations,
      nextAction,
    };
  }
}
