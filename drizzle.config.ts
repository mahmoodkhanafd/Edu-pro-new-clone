import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  dbCredentials: {
    // Neon/Vercel supplies DATABASE_URL at deploy and migration time.
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/edupro',
  },
});
