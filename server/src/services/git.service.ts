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
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('git_clone', command, errorDetails || result.error || 'Unknown error');
    }
  }

  async checkout(directory: string, branch: string, serviceId?: string): Promise<void> {
    const command = `git checkout ${branch}`;
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success) {
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('git_checkout', command, errorDetails || result.error || 'Unknown error');
    }
  }

  async pull(directory: string, serviceId?: string): Promise<void> {
    const command = 'git pull';
    const result = await this.runnerService.executeCommand(command, { cwd: directory }, serviceId);

    if (!result.success) {
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('git_pull', command, errorDetails || result.error || 'Unknown error');
    }
  }

  async getBranches(repository: string): Promise<string[]> {
    const command = `git ls-remote --heads ${repository}`;
    const result = await this.runnerService.executeCommand(command);

    if (!result.success) {
      const errorDetails = result.output.join('\n');
      throw this.createDetailedError('git_branches', command, errorDetails || result.error || 'Unknown error');
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
  ): Error {
    const detailedError: DetailedError = {
      step,
      command,
      error,
    };
    return new Error(JSON.stringify(detailedError, null, 2));
  }
}
