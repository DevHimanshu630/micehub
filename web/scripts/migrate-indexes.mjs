// Adds indexes on hot filter/join columns. Postgres does NOT auto-index
// foreign keys, and our browse filters (status, city, capacity, venue_type,
// ownership, amenities) all benefit from indexes at scale. Idempotent.
//
//   node --env-file=.env.local scripts/migrate-indexes.mjs
//
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const run = (q) => sql.query(q);

// pg_trgm powers fast ILIKE '%city%' searches via a GIN index.
console.log("→ Enabling pg_trgm extension...");
await run(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

const indexes = [
  // properties — the browse hot path
  `CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_status_created ON properties (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties (owner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_capacity ON properties (capacity)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_venue_type ON properties (venue_type)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_ownership ON properties (ownership)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_amenities ON properties USING gin (amenities)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_city_trgm ON properties USING gin (city gin_trgm_ops)`,
  // spaces
  `CREATE INDEX IF NOT EXISTS idx_spaces_property ON spaces (property_id)`,
  // rfps / recipients
  `CREATE INDEX IF NOT EXISTS idx_rfps_planner ON rfps (planner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_rfp_recipients_rfp ON rfp_recipients (rfp_id)`,
  `CREATE INDEX IF NOT EXISTS idx_rfp_recipients_property ON rfp_recipients (property_id)`,
  // quotes / line items
  `CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote ON quote_line_items (quote_id)`,
  // bookings
  `CREATE INDEX IF NOT EXISTS idx_bookings_planner ON bookings (planner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings (property_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status)`,
  `CREATE INDEX IF NOT EXISTS idx_booking_spaces_booking ON booking_spaces (booking_id)`,
  // payments
  `CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments (booking_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status)`,
  // payouts
  `CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts (status)`,
  `CREATE INDEX IF NOT EXISTS idx_payouts_owner ON payouts (venue_owner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payouts_property ON payouts (property_id)`,
  // support
  `CREATE INDEX IF NOT EXISTS idx_support_tickets_opener ON support_tickets (opened_by)`,
  `CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status)`,
  `CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages (ticket_id)`,
];

for (const stmt of indexes) {
  await run(stmt);
  const name = stmt.match(/idx_[a-z_]+/)?.[0] ?? stmt;
  console.log(`  ✓ ${name}`);
}

console.log("\nIndexes ready.");
