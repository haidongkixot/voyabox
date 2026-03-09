import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set. Create a .env file with DATABASE_URL=your_connection_string');
  process.exit(1);
}

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const db = drizzle(pool);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations complete.');

  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
