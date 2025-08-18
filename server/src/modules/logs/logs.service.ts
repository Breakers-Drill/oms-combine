import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { LogEntry } from '../../types/command-result.types';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private logs: LogEntry[] = [];
  private readonly maxLogs = 10000; // Максимальное количество логов в памяти

  async addLog(logData: Omit<LogEntry, 'id' | 'timestamp'>): Promise<LogEntry> {
    const log: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...logData,
    };

    this.logs.push(log);

    // Ограничиваем количество логов в памяти
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.logger.log(`[${log.source.toUpperCase()}] ${log.message}`);
    return log;
  }

  async getLogs(serviceId?: string): Promise<LogEntry[]> {
    if (serviceId) {
      return this.logs.filter(log => log.serviceId === serviceId);
    }
    return [...this.logs];
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    this.logger.log('System logs cleared');
  }

  async getLogsByService(serviceId: string): Promise<LogEntry[]> {
    return this.logs.filter(log => log.serviceId === serviceId);
  }

  async getLogsBySource(source: LogEntry['source']): Promise<LogEntry[]> {
    return this.logs.filter(log => log.source === source);
  }

  async getLogsByLevel(level: LogEntry['level']): Promise<LogEntry[]> {
    return this.logs.filter(log => log.level === level);
  }
}
