import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2, // Safe for Neon Free 10-connection limit across 3-4 concurrent lambdas
  idleTimeoutMillis: 10000, 
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
