import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { DateTime } from 'luxon';
import { DB_POOL } from '../config/database.config';
import { ResourcesService } from './resources.service';
import { Slot } from '../models';

/**
 * SlotsService — the DST-safe slot generator.
 *
 * Algorithm:
 *  1. Look up the resource's IANA timezone and its availability window for the
 *     requested date's day-of-week.
 *  2. Construct local DateTimes using Luxon (localDate.set({hour, minute})).
 *     Luxon correctly handles DST transitions:
 *       - Spring-forward (e.g. Europe/London 2025-03-30, clocks jump 01:00→02:00):
 *         Setting hour=9 gives 09:00 BST (UTC+1) = 08:00 UTC. No gap at 9am.
 *       - Fall-back (e.g. 2025-10-26, clocks go back 02:00→01:00):
 *         Setting hour=9 unambiguously picks 09:00 GMT (UTC+0) = 09:00 UTC.
 *         The ambiguous 1am hour never appears in our 09:00–17:00 window.
 *  3. Convert to UTC and generate 60-min half-open [start, end) slots.
 *  4. Cross-reference against DB bookings to set isBooked.
 *
 * Slot duration: 60 minutes (SLOT_DURATION_HOURS = 1).
 */
@Injectable()
export class SlotsService {
  /** Change this to adjust slot length system-wide. */
  public readonly SLOT_DURATION_HOURS = 1;

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly resourcesService: ResourcesService,
  ) {}

  async getSlots(resourceId: string, date: string, displayTimezone: string): Promise<Slot[]> {
    // ── 1. Validate inputs ──────────────────────────────────────────────────
    const resource = await this.resourcesService.findOne(resourceId); // throws 404 if missing

    const tzTest = DateTime.now().setZone(displayTimezone);
    if (!tzTest.isValid) {
      throw new BadRequestException(`Invalid timezone: '${displayTimezone}'`);
    }

    // ── 2. Parse the requested date in the RESOURCE's timezone ──────────────
    const localDate = DateTime.fromISO(date, { zone: resource.timezone });
    if (!localDate.isValid) {
      throw new BadRequestException(`Invalid date: '${date}'. Use YYYY-MM-DD format.`);
    }

    const dayOfWeek = localDate.weekday;

    // ── 3. Fetch availability window for this day-of-week ───────────────────
    const windowRes = await this.pool.query(
      `SELECT to_char(start_time, 'HH24:MI') AS start_time,
              to_char(end_time,   'HH24:MI') AS end_time
       FROM   availability_windows
       WHERE  resource_id = $1 AND day_of_week = $2`,
      [resourceId, dayOfWeek],
    );

    if (!windowRes.rows.length) return []; // resource is closed on this day

    const { start_time, end_time } = windowRes.rows[0];
    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);

    // ── 4. Build UTC window boundaries using Luxon (DST-safe) ───────────────
    const windowStartLocal = localDate.set({ hour: startH, minute: startM, second: 0, millisecond: 0 });
    const windowEndLocal   = localDate.set({ hour: endH,   minute: endM,   second: 0, millisecond: 0 });

    const windowStartUtc = windowStartLocal.toUTC();
    const windowEndUtc   = windowEndLocal.toUTC();

    // ── 5. Generate half-open [start, end) slots ────────────────────────────
    const slots: Array<{ s: DateTime; e: DateTime }> = [];
    let cursor = windowStartUtc;

    while (true) {
      const slotEnd = cursor.plus({ hours: this.SLOT_DURATION_HOURS });
      if (slotEnd > windowEndUtc) break;
      slots.push({ s: cursor, e: slotEnd });
      cursor = slotEnd;
    }

    if (slots.length === 0) return [];

    // ── 6. Fetch existing bookings in this window ───────────────────────────
    const bookedRes = await this.pool.query(
      `SELECT start_time
       FROM   bookings
       WHERE  resource_id = $1
         AND  start_time >= $2
         AND  start_time <  $3`,
      [resourceId, windowStartUtc.toISO(), windowEndUtc.toISO()],
    );

    const bookedMs = new Set<number>(
      bookedRes.rows.map((row: any) => new Date(row.start_time).getTime()),
    );

    // ── 7. Build response ────────────────────────────────────────────────────
    return slots.map(({ s, e }) => ({
      startUtc:     s.toISO()!,
      endUtc:       e.toISO()!,
      startDisplay: s.setZone(displayTimezone).toISO()!,
      endDisplay:   e.setZone(displayTimezone).toISO()!,
      isBooked:     bookedMs.has(s.toMillis()),
    }));
  }
}
