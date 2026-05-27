// One-off migration for Step 11 (support tickets + messages).
// Idempotent — safe to run multiple times.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const run = (q) => sql.query(q);

console.log("→ Creating support_ticket_status enum...");
await run(`
  DO $$ BEGIN
    CREATE TYPE support_ticket_status AS ENUM ('open', 'resolved');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$
`);
console.log("  ✓ support_ticket_status enum exists");

console.log("→ Creating support_tickets table...");
await run(`
  CREATE TABLE IF NOT EXISTS support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opened_by text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    status support_ticket_status NOT NULL DEFAULT 'open',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    resolved_at timestamp with time zone
  )
`);
console.log("  ✓ support_tickets table exists");

console.log("→ Creating support_messages table...");
await run(`
  CREATE TABLE IF NOT EXISTS support_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    from_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  )
`);
console.log("  ✓ support_messages table exists");

console.log("\nMigration complete.");
