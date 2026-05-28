// Adds the spaces.offerings text[] column. Idempotent.
//
//   node --env-file=.env.local scripts/migrate-space-offerings.mjs
//
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const run = (q) => sql.query(q);

console.log("→ Adding spaces.offerings...");
await run(
  `ALTER TABLE spaces ADD COLUMN IF NOT EXISTS offerings text[] NOT NULL DEFAULT '{}'`,
);
console.log("  ✓ spaces.offerings ready");

// Give the seeded spaces a few sensible offerings so the UI isn't empty.
console.log("→ Backfilling seed-space offerings...");
await run(`
  UPDATE spaces SET offerings = ARRAY['projector','sound_system','stage','air_conditioning','pillarless']
  WHERE name = 'Grand Ballroom' AND offerings = '{}'
`);
await run(`
  UPDATE spaces SET offerings = ARRAY['projector','sound_system','podium','air_conditioning']
  WHERE name = 'Conference Hall' AND offerings = '{}'
`);
await run(`
  UPDATE spaces SET offerings = ARRAY['projector','air_conditioning','wheelchair_access']
  WHERE name = 'Executive Boardroom' AND offerings = '{}'
`);
console.log("  ✓ backfilled");

console.log("\nMigration complete.");
