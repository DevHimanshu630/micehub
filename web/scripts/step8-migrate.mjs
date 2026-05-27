// One-off migration for Step 8 (bookings + booking_spaces + EXCLUDE constraint).
// Idempotent — safe to run multiple times.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run(query) {
  return sql.query(query);
}

console.log("→ Enabling btree_gist extension...");
await run(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
console.log("  ✓ btree_gist enabled");

console.log("→ Creating booking_status enum...");
await run(`
  DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending_payment', 'confirmed', 'expired', 'cancelled');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$
`);
console.log("  ✓ booking_status enum exists");

console.log("→ Creating bookings table...");
await run(`
  CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id uuid NOT NULL UNIQUE REFERENCES quotes(id) ON DELETE RESTRICT,
    planner_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    status booking_status NOT NULL DEFAULT 'pending_payment',
    hold_expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  )
`);
console.log("  ✓ bookings table exists");

console.log("→ Creating booking_spaces table...");
await run(`
  CREATE TABLE IF NOT EXISTS booking_spaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending_payment'
  )
`);
console.log("  ✓ booking_spaces table exists");

console.log("→ Adding EXCLUDE constraint to block overlapping bookings...");
const existing = await run(
  `SELECT 1 FROM pg_constraint WHERE conname = 'booking_spaces_no_overlap'`,
);
if (existing.length === 0) {
  await run(`
    ALTER TABLE booking_spaces
    ADD CONSTRAINT booking_spaces_no_overlap
    EXCLUDE USING gist (
      space_id WITH =,
      daterange(start_date, end_date, '[]') WITH &&
    ) WHERE (status IN ('pending_payment', 'confirmed'))
  `);
  console.log("  ✓ booking_spaces_no_overlap EXCLUDE constraint added");
} else {
  console.log("  ✓ EXCLUDE constraint already exists");
}

console.log("\nMigration complete.");
