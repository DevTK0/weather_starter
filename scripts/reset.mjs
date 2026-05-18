import 'dotenv/config';
import { rm } from 'node:fs/promises';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./server/weather.db';

if (!databaseUrl.startsWith('file:')) {
  console.log(`Refusing to remove non-file database URL: ${databaseUrl}`);
  process.exit(0);
}

const databasePath = new URL(databaseUrl, `file://${process.cwd()}/`);

await rm(databasePath, { force: true });
await rm(new URL(`${databasePath.pathname}-shm`, databasePath), { force: true });
await rm(new URL(`${databasePath.pathname}-wal`, databasePath), { force: true });
console.log(`Removed ${databasePath.pathname}`);
