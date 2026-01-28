import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import { join } from 'path';

// Use SQLite for development if DATABASE_URL is not set or if explicitly set to use SQLite
const usePostgres = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('sqlite');

let pool: Pool | null = null;
let db: any;

if (usePostgres) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
} else {
  // Use SQLite for local development
  const dbPath = join(process.cwd(), 'clinic.db');
  const sqlite = new Database(dbPath);
  db = drizzleSqlite(sqlite, { schema });
}

export { pool, db };
