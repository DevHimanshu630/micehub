// Promote a user to admin role by email.
// Usage:
//   node --env-file=.env.local scripts/promote-to-admin.mjs <email>
//
// Pre-requisite: the user must have already signed up via /sign-up and
// completed /onboarding (so a row exists in the `users` table).
import { neon } from "@neondatabase/serverless";

const email = process.argv[2];
if (!email) {
  console.error(
    "Usage: node --env-file=.env.local scripts/promote-to-admin.mjs <email>",
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const existing =
  await sql`SELECT id, email, role FROM users WHERE email = ${email} LIMIT 1`;
if (existing.length === 0) {
  console.error(
    `No user found with email ${email}. They must sign up and complete onboarding first.`,
  );
  process.exit(1);
}

if (existing[0].role === "admin") {
  console.log(`${email} is already an admin. Nothing to do.`);
  process.exit(0);
}

const updated =
  await sql`UPDATE users SET role = 'admin' WHERE email = ${email} RETURNING id, email, role`;
console.log("✓ Promoted:", updated[0]);
console.log(`\n${email} can now sign in and go to /admin/dashboard`);
