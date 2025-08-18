import { Controller, Get, Delete, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import type { LogEntry } from '../../types/command-result.types';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) { }

  @Get()
  async getLogs(@Query('serviceId') serviceId?: string): Promise<LogEntry[]> {
    return this.logsService.getLogs(serviceId);
  }

  @Delete()
  async clearLogs(): Promise<{ message: string }> {
    await this.logsService.clearLogs();
    return { message: 'Logs cleared successfully' };
  }
}
