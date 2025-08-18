import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileSystemService {
  private readonly logger = new Logger(FileSystemService.name);
  private readonly projectRoot: string;

  constructor() {
    // Определяем корень проекта server относительно текущего файла
    this.projectRoot = path.resolve(__dirname, '..', '..', '..');
    this.logger.log(`Project root resolved to: ${this.projectRoot}`);
  }

  private resolvePath(relativePath: string): string {
    return path.resolve(this.projectRoot, relativePath);
  }

  async ensureDirectoryExists(path: string): Promise<void> {
    try {
      await fs.access(path);
    } catch {
      await fs.mkdir(path, { recursive: true });
      this.logger.log(`Created directory: ${path}`);
    }
  }

  async getServiceDirectory(serviceName: string): Promise<string> {
    const dataDir = process.env.DATA_DIR || 'data';
    const absoluteDataDir = this.resolvePath(dataDir);
    await this.ensureDirectoryExists(absoluteDataDir);
    return path.join(absoluteDataDir, serviceName);
  }

  async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to read file ${filePath}:`, error);
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to write file ${filePath}:`, error);
      throw error;
    }
  }

  async readJsonFile<T>(path: string): Promise<T> {
    const content = await this.readFile(path);
    return JSON.parse(content) as T;
  }

  async writeJsonFile(path: string, data: unknown): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await this.writeFile(path, content);
  }

  async listDirectories(dirPath: string): Promise<string[]> {
    try {
      const absolutePath = this.resolvePath(dirPath);
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      this.logger.error(`Failed to list directories in ${dirPath}:`, error);
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async removeDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      this.logger.error(`Failed to remove directory ${dirPath}:`, error);
      throw error;
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    await this.ensureDirectoryExists(path.dirname(destination));
    await fs.copyFile(source, destination);
  }
}
