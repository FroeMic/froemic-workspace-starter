import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { env } from '../lib/env.js';

export const connection = postgres(env.DATABASE_URL);
export const db = drizzle(connection, { schema });

export * from './schema.js';