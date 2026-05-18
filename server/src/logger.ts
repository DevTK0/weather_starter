import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import pino from 'pino';

const logPath = process.env.LOG_FILE_PATH ?? join(process.cwd(), 'server', 'logs', 'app.log');
const shouldWriteLogFile = process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1';

if (shouldWriteLogFile) {
  mkdirSync(dirname(logPath), { recursive: true });
}

const stream =
  process.env.NODE_ENV === 'test'
    ? undefined
    : shouldWriteLogFile
      ? pino.multistream([
          { stream: process.stdout },
          { stream: pino.destination({ dest: logPath, sync: false }) },
        ])
      : process.stdout;

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
    base: {
      service: 'weather-starter',
    },
  },
  stream,
);
