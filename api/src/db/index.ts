import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Load environment variables from root .env file if not already loaded
if (!process.env.DATABASE_URL) {
  const currentFilename = fileURLToPath(import.meta.url);
  const currentDirname = dirname(currentFilename);
  dotenv.config({ path: join(currentDirname, '../../../.env') });
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const connection = postgres(process.env.DATABASE_URL);
export const db = drizzle(connection, { schema });

export * from './schema.js';