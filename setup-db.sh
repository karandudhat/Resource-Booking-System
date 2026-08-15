#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  setup-db.sh  —  Full one-shot database setup
#  Run from the project root: bash setup-db.sh
# ═══════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

DB_NAME="booking_db"
DB_USER="booking_user"
DB_PASS="booking_pass"

echo ""
echo "🐘 Resource Booking — Database Setup"
echo "─────────────────────────────────────"

# ── 1. Find a working psql superuser connection ──────────────────
PG_SUPER=""
for try_user in "$USER" postgres; do
  if psql -U "$try_user" -c "SELECT 1;" postgres &>/dev/null 2>&1; then
    PG_SUPER="psql -U $try_user"
    echo "✅ Connected to PostgreSQL as: $try_user"
    break
  fi
done

if [ -z "$PG_SUPER" ]; then
  echo ""
  echo "❌ Cannot connect to PostgreSQL."
  echo "   Make sure it's running:"
  echo "     brew services start postgresql@15    (Homebrew macOS)"
  echo "     brew services start postgresql@14"
  echo "     pg_ctl start -D /usr/local/var/postgres"
  echo ""
  echo "   Then re-run: bash setup-db.sh"
  exit 1
fi

# ── 2. Create user ───────────────────────────────────────────────
$PG_SUPER -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" postgres 2>/dev/null \
  && echo "✅ Created user: $DB_USER" \
  || echo "ℹ️  User '$DB_USER' already exists"

# ── 3. Create database ───────────────────────────────────────────
$PG_SUPER -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" postgres 2>/dev/null \
  && echo "✅ Created database: $DB_NAME" \
  || echo "ℹ️  Database '$DB_NAME' already exists"

# ── 4. Grant privileges + install btree_gist (needs superuser) ───
$PG_SUPER -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
$PG_SUPER -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS btree_gist;" \
  && echo "✅ Extension btree_gist installed"

echo ""
echo "🗄️  Running migrations..."
cd backend
npm run migrate

echo ""
echo "🌱 Seeding resources..."
npm run seed

echo ""
echo "─────────────────────────────────────"
echo "🎉 All done! Start the backend with:"
echo "   npm run start:dev"
echo "─────────────────────────────────────"
