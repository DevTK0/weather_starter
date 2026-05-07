import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './backend/src/schema.ts',
  out: './backend/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? './backend/weather.db',
  },
});
