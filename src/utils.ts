import fs from 'node:fs';
import path from 'node:path';

export function ensureDirectory(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function getTimestamp() {
  return new Date().toISOString();
}

const LOCK_MAX_AGE_MS = 2 * 60 * 1000;

export function acquireProcessLock() {
  const lockPath = path.resolve(process.cwd(), 'data', '.bot.lock');
  ensureDirectory(path.dirname(lockPath));

  if (fs.existsSync(lockPath)) {
    const lockAge = Date.now() - fs.statSync(lockPath).mtimeMs;
    if (lockAge < LOCK_MAX_AGE_MS) {
      const existingPid = fs.readFileSync(lockPath, 'utf8').trim();
      throw new Error(
        `Bot is already running (PID ${existingPid}). Stop other instances before starting again.`,
      );
    }

    fs.unlinkSync(lockPath);
  }

  fs.writeFileSync(lockPath, String(process.pid));

  const release = () => {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  };

  process.on('exit', release);
  process.on('SIGINT', () => {
    release();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    release();
    process.exit(0);
  });
}

export function truncateText(value: string, max = 1024) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 3)}...`;
}
