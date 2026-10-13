import fs from 'node:fs';
import path from 'node:path';
import { config } from './config';
import { ensureDirectory, getTimestamp } from './utils';

export class Logger {
  private readonly logFilePath: string;

  constructor(logFilePath = config.logPath) {
    this.logFilePath = logFilePath;
    ensureDirectory(path.dirname(this.logFilePath));
  }

  private write(level: string, message: string) {
    const line = `[${getTimestamp()}] [${level}] ${message}\n`;
    fs.appendFileSync(this.logFilePath, line, 'utf8');
  }

  info(message: string) {
    this.write('INFO', message);
  }

  warn(message: string) {
    this.write('WARN', message);
  }

  error(message: string) {
    this.write('ERROR', message);
  }
}

export const logger = new Logger();
