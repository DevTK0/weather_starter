import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseAuthToken = process.env.DATABASE_AUTH_TOKEN?.trim() || 'local-file-auth-token';

export default defineConfig({
  dialect: 'turso',
  schema: './server/src/schema.ts',
  out: './server/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:./server/weather.db',
    authToken: databaseAuthToken,
  },
});
