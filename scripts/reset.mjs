import { rm } from 'node:fs/promises';

const databasePath = process.env.DATABASE_PATH
  ? new URL(process.env.DATABASE_PATH, `file://${process.cwd()}/`)
  : new URL('../backend/weather.db', import.meta.url);

await rm(databasePath, { force: true });
await rm(new URL(`${databasePath.pathname}-shm`, databasePath), { force: true });
await rm(new URL(`${databasePath.pathname}-wal`, databasePath), { force: true });
console.log(`Removed ${databasePath.pathname}`);
