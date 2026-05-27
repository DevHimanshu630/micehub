// One-off migration for Step 9 (payments table).
// Idempotent — safe to run multiple times.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run(query) {
  return sql.query(query);
}

console.log("→ Creating payment_status enum...");
await run(`
  DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('created', 'success', 'failed');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$
`);
console.log("  ✓ payment_status enum exists");

console.log("→ Creating payments table...");
await run(`
  CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    razorpay_order_id text NOT NULL UNIQUE,
    razorpay_payment_id text,
    amount_paise integer NOT NULL,
    currency text NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'created',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone
  )
`);
console.log("  ✓ payments table exists");

console.log("\nMigration complete.");
