# Resource Booking System

A full-stack booking system for shared resources — meeting rooms and studio spaces. Built with **React/TypeScript**, **NestJS**, and **PostgreSQL**.

---

## How to Run

### Prerequisites
- Docker + Docker Compose, **or** Node 20 + PostgreSQL 15 locally.

### Option A — Docker Compose (recommended)
```bash
git clone <repo>
cd <repo>
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

### Option B — Local (without Docker)

**1. Start PostgreSQL** (ensure it's running locally):
```bash
# macOS with Homebrew
brew services start postgresql@15
createdb booking_db
createuser booking_user
psql -c "ALTER USER booking_user WITH PASSWORD 'booking_pass';"
```

**2. Backend:**
```bash
cd backend
cp .env.example .env          # edit DATABASE_URL if needed
npm install
npm run migrate               # creates tables + constraints
npm run seed                  # inserts 3 resources
npm run start:dev             # starts on port 3001
```

**3. Frontend:**
```bash
cd ../frontend
npm install
npm start                     # starts on port 3000
```

### Running the concurrency test:
```bash
# Requires the database to be running and migrated + seeded
cd backend
npm run test:concurrency
```

---

## How I Stop Double-Booking

**The database is the single source of truth.** Application code alone can't prevent double-booking under concurrency — a SELECT-then-INSERT leaves a TOCTOU gap where two threads can both read "slot available" and both succeed.

My guarantee comes from a **PostgreSQL exclusion constraint** on the `bookings` table:

```sql
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
)
```

This tells PostgreSQL: for any two bookings on the same resource, their time ranges must not overlap. The `&&` operator tests range overlap; `'[)'` gives half-open intervals (so a slot ending at 10:00 and one starting at 10:00 **don't** conflict — correct boundary semantics).

Under concurrent load:
1. Two simultaneous `INSERT` statements hit the database.
2. PostgreSQL serialises them at the **GiST index level** — the second writer waits until the first commits.
3. The second insert detects the overlapping committed row and raises **error code `23P01` (exclusion_violation)**.
4. The API catches `23P01` and returns **HTTP 409 Conflict**.

The concurrency test (`backend/test/bookings.concurrency.spec.ts`) fires **10 simultaneous requests** for the same slot using `Promise.all` and asserts exactly **1 HTTP 201** and **9 HTTP 409s**, then verifies the database contains exactly one row.

---

## How I Handle Timezones and DST

- **Storage**: every `start_time`/`end_time` in `bookings` is `TIMESTAMPTZ` (UTC). Local wall-clock times are never stored.
- **Availability**: each resource's availability is defined as `(day_of_week, start_time TIME, end_time TIME)` in its own IANA timezone (e.g., `Europe/London`). The `TIME` columns store wall-clock hours like "09:00".
- **Slot generation** uses **Luxon** with IANA timezone rules:
  ```
  1. Parse the requested date in the resource's timezone → get day-of-week
  2. Set hour=9, minute=0 on that date in the resource's zone (Luxon resolves DST)
  3. Convert to UTC → walk in 60-min increments to generate slots
  ```

**DST edge cases:**
- **Spring-forward** (Europe/London, 2025-03-30): clocks jump 01:00→02:00. Setting hour=9 gives 09:00 BST (UTC+1) = 08:00 UTC. No missing or duplicated slots — Luxon resolves correctly via the IANA database.
- **Fall-back** (2025-10-26): clocks repeat 01:00 local. Setting hour=9 unambiguously gives 09:00 GMT (UTC+0). The ambiguous 1am hour never appears in a 09:00–17:00 window.
- Since we always work in UTC arithmetic once the window boundaries are established, DST "extra" or "missing" hours in the middle of the night don't affect our 9am–5pm slots.

---

## Slot Length

**60 minutes.** Defined in `backend/src/slots/slots.service.ts` as `SLOT_DURATION_HOURS = 1`. To change it, update that constant — everything else (slot generation, boundary math) adjusts automatically.

---

## Resources (Seeded)

| Resource | Timezone | Hours | Days |
|---|---|---|---|
| Room A — London | `Europe/London` *(DST)* | 09:00–17:00 | Mon–Fri |
| Studio B — New York | `America/New_York` *(DST)* | 08:00–18:00 | Mon–Sat |
| Lab C — Kolkata | `Asia/Kolkata` *(no DST)* | 10:00–20:00 | Mon–Sun |

Fixed UUIDs: `11111111-…`, `22222222-…`, `33333333-…` — used by the concurrency test.

---

## Assumptions

- **Auth**: a hardcoded `userId = "demo-user"` is sent on all bookings — no login flow.
- **No admin UI**: resources are seeded via `npm run seed`.
- **No recurrence exceptions**: pure weekly patterns, no holidays.
- **Slot granularity**: slots snap to exact hour boundaries within the availability window.

---

## What I'd Do with More Time

1. **Cancellations**: add `DELETE /bookings/:id` with ownership check.
2. **Week view**: show a full week at a glance, not just one day.
3. **Optimistic UI**: mark the slot "pending" in the frontend before the API responds, with rollback on 409.
4. **Real auth**: replace the hardcoded userId with a JWT so users can see their own bookings.
5. **Custom slot lengths**: let each resource define its own slot duration in the DB.
6. **Monitoring**: add a Prometheus counter for `booking_conflicts_total` to track the constraint firing rate under real load.
# Resource-Booking-System
# Resource-Booking-System
