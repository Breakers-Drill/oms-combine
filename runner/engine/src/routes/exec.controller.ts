import { Controller, Query, Sse, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExecService } from '../services/exec.service.js';
import type { MessageEvent } from '@nestjs/common';
import { Readable } from 'node:stream';
import { SpawnOptions } from 'node:child_process';

type MessageEventData = 
  | { channel: 'stdout'; chunk: string }
  | { channel: 'stderr'; chunk: string }
  | { channel: 'close'; code: number }
  | { channel: 'exit'; code: number }
  | { channel: 'error'; error: unknown };

@Controller('api/exec')
export class ExecController {
  private readonly logger = new Logger(ExecController.name);
  constructor(private readonly execService: ExecService) { }

  @Sse()
  exec(
    @Query('cmd') cmd: string,
    @Query('shell') shell?: string,
    @Query('cwd') cwd?: string,
    @Query('detached') detached?: string,
    @Query('uid') uid?: string,
    @Query('gid') gid?: string,
    @Query('env') env?: string,
    @Query('stdio') stdio?: string,
  ): Observable<MessageEvent> {
    this.logger.log(`SSE request: cmd=${cmd}`);
    
    const spawnOptions: SpawnOptions = {};
    
    if (shell !== undefined) {
      spawnOptions.shell = shell === 'true';
    }
    if (cwd) {
      spawnOptions.cwd = cwd;
    }
    if (detached !== undefined) {
      spawnOptions.detached = detached === 'true';
    }
    if (uid) {
      spawnOptions.uid = parseInt(uid, 10);
    }
    if (gid) {
      spawnOptions.gid = parseInt(gid, 10);
    }
    if (env) {
      try {
        spawnOptions.env = JSON.parse(env);
      } catch (error) {
        this.logger.warn('Invalid env JSON:', env);
      }
    }
    if (stdio) {
      try {
        spawnOptions.stdio = JSON.parse(stdio);
      } catch (error) {
        this.logger.warn('Invalid stdio JSON:', stdio);
      }
    }
    
    this.logger.log(`Spawn options: ${JSON.stringify(spawnOptions)}`);
    
    const child = this.execService.spawnSse(cmd, spawnOptions);
    const stdout = child.stdout as Readable;
    const stderr = child.stderr as Readable;
    stdout.setEncoding('utf8');
    stderr.setEncoding('utf8');

    return new Observable<MessageEvent>((subscriber) => {
      const onStdout = (chunk: string) => {
        subscriber.next({ 
          data: { channel: 'stdout', chunk },
          type: 'message'
        });
      };

      const onStderr = (chunk: string) => {
        subscriber.next({ 
          data: { channel: 'stderr', chunk },
          type: 'message'
        });
      };

      const onClose = (code: number) => {
        subscriber.next({ 
          data: { channel: 'close', code },
          type: 'message'
        });
        subscriber.complete();
      };

      // const onExit = (code: number) => {
      //   subscriber.next({ 
      //     data: { channel: 'exit', code },
      //     type: 'message'
      //   });
      // };

      const onError = (err: unknown) => {
        subscriber.next({ 
          data: { channel: 'error', error: err },
          type: 'message'
        });
        subscriber.complete();
      };

      stdout.on('data', onStdout);
      stderr.on('data', onStderr);
      child.on('close', onClose);
      // child.on('exit', onExit);
      child.on('error', onError);

      return () => {
        stdout.off('data', onStdout);
        stderr.off('data', onStderr);
        child.off('close', onClose);
        // child.off('exit', onExit);
        child.off('error', onError);
        try { child.kill(); } catch { }
      };
    }).pipe(map((data) => data));
  }
}

