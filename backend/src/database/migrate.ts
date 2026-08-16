/**
 * migrate.ts — run with: npm run migrate
 *
 * Applies migrations/001_init.sql to the connected PostgreSQL database.
 * Safe to run multiple times (uses CREATE IF NOT EXISTS throughout).
 */
import 'reflect-metadata';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set.');
    process.exit(1);
  }

  // Use ssl: true for Render databases
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_URL.includes('onrender.com') || process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : undefined
  });

  const sqlPath = path.join(__dirname, '../../migrations/001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Running migrations from:', sqlPath);
  try {
    await pool.query(sql);
    console.log('✅ Migrations applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
