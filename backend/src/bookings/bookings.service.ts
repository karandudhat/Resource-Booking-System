import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DateTime } from 'luxon';
import { DB_POOL } from '../database/database.module';
import { SlotsService } from '../slots/slots.service';

export interface CreateBookingDto {
  resourceId: string;
  startUtc: string;
  endUtc: string;
  userId?: string;
}

export interface Booking {
  id: string;
  resource_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

/**
 * BookingsService — atomic booking creation.
 *
 * NO-DOUBLE-BOOKING MECHANISM
 * ──────────────────────────
 * We rely on the PostgreSQL EXCLUSION CONSTRAINT defined in 001_init.sql:
 *
 *   EXCLUDE USING gist (
 *     resource_id WITH =,
 *     tstzrange(start_time, end_time, '[)') WITH &&
 *   )
 *
 * How it works under concurrency:
 *   1. Both requests pass application-level validation (they see the slot open).
 *   2. Both send INSERT statements to PostgreSQL.
 *   3. PostgreSQL's GiST index serialises the two writers at the index level.
 *   4. The first INSERT acquires an index lock, inserts, and commits.
 *   5. The second INSERT tries to acquire the same lock, finds the overlapping
 *      range already committed, and raises error code 23P01 (exclusion_violation).
 *   6. We catch 23P01 and return HTTP 409 Conflict.
 *
 * A plain SELECT-then-INSERT has a TOCTOU gap: both threads can read "slot
 * available", then both insert — and both succeed. That counts as a fail.
 * The exclusion constraint closes that gap entirely.
 */
@Injectable()
export class BookingsService {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly slotsService: SlotsService,
  ) {}

  async createBooking(dto: CreateBookingDto): Promise<Booking> {
    const { resourceId, startUtc, endUtc, userId = 'demo-user' } = dto;

    // ── Validate timestamps ──────────────────────────────────────────────────
    const start = DateTime.fromISO(startUtc, { zone: 'utc' });
    const end   = DateTime.fromISO(endUtc,   { zone: 'utc' });

    if (!start.isValid) throw new BadRequestException(`Invalid startUtc: ${startUtc}`);
    if (!end.isValid)   throw new BadRequestException(`Invalid endUtc: ${endUtc}`);
    if (end <= start)   throw new BadRequestException('endUtc must be after startUtc');

    // ── Validate the slot is within availability ─────────────────────────────
    // This is a business-rule check (not the concurrency guard).
    // We reuse the slot generator so the validation logic lives in one place.
    const date = start.toISODate()!;
    const availableSlots = await this.slotsService.getSlots(resourceId, date, 'UTC');

    const isValidSlot = availableSlots.some(
      (slot) => slot.startUtc === start.toISO() && slot.endUtc === end.toISO(),
    );

    if (!isValidSlot) {
      throw new BadRequestException(
        'Requested slot is outside the resource availability window or has an invalid boundary',
      );
    }

    // ── Atomic INSERT — the exclusion constraint is the real guard ───────────
    try {
      const result = await this.pool.query(
        `INSERT INTO bookings (resource_id, user_id, start_time, end_time)
         VALUES ($1, $2, $3::timestamptz, $4::timestamptz)
         RETURNING id, resource_id, user_id, start_time, end_time, created_at`,
        [resourceId, userId, startUtc, endUtc],
      );
      return result.rows[0];
    } catch (err: any) {
      // PostgreSQL error codes:
      //   23P01 = exclusion_violation  (GiST exclusion constraint)
      //   23505 = unique_violation     (belt-and-suspenders unique index)
      if (err.code === '23P01' || err.code === '23505') {
        throw new ConflictException(
          'This slot is already booked — someone else just grabbed it. Please choose another time.',
        );
      }
      throw err; // unexpected DB error, let NestJS handle it
    }
  }

  async getBookings(resourceId?: string): Promise<Booking[]> {
    if (resourceId) {
      const result = await this.pool.query(
        `SELECT id, resource_id, user_id, start_time, end_time, created_at
         FROM   bookings
         WHERE  resource_id = $1
         ORDER  BY start_time`,
        [resourceId],
      );
      return result.rows;
    }

    const result = await this.pool.query(
      `SELECT id, resource_id, user_id, start_time, end_time, created_at
       FROM   bookings
       ORDER  BY start_time`,
    );
    return result.rows;
  }
}
