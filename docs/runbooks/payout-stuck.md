# Payout stuck

## Symptoms

- Venue claims they haven't been paid.
- `payouts.status = 'released'` but the venue's bank shows no credit.
- Admin clicked "Mark released" with the wrong UTR and needs to correct it.
- A payout was never created for a confirmed-and-completed booking.

## Diagnostics

```sql
-- Confirmed bookings without a payout (event-completed but payout never queued).
SELECT b.id, b.created_at, b.event_completed_at, q.total_amount
FROM bookings b
JOIN quotes q ON q.id = b.quote_id
LEFT JOIN payouts p ON p.booking_id = b.id
WHERE b.status = 'confirmed'
  AND b.event_completed_at IS NOT NULL
  AND p.id IS NULL;

-- Released payouts older than 3 days with no follow-up support ticket.
SELECT p.id, p.booking_id, p.net_rupees, p.released_at, p.utr
FROM payouts p
WHERE p.status = 'released'
  AND p.released_at < NOW() - INTERVAL '3 days'
ORDER BY p.released_at DESC;
```

## Fix: payout was never created

The "Mark event complete" action both flips `bookings.event_completed_at` and
inserts the payout row. If the second insert failed for some reason, you'll
see a booking with `event_completed_at` set but no payout row. Re-trigger by
manually inserting:

```sql
INSERT INTO payouts (booking_id, property_id, venue_owner_id, gross_rupees,
                     commission_rupees, net_rupees, commission_bps)
SELECT b.id, b.property_id, p.owner_id, q.total_amount,
       FLOOR(q.total_amount * 1000 / 10000), q.total_amount - FLOOR(q.total_amount * 1000 / 10000), 1000
FROM bookings b
JOIN quotes q ON q.id = b.quote_id
JOIN properties p ON p.id = b.property_id
WHERE b.id = '<booking-id>';
```

(Adjust `1000` if commission rate has changed since the row was eligible.)

## Fix: wrong UTR recorded

Update directly — there's no audit log on UTR changes yet, so leave a note in
the payout's `note` field describing the correction:

```sql
UPDATE payouts
SET utr = '<correct-utr>',
    note = COALESCE(note || E'\n', '') || 'UTR corrected ' || NOW() || ' by ' || '<admin-email>'
WHERE id = '<payout-id>';
```

## Fix: venue says they didn't receive money but UTR is recorded

1. Confirm the bank transfer in your own bank's portal — find the UTR, confirm
   the destination account matches the venue's KYC.
2. If the transfer never actually happened (admin clicked "Released" without
   making the bank transfer), re-do the transfer and **don't update the row
   again** — the UTR should already be correct.
3. If the transfer went to the wrong account, this is a real incident. Get
   the wrong recipient on a call to claw it back, and apologise to the venue.

## Permanent fix

Move from manual UTRs to Razorpay Route once the KYC paperwork is done. The
release flow becomes: admin clicks "Release" → we call Razorpay Route's
transfer API → we store the transfer ID in `payouts.utr` (rename to
`razorpay_transfer_id`). Tracked as Step-13.5 follow-up.
