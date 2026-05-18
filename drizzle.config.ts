import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseAuthToken = process.env.DATABASE_AUTH_TOKEN?.trim() || 'local-file-auth-token';

export default defineConfig({
  dialect: 'turso',
  schema: './backend/src/schema.ts',
  out: './backend/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:./backend/weather.db',
    authToken: databaseAuthToken,
  },
});
