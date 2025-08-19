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
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('docker_ps', command, errorDetails || result.error || 'Unknown error');
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
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('docker_compose_up', command, errorDetails || result.error || 'Unknown error');
    }
  }

  async composeDown(directory: string, serviceId?: string): Promise<void> {
    const command = 'docker compose down --volumes --rmi all';
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success) {
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('docker_compose_down', command, errorDetails || result.error || 'Unknown error');
    }
  }

  async removeContainer(containerName: string, serviceId?: string): Promise<void> {
    const command = `docker rm -f ${containerName}`;
    const result = await this.runnerService.executeCommand(command, {}, serviceId);

    if (!result.success) {
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('docker_rm', command, errorDetails || result.error || 'Unknown error');
    }
  }

  async inspectContainer(containerName: string, serviceId?: string): Promise<any> {
    const command = `docker inspect ${containerName}`;
    const result = await this.runnerService.executeCommand(command, {}, serviceId);

    if (!result.success) {
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('docker_inspect', command, errorDetails || result.error || 'Unknown error');
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
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('docker_logs', command, errorDetails || result.error || 'Unknown error');
    }

    return result.output;
  }

  async getNetworks(): Promise<string[]> {
    const command = 'docker network ls --format "{{.Name}}"';
    const result = await this.runnerService.executeCommand(command);

    if (!result.success) {
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('docker_networks', command, errorDetails || result.error || 'Unknown error');
    }

    return result.output.filter(line => line.trim());
  }

  async getVolumes(): Promise<string[]> {
    const command = 'docker volume ls --format "{{.Name}}"';
    const result = await this.runnerService.executeCommand(command);

    if (!result.success) {
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('docker_volumes', command, errorDetails || result.error || 'Unknown error');
    }

    return result.output.filter(line => line.trim());
  }

  private createDetailedError(
    step: string,
    command: string,
    error: string,
  ): Error {
    const detailedError: DetailedError = {
      step,
      command,
      error,
    };
    return new Error(JSON.stringify(detailedError, null, 2));
  }
}
