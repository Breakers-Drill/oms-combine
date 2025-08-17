import { Injectable, Logger } from '@nestjs/common';
import { RunnerService } from './runner.service';
import type { DetailedError } from '../types/command-result.types';

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);

  constructor(private readonly runnerService: RunnerService) { }

  async clone(repository: string, directory: string, serviceId?: string): Promise<void> {
    const command = `git clone ${repository} ${directory}`;
    const result = await this.runnerService.executeCommand(command, {}, serviceId);

    if (!result.success) {
      throw this.createDetailedError('git_clone', command, result.error || 'Unknown error', [
        'Проверьте права доступа к репозиторию',
        'Убедитесь что репозиторий публичный или настроен SSH ключ',
        'Попробуйте использовать SSH URL вместо HTTPS',
      ], 'Исправьте URL репозитория и попробуйте снова');
    }
  }

  async checkout(directory: string, branch: string, serviceId?: string): Promise<void> {
    const command = `git checkout ${branch}`;
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success) {
      throw this.createDetailedError('git_checkout', command, result.error || 'Unknown error', [
        'Проверьте что ветка существует в репозитории',
        'Убедитесь что репозиторий был успешно склонирован',
      ], 'Проверьте название ветки и попробуйте снова');
    }
  }

  async pull(directory: string, serviceId?: string): Promise<void> {
    const command = 'git pull';
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success) {
      throw this.createDetailedError('git_pull', command, result.error || 'Unknown error', [
        'Проверьте подключение к интернету',
        'Убедитесь что нет конфликтов в локальных изменениях',
        'Попробуйте выполнить git fetch перед pull',
      ], 'Исправьте проблемы с Git и попробуйте снова');
    }
  }

  async getBranches(repository: string): Promise<string[]> {
    const command = `git ls-remote --heads ${repository}`;
    const result = await this.runnerService.executeCommand(command);

    if (!result.success) {
      throw this.createDetailedError('git_branches', command, result.error || 'Unknown error', [
        'Проверьте доступность репозитория',
        'Убедитесь что URL репозитория корректный',
        'Проверьте права доступа к репозиторию',
      ], 'Исправьте URL репозитория и попробуйте снова');
    }

    // Парсим вывод git ls-remote --heads
    const branches: string[] = [];
    for (const line of result.output) {
      const match = line.match(/refs\/heads\/(.+)$/);
      if (match && match[1]) {
        branches.push(match[1]);
      }
    }

    return branches;
  }

  async getRemoteUrl(directory: string, serviceId?: string): Promise<string> {
    const command = 'git config --get remote.origin.url';
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success || result.output.length === 0 || !result.output[0]) {
      throw new Error('Failed to get remote URL');
    }

    return result.output[0].trim();
  }

  async getCurrentBranch(directory: string, serviceId?: string): Promise<string> {
    const command = 'git branch --show-current';
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success || result.output.length === 0 || !result.output[0]) {
      throw new Error('Failed to get current branch');
    }

    return result.output[0].trim();
  }

  async getLastCommit(directory: string, serviceId?: string): Promise<{
    hash: string;
    message: string;
    author: string;
    date: string;
  }> {
    const command = 'git log -1 --format="%H|%s|%an|%ai"';
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success || result.output.length === 0 || !result.output[0]) {
      throw new Error('Failed to get last commit');
    }

    const parts = result.output[0].split('|');
    if (parts.length < 4) {
      throw new Error('Invalid commit format');
    }

    const [hash, message, author, date] = parts;
    if (!hash || !message || !author || !date) {
      throw new Error('Invalid commit format - missing required fields');
    }

    return { hash, message, author, date };
  }

  async validateRepository(repository: string): Promise<boolean> {
    try {
      await this.getBranches(repository);
      return true;
    } catch {
      return false;
    }
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
