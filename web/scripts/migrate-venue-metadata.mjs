// Adds venue metadata (address, venue_type, ownership, amenities) to properties
// and backfills sensible values for the known seed venues. Idempotent.
//
//   node --env-file=.env.local scripts/migrate-venue-metadata.mjs
//
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const run = (q) => sql.query(q);

console.log("→ Creating venue_type enum...");
await run(`
  DO $$ BEGIN
    CREATE TYPE venue_type AS ENUM (
      'convention_centre', 'auditorium', 'exhibition_hall',
      'hotel_ballroom', 'standalone_hall', 'other'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$
`);

console.log("→ Creating ownership_type enum...");
await run(`
  DO $$ BEGIN
    CREATE TYPE ownership_type AS ENUM (
      'government', 'private', 'hotel_brand', 'other'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$
`);

console.log("→ Adding columns to properties...");
await run(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS address text`);
await run(
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS venue_type venue_type NOT NULL DEFAULT 'other'`,
);
await run(
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership ownership_type NOT NULL DEFAULT 'private'`,
);
await run(
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}'`,
);
console.log("  ✓ columns ready");

// Backfill known seed venues by name. Only updates rows still on defaults so
// re-running won't clobber edits made through the UI.
const seeds = [
  {
    name: "Taj Lands End",
    address: "Bandstand, Bandra West, Mumbai 400050",
    venue_type: "hotel_ballroom",
    ownership: "hotel_brand",
    amenities: [
      "catering",
      "av_equipment",
      "parking",
      "wifi",
      "accommodation",
      "valet",
    ],
  },
  {
    name: "ITC Maurya",
    address: "Sardar Patel Marg, Diplomatic Enclave, New Delhi 110021",
    venue_type: "hotel_ballroom",
    ownership: "hotel_brand",
    amenities: [
      "catering",
      "av_equipment",
      "video_conferencing",
      "parking",
      "wifi",
      "accommodation",
    ],
  },
  {
    name: "Leela Palace",
    address: "Diplomatic Enclave, Chanakyapuri, New Delhi 110023",
    venue_type: "hotel_ballroom",
    ownership: "hotel_brand",
    amenities: [
      "catering",
      "av_equipment",
      "parking",
      "wifi",
      "accommodation",
      "valet",
    ],
  },
  {
    name: "JW Marriott",
    address: "Senapati Bapat Road, Pune 411053",
    venue_type: "hotel_ballroom",
    ownership: "hotel_brand",
    amenities: [
      "catering",
      "av_equipment",
      "video_conferencing",
      "parking",
      "wifi",
    ],
  },
  {
    name: "Hyatt Regency",
    address: "Bhikaji Cama Place, Ring Road, New Delhi 110066",
    venue_type: "hotel_ballroom",
    ownership: "hotel_brand",
    amenities: ["catering", "av_equipment", "parking", "wifi", "accommodation"],
  },
  {
    name: "Yasho Bhoomi",
    address: "Sector 25, Dwarka, New Delhi 110061",
    venue_type: "convention_centre",
    ownership: "government",
    amenities: [
      "catering",
      "av_equipment",
      "video_conferencing",
      "parking",
      "wifi",
      "stage",
    ],
  },
];

let updated = 0;
for (const s of seeds) {
  const res = await sql`
    UPDATE properties
    SET address = ${s.address},
        venue_type = ${s.venue_type}::venue_type,
        ownership = ${s.ownership}::ownership_type,
        amenities = ${s.amenities}
    WHERE name = ${s.name}
      AND venue_type = 'other'
    RETURNING id
  `;
  if (res.length > 0) {
    console.log(`  ✓ backfilled ${s.name}`);
    updated += res.length;
  } else {
    console.log(`  • ${s.name}: already set or not found, skipping`);
  }
}

console.log(`\nMigration complete. Backfilled ${updated} venue(s).`);
