import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Load .env before AppModule so DATABASE_URL is set
dotenv.config({ path: path.join(__dirname, '../.env') });

import { AppModule } from '../src/app.module';

/**
 * Concurrency Test: No-Double-Booking Guarantee
 * ═══════════════════════════════════════════════
 *
 * This test proves the database-level exclusion constraint works under load.
 *
 * It fires CONCURRENT_REQUESTS simultaneous POST /api/bookings requests for
 * the EXACT SAME slot. Because they all arrive concurrently:
 *
 *   • Application code cannot distinguish them — they all see the slot open.
 *   • PostgreSQL's GiST index on tstzrange serialises the writers.
 *   • Exactly ONE INSERT succeeds (HTTP 201).
 *   • All others receive PostgreSQL error 23P01 → HTTP 409.
 *
 * Test slot: Room A (Europe/London), 2025-06-16 (Monday, June = BST UTC+1)
 *   09:00 BST = 08:00 UTC → startUtc = "2025-06-16T08:00:00.000Z"
 *
 * If the test passes: the DB constraint is working.
 * If more than one succeeds: the constraint is missing → double-booking bug.
 */
describe('Booking Concurrency — Race Condition Test', () => {
  let app: INestApplication;
  let pool: Pool;

  // Fixed IDs from seed data
  const RESOURCE_ID = '11111111-1111-1111-1111-111111111111';
  // 2025-06-16 = Monday. Room A (London/BST UTC+1): 09:00 local = 08:00 UTC
  const SLOT_START_UTC = '2025-06-16T08:00:00.000Z';
  const SLOT_END_UTC   = '2025-06-16T09:00:00.000Z';

  const CONCURRENT_REQUESTS = 10;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Clean up any leftover bookings from a previous test run
    await pool.query(
      `DELETE FROM bookings
       WHERE resource_id = $1 AND start_time = $2::timestamptz`,
      [RESOURCE_ID, SLOT_START_UTC],
    );
  }, 30_000);

  afterAll(async () => {
    // Tidy up so the test is re-runnable
    await pool.query(
      `DELETE FROM bookings
       WHERE resource_id = $1 AND start_time = $2::timestamptz`,
      [RESOURCE_ID, SLOT_START_UTC],
    );
    await pool.end();
    await app.close();
  }, 15_000);

  it(
    `${CONCURRENT_REQUESTS} parallel requests → exactly 1 succeeds (201), rest get 409`,
    async () => {
      const payload = {
        resourceId: RESOURCE_ID,
        startUtc:   SLOT_START_UTC,
        endUtc:     SLOT_END_UTC,
        userId:     'concurrency-test',
      };

      // Fire all requests simultaneously — the key is Promise.all with no await
      // between construction and execution.
      const responses = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
          request(app.getHttpServer())
            .post('/api/bookings')
            .send({ ...payload, userId: `race-user-${i}` })
            .set('Content-Type', 'application/json'),
        ),
      );

      const statusCodes = responses.map((r) => r.status).sort();
      const successes   = responses.filter((r) => r.status === 201);
      const conflicts   = responses.filter((r) => r.status === 409);

      console.log('Status codes:', statusCodes.join(', '));
      console.log(`✅ Successes: ${successes.length}  ❌ Conflicts: ${conflicts.length}`);

      // Primary assertion: exactly one booking must succeed
      expect(successes).toHaveLength(1);
      expect(conflicts).toHaveLength(CONCURRENT_REQUESTS - 1);

      // Secondary assertion: database contains exactly one booking for this slot
      const dbCount = await pool.query(
        `SELECT COUNT(*)::int AS cnt
         FROM bookings
         WHERE resource_id = $1 AND start_time = $2::timestamptz`,
        [RESOURCE_ID, SLOT_START_UTC],
      );
      expect(dbCount.rows[0].cnt).toBe(1);
    },
    30_000,
  );
});
