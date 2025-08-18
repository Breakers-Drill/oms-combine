import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../modules/logs/logs.service';
import type { CommandResult, CommandOptions } from '../types/command-result.types';
import { EventSource }  from 'eventsource';

@Injectable()
export class RunnerService {
  private readonly logger = new Logger(RunnerService.name);

  constructor(
    private readonly logsService: LogsService,
  ) { }

  private async checkRunnerAvailability(): Promise<void> {
    const runnerUrl = process.env.RUNNER_ENGINE_URL;
    try {
      const response = await fetch(`${runnerUrl}/api/exec/ping`);
      if (!response.ok) {
        throw new Error(`Runner service is not available. Status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Runner service is not available', error);
      throw new Error('Runner service is not available');
    }
  }

  async executeCommand(
    command: string,
    options: CommandOptions = {},
    serviceId?: string,
  ): Promise<CommandResult> {

    await this.checkRunnerAvailability();
    const startTime = Date.now();
    const runnerUrl = process.env.RUNNER_ENGINE_URL;

    // Логируем начало выполнения команды
    await this.logsService.addLog({
      level: 'info',
      message: `Executing command: ${command}`,
      serviceId: serviceId || null,
      command,
      source: this.getCommandSource(command),
    });

    try {
      // Формируем URL для SSE запроса
      const url = new URL('/api/exec', runnerUrl);
      url.searchParams.set('cmd', command);

      if (options.cwd) {
        url.searchParams.set('cwd', options.cwd);
      }
      if (options.shell !== undefined) {
        url.searchParams.set('shell', options.shell.toString());
      }
      if (options.detached !== undefined) {
        url.searchParams.set('detached', options.detached.toString());
      }
      if (options.uid !== undefined) {
        url.searchParams.set('uid', options.uid.toString());
      }
      if (options.gid !== undefined) {
        url.searchParams.set('gid', options.gid.toString());
      }
      if (options.env) {
        url.searchParams.set('env', JSON.stringify(options.env));
      }

      // Создаем EventSource для SSE
      const eventSource = new EventSource(url.toString());

      const output: string[] = [];
      let exitCode = 0;
      let error: string | undefined;

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('Command execution timeout'));
        }, 300000); // 5 минут таймаут

        eventSource.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.channel) {
              case 'stdout':
                output.push(data.chunk);
                await this.logsService.addLog({
                  level: 'info',
                  message: data.chunk,
                  serviceId: serviceId || null,
                  command,
                  source: this.getCommandSource(command),
                });
                break;

              case 'stderr':
                output.push(data.chunk);
                await this.logsService.addLog({
                  level: 'warning',
                  message: data.chunk,
                  serviceId: serviceId || null,
                  command,
                  source: this.getCommandSource(command),
                });
                break;

              case 'close':
              case 'exit':
                exitCode = data.code;
                clearTimeout(timeout);
                eventSource.close();

                const duration = Date.now() - startTime;
                const success = exitCode === 0;

                if (success) {
                  await this.logsService.addLog({
                    level: 'success',
                    message: `Command completed successfully (exit code: ${exitCode})`,
                    serviceId: serviceId || null,
                    command,
                    source: this.getCommandSource(command),
                  });
                } else {
                  error = `Command failed with exit code: ${exitCode}`;
                  await this.logsService.addLog({
                    level: 'error',
                    message: error,
                    serviceId: serviceId || null,
                    command,
                    source: this.getCommandSource(command),
                  });
                }

                resolve({
                  success,
                  output,
                  error,
                  exitCode,
                  command,
                  duration,
                });
                break;

              case 'error':
                clearTimeout(timeout);
                eventSource.close();
                error = `Command execution error: ${data.error}`;

                await this.logsService.addLog({
                  level: 'error',
                  message: error,
                  serviceId: serviceId || null,
                  command,
                  source: this.getCommandSource(command),
                });

                resolve({
                  success: false,
                  output,
                  error,
                  exitCode: -1,
                  command,
                  duration: Date.now() - startTime,
                });
                break;
            }
          } catch (parseError) {
            this.logger.error('Failed to parse SSE event data:', parseError);
          }
        };

        eventSource.onerror = async (event) => {
          clearTimeout(timeout);
          eventSource.close();
          error = 'EventSource error occurred';

          await this.logsService.addLog({
            level: 'error',
            message: error,
            serviceId: serviceId || null,
            command,
            source: this.getCommandSource(command),
          });

          resolve({
            success: false,
            output,
            error,
            exitCode: -1,
            command,
            duration: Date.now() - startTime,
          });
        };
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logsService.addLog({
        level: 'error',
        message: `Failed to execute command: ${errorMessage}`,
        serviceId: serviceId || null,
        command,
        source: this.getCommandSource(command),
      });

      return {
        success: false,
        output: [],
        error: errorMessage,
        exitCode: -1,
        command,
        duration,
      };
    }
  }

  private getCommandSource(command: string): 'git' | 'docker' | 'nginx' | 'system' {
    if (command.startsWith('git')) return 'git';
    if (command.startsWith('docker')) return 'docker';
    if (command.startsWith('nginx')) return 'nginx';
    return 'system';
  }
}
