# Double-booking / EXCLUDE constraint violation

## Symptoms

- User-facing error: "One or more spaces are already booked or held for these
  dates."
- Structured log: `event: booking.create_failed` with an error containing
  `booking_spaces_no_overlap`.
- Venue calendar shows two confirmed bookings overlapping on the same space
  (this should be **impossible** — if you see it, the EXCLUDE constraint was
  dropped or bypassed).

## Quick diagnosis

```sql
-- All overlapping confirmed/pending booking_spaces, ignoring expired/cancelled.
SELECT a.space_id, a.booking_id AS a_booking, a.start_date, a.end_date,
       b.booking_id AS b_booking, b.start_date AS b_start, b.end_date AS b_end
FROM booking_spaces a
JOIN booking_spaces b
  ON a.space_id = b.space_id
 AND a.id < b.id
 AND daterange(a.start_date, a.end_date, '[]') && daterange(b.start_date, b.end_date, '[]')
WHERE a.status IN ('pending_payment', 'confirmed')
  AND b.status IN ('pending_payment', 'confirmed');

-- Confirm the constraint still exists.
SELECT conname FROM pg_constraint WHERE conname = 'booking_spaces_no_overlap';
```

If the second query returns zero rows, the constraint was dropped. Re-add it
by re-running:

```sh
pnpm migrate:step8
```

(The script is idempotent — it'll only add the constraint if missing.)

## When the constraint *correctly* rejects a booking

This is the expected case. Two planners raced for the same slot; one won, one
got the error. The losing booking row was rolled back by our app code
(`createBooking` deletes the parent booking on child-insert failure). No
manual fix needed; the user can pick a different venue.

## When you actually have overlapping rows

Don't try to "fix" both. Pick a winner using these tiebreakers, in order:

1. Confirmed beats pending_payment (money has changed hands).
2. Earliest `bookings.created_at` wins among same-status rows.
3. If a tie remains, the planner with the longer-running account wins (use
   `users.created_at`).

Cancel the loser via:

```sql
UPDATE bookings SET status = 'cancelled' WHERE id = '<loser-booking-id>';
UPDATE booking_spaces SET status = 'cancelled' WHERE booking_id = '<loser-booking-id>';
```

Then refund the loser's payment via the Razorpay dashboard and open a support
ticket on their behalf to explain.

## Prevention

The DB-level EXCLUDE constraint is the only thing keeping us safe under race
conditions. App-level checks alone are not enough. Don't ever:

- Drop the constraint to "clean up".
- Disable it in tests (it should be active in the test DB too).
- Change the `WHERE status IN (...)` clause without thinking through what
  statuses are now allowed to coexist.
