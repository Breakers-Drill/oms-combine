import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';

@Injectable()
export class FileSystemService {
  private readonly logger = new Logger(FileSystemService.name);

  constructor() { }

  async ensureDirectoryExists(path: string): Promise<void> {
    try {
      await fs.access(path);
    } catch {
      await fs.mkdir(path, { recursive: true });
      this.logger.log(`Created directory: ${path}`);
    }
  }

  async getServiceDirectory(serviceName: string): Promise<string> {
    const dataDir = process.env.DATA_DIR;
    const serviceDir = join(dataDir, serviceName);
    await this.ensureDirectoryExists(serviceDir);
    return serviceDir;
  }

  async directoryExists(path: string): Promise<boolean> {
    try {
      const stat = await fs.stat(path);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      const stat = await fs.stat(path);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  async readFile(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.ensureDirectoryExists(dirname(path));
    await fs.writeFile(path, content, 'utf-8');
  }

  async readJsonFile<T>(path: string): Promise<T> {
    const content = await this.readFile(path);
    return JSON.parse(content) as T;
  }

  async writeJsonFile(path: string, data: unknown): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await this.writeFile(path, content);
  }

  async listDirectories(path: string): Promise<string[]> {
    const entries = await fs.readdir(path, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  }

  async removeDirectory(path: string): Promise<void> {
    await fs.rm(path, { recursive: true, force: true });
  }

  async copyFile(source: string, destination: string): Promise<void> {
    await this.ensureDirectoryExists(dirname(destination));
    await fs.copyFile(source, destination);
  }
}
