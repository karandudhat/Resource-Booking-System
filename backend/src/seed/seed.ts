/**
 * seed.ts — run with: npm run seed
 *
 * Inserts 3 resources + their weekly availability windows.
 * Resources are seeded with fixed UUIDs so the concurrency test can
 * reference them without a DB lookup.
 *
 * Resources:
 *   1. Room A — London    (Europe/London)   DST timezone  Mon–Fri 09:00–17:00
 *   2. Studio B — New York (America/New_York) DST timezone  Mon–Sat 08:00–18:00
 *   3. Lab C — Kolkata    (Asia/Kolkata)    No DST         Mon–Sun 10:00–20:00
 *
 * Slot length: 60 minutes (gives 8 slots/day for Room A, 10 for Studio B, 10 for Lab C)
 */
import 'reflect-metadata';
import { Pool } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ── Seed data ──────────────────────────────────────────────────────────────
const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7]; // 1=Mon … 7=Sun

const RESOURCES = [
  {
    id:       '11111111-1111-1111-1111-111111111111',
    name:     'Room A — London',
    timezone: 'Europe/London',                 // Observes BST (UTC+1) Mar–Oct
    windows:  [1, 2, 3, 4, 5].map((d) => ({ // Mon–Fri
      day_of_week: d,
      start_time:  '09:00',
      end_time:    '17:00',
    })),
  },
  {
    id:       '22222222-2222-2222-2222-222222222222',
    name:     'Studio B — New York',
    timezone: 'America/New_York',              // Observes EDT (UTC-4) Mar–Nov
    windows:  [1, 2, 3, 4, 5, 6].map((d) => ({ // Mon–Sat
      day_of_week: d,
      start_time:  '08:00',
      end_time:    '18:00',
    })),
  },
  {
    id:       '33333333-3333-3333-3333-333333333333',
    name:     'Lab C — Kolkata',
    timezone: 'Asia/Kolkata',                  // Fixed UTC+5:30, no DST
    windows:  ISO_DAYS.map((d) => ({           // Mon–Sun
      day_of_week: d,
      start_time:  '10:00',
      end_time:    '20:00',
    })),
  },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_URL.includes('onrender.com') || process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : undefined
  });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const resource of RESOURCES) {
      // Upsert resource (idempotent — safe to re-run)
      await client.query(
        `INSERT INTO resources (id, name, timezone)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = $2, timezone = $3`,
        [resource.id, resource.name, resource.timezone],
      );

      // Re-seed availability windows
      await client.query(
        'DELETE FROM availability_windows WHERE resource_id = $1',
        [resource.id],
      );

      for (const w of resource.windows) {
        await client.query(
          `INSERT INTO availability_windows (resource_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)`,
          [resource.id, w.day_of_week, w.start_time, w.end_time],
        );
      }
    }

    await client.query('COMMIT');

    console.log('✅ Seed complete\n');
    for (const r of RESOURCES) {
      console.log(`  ${r.name} (${r.timezone})`);
      console.log(`    ID: ${r.id}`);
      console.log(`    Days: ${r.windows.map((w) => w.day_of_week).join(',')} | ${r.windows[0].start_time}–${r.windows[0].end_time}\n`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
