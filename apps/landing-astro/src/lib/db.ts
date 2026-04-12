import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const url = import.meta.env.TURSO_DATABASE_URL;
const authToken = import.meta.env.TURSO_AUTH_TOKEN;

// Only create client if env vars are available (for build-time vs runtime)
const turso = url && authToken 
  ? createClient({ url, authToken })
  : null;

export const db = turso ? drizzle(turso) : null;
