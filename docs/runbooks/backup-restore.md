# Backup & restore

## What's backed up automatically

Neon's Postgres takes **point-in-time backups** continuously and retains them
based on your plan:

- **Free plan:** 24 hours of history (good for "oh no, I just truncated").
- **Launch / Scale plan:** 7+ days.

You don't need to schedule anything for that to work. What you *do* need to do
is verify the restore actually works **before** you need it.

## Restore drill (do this once a quarter)

1. **Pick a moment in time** within the retention window — for the first
   drill, just pick "5 minutes ago".
2. **Create a branch from that point** in the Neon dashboard:
   - Neon console → your project → Branches → New branch → "From a point in
     time" → set the timestamp.
   - This makes a writable copy that doesn't touch production data.
3. **Compare row counts** between the branch and prod, on the critical tables:
   ```sql
   SELECT 'bookings' AS t, COUNT(*) FROM bookings
   UNION ALL SELECT 'payments', COUNT(*) FROM payments
   UNION ALL SELECT 'payouts', COUNT(*) FROM payouts
   UNION ALL SELECT 'rfps', COUNT(*) FROM rfps;
   ```
   Run on both, diff the output. They should match within ~the time delta.
4. **Run the app against the branch** by pointing `DATABASE_URL` at the branch
   connection string and starting `pnpm dev`. Confirm the dashboard loads,
   `/venues` lists, you can open a booking detail page.
5. **Delete the branch** when done (it costs money to keep around).

Write the date + result of each drill in `docs/runbooks/drills.md` (create the
file the first time you run a drill).

## Emergency restore — real incident

If production data was lost or corrupted:

1. **Don't panic.** Neon's branches are not destructive. You can create as
   many as you need.
2. **Stop writes immediately** if possible — put the app into maintenance mode
   by deploying a branch that returns 503 from middleware. Better to be down
   than to keep writing on top of corrupted state.
3. **Create a branch** from just before the bad change went out (check the
   structured log timestamps to find the moment).
4. **Verify the branch** has the data you expect using the row-count query
   above.
5. **Cut over.** Swap the production `DATABASE_URL` (in Vercel env vars) to
   point at the branch. Force a redeploy.
6. **Verify the live app.** Smoke test: log in as admin, look at recent
   bookings, confirm payouts page loads.
7. **Communicate.** Open a support ticket for each affected user, explain
   what happened, what was restored, what to do next.

## What we don't back up

- **Razorpay state.** They have their own audit trail; we trust it.
- **Clerk users.** Clerk is the source of truth for sign-in identity.
  Our `users` table is just an index keyed off Clerk's ID; it'll repopulate
  on next sign-in via the onboarding flow.
- **PDF invoices.** They're generated on-demand from data in the DB. No need
  to back them up.

## What we should back up but currently don't

- **Razorpay webhook configuration.** If we ever lose it, we lose the only
  reliable signal that a payment captured. Future: add a `migrate:razorpay`
  script that reapplies webhook config to a fresh account.
- **Clerk JWT public keys.** Clerk rotates them but caches well; if we lose
  network to Clerk, sign-in breaks. There's no fix here other than picking a
  provider with an SLA we trust.
