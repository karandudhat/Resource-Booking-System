import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DateTime } from 'luxon';
import { DB_POOL } from '../config/database.config';
import { SlotsService } from './slots.service';
import { CreateBookingDto, Booking } from '../models';

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
 * Under concurrency:
 *   1. Both requests pass application-level validation (they see the slot open).
 *   2. Both send INSERT statements to PostgreSQL.
 *   3. PostgreSQL's GiST index serialises the two writers at the index level.
 *   4. The first INSERT commits successfully.
 *   5. The second INSERT detects the overlap → raises error code 23P01.
 *   6. We catch 23P01 and return HTTP 409 Conflict.
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

    // ── Validate slot is within availability window ──────────────────────────
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
      // 23P01 = exclusion_violation  (GiST exclusion constraint)
      // 23505 = unique_violation     (belt-and-suspenders)
      if (err.code === '23P01' || err.code === '23505') {
        throw new ConflictException(
          'This slot is already booked — someone else just grabbed it. Please choose another time.',
        );
      }
      throw err;
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

  async deleteBooking(id: string): Promise<{ success: boolean }> {
    const result = await this.pool.query(
      `DELETE FROM bookings WHERE id = $1 RETURNING id`,
      [id],
    );
    return { success: true };
  }
}
