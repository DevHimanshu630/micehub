// Backfill bookable spaces for properties that have none.
// Idempotent — only touches properties with zero spaces, so re-running is safe.
//
//   node --env-file=.env.local scripts/seed-spaces.mjs
//
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const properties = await sql.query(`
  SELECT p.id, p.name, p.capacity, COUNT(s.id) AS space_count
  FROM properties p
  LEFT JOIN spaces s ON s.property_id = p.id
  GROUP BY p.id
  ORDER BY p.created_at
`);

let added = 0;

for (const p of properties) {
  if (Number(p.space_count) > 0) {
    console.log(`• ${p.name}: already has ${p.space_count} space(s), skipping`);
    continue;
  }

  const cap = Number(p.capacity);
  // A main hall at full capacity, a mid-size hall, and a small boardroom.
  const spaces = [
    {
      name: "Grand Ballroom",
      capacity: cap,
      description: `Pillarless main hall, seats up to ${cap.toLocaleString("en-IN")} guests. Stage, AV, and in-house catering available.`,
    },
    {
      name: "Conference Hall",
      capacity: Math.max(50, Math.round(cap * 0.4)),
      description:
        "Theatre or classroom layout for conferences and sessions. Projector and PA included.",
    },
    {
      name: "Executive Boardroom",
      capacity: Math.max(20, Math.round(cap * 0.08)),
      description:
        "Private boardroom for meetings and breakouts. Conference table, screen, and video-call setup.",
    },
  ];

  for (const s of spaces) {
    await sql`
      INSERT INTO spaces (property_id, name, capacity, description)
      VALUES (${p.id}, ${s.name}, ${s.capacity}, ${s.description})
    `;
    added++;
  }
  console.log(
    `✓ ${p.name}: added ${spaces.length} spaces (caps: ${spaces.map((s) => s.capacity).join(", ")})`,
  );
}

console.log(`\nDone. Added ${added} space(s) total.`);
