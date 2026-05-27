// One-off migration for Step 12 (event completion + venue payouts).
// Idempotent — safe to run multiple times.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const run = (q) => sql.query(q);

console.log("→ Adding bookings.event_completed_at...");
await run(`
  ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS event_completed_at timestamp with time zone
`);
console.log("  ✓ bookings.event_completed_at exists");

console.log("→ Creating payout_status enum...");
await run(`
  DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'released');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$
`);
console.log("  ✓ payout_status enum exists");

console.log("→ Creating payouts table...");
await run(`
  CREATE TABLE IF NOT EXISTS payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    venue_owner_id text REFERENCES users(id) ON DELETE SET NULL,
    gross_rupees integer NOT NULL,
    commission_rupees integer NOT NULL,
    net_rupees integer NOT NULL,
    commission_bps integer NOT NULL,
    status payout_status NOT NULL DEFAULT 'pending',
    utr text,
    note text,
    released_at timestamp with time zone,
    released_by text REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  )
`);
console.log("  ✓ payouts table exists");

console.log("\nMigration complete.");
