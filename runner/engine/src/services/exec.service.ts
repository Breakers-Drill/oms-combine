import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { spawn, SpawnOptions } from 'node:child_process';
import argvSplit from 'string-argv';

@Injectable()
export class ExecService {
  private readonly logger = new Logger(ExecService.name);

  validateCommand(commandLine: string): { cmd: string; args: string[] } {
    if (!commandLine || !commandLine.trim()) {
      throw new BadRequestException('Command is required');
    }
    const tokens = argvSplit(commandLine);
    if (tokens.length === 0) {
      throw new BadRequestException('Empty command');
    }
    const cmd = tokens[0];
    const args = tokens.slice(1);
    return { cmd, args };
  }

  spawnSse(commandLine: string, spawnOptions?: SpawnOptions) {
    const { cmd, args } = this.validateCommand(commandLine);
    const options: SpawnOptions = {
      shell: false,
      ...spawnOptions
    };

    this.logger.log(`Executing: ${cmd} ${args.join(' ')} with options: ${JSON.stringify(options)}`);
    const startedAt = Date.now();
    const child = spawn(cmd, args, options);
    child.on('close', (code) => {
      const ms = Date.now() - startedAt;
      this.logger.log(`Finished: ${cmd} ${args.join(' ')} => exit ${code} in ${ms}ms`);
    });
    child.on('error', (err) => {
      this.logger.error(`Spawn error for: ${cmd} ${args.join(' ')}`, err as Error);
    });
    return child;
  }
}

