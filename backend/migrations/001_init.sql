-- ============================================================
-- Resource Booking System — Initial Schema
-- ============================================================
-- Key design choices documented inline:
--
-- 1. btree_gist extension: required so we can use the equality
--    operator (=) on UUID columns inside a GiST exclusion constraint.
--
-- 2. availability_windows stores wall-clock times (TIME type) +
--    the resource's IANA timezone is on the resources table.
--    The service layer converts these to UTC at query time using Luxon.
--
-- 3. bookings stores start_time/end_time as TIMESTAMPTZ (always UTC).
--    Wall-clock local times are NEVER stored in this table.
--
-- 4. The EXCLUSION CONSTRAINT is the sole enforcer of no-double-booking.
--    tstzrange(start_time, end_time, '[)') creates half-open [start, end)
--    intervals, so a slot ending at 10:00 and one starting at 10:00
--    do NOT overlap — correct boundary semantics.
-- ============================================================

-- Required for using = operator on non-range types in EXCLUDE
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Resources: rooms, consultants, etc.
CREATE TABLE IF NOT EXISTS resources (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT        NOT NULL,
  timezone  TEXT        NOT NULL,  -- IANA timezone, e.g. 'Europe/London'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly recurring availability windows (one row per day-of-week per resource).
-- day_of_week follows ISO: 1=Monday, 7=Sunday.
-- start_time / end_time are wall-clock times in the resource's own timezone.
CREATE TABLE IF NOT EXISTS availability_windows (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id  UUID      NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  day_of_week  SMALLINT  NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time   TIME      NOT NULL,
  end_time     TIME      NOT NULL,
  CHECK (end_time > start_time),
  UNIQUE (resource_id, day_of_week)
);

-- Bookings: every instant is stored as UTC (TIMESTAMPTZ).
-- The EXCLUSION CONSTRAINT is the database-level guarantee that no two
-- bookings for the same resource overlap in time. Application code alone
-- (SELECT-then-INSERT) cannot provide this guarantee under concurrent load.
CREATE TABLE IF NOT EXISTS bookings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id  UUID        NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id      TEXT        NOT NULL DEFAULT 'demo-user',
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time),

  -- THE NO-DOUBLE-BOOKING GUARANTEE:
  -- EXCLUDE USING gist: uses a GiST index to detect overlapping time ranges.
  -- resource_id WITH =   : two bookings must share the same resource to conflict.
  -- tstzrange(...) WITH &&: the && operator tests for range overlap.
  -- '[)' interval style  : lower-inclusive, upper-exclusive — half-open.
  --   A slot [09:00, 10:00) and a slot [10:00, 11:00) do NOT overlap.
  -- PostgreSQL serialises concurrent INSERTs at the GiST index level:
  --   the second writer waits, then receives error code 23P01 on commit.
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_resource_start
  ON bookings (resource_id, start_time);

CREATE INDEX IF NOT EXISTS idx_availability_resource_day
  ON availability_windows (resource_id, day_of_week);
