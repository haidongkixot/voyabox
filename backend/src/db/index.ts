import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

// Support both DATABASE_URL (standard) and POSTGRES_URL (Vercel Postgres)
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  // Serverless-friendly: small pool, short idle timeout
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  ssl: connectionString?.includes('sslmode=require') || connectionString?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : undefined,
});

export const db = drizzle(pool, { schema });
export { schema };
