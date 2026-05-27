# Runbooks

Operational playbooks for things that go wrong. Read these once during
on-call onboarding so you know what's available; reach for the specific one
when an incident actually fires.

| Runbook | When you need it |
|---|---|
| [payment-stuck.md](payment-stuck.md) | Planner sees "Pay" button but Razorpay never finalises the booking, or status stays at `pending_payment` after a charge |
| [webhook-fails.md](webhook-fails.md) | Future Razorpay webhook (not yet wired) doesn't fire or returns 4xx/5xx |
| [double-booking.md](double-booking.md) | Two bookings appear to overlap on the same space, or the EXCLUDE constraint throws unexpectedly |
| [payout-stuck.md](payout-stuck.md) | Pending payout won't release, venue claims they haven't been paid, or wrong UTR was recorded |
| [backup-restore.md](backup-restore.md) | Data lost / corrupted / accidentally truncated, or routine restore drill |
| [security-headers.md](security-headers.md) | Browser shows mixed-content / CSP / iframe errors, or you need to revisit the headers we deliberately deferred |

## General incident response

1. **Stop the bleeding.** If money is moving the wrong way (payments going
   through but bookings not confirming, or payouts releasing twice), flip the
   relevant feature off — easiest is to take the route down in the Next.js
   middleware with a temporary redirect to `/support/new`.
2. **Capture state.** Before changing anything, snapshot the affected rows:
   ```sh
   pnpm db:studio
   ```
   or run a one-off query and save the output to a file in `incident-logs/`
   (gitignored).
3. **Communicate.** Open a support ticket on behalf of the affected user
   (`/admin/support`) with the timeline and what they should expect next.
4. **Fix.** Use the matching runbook.
5. **Write a post-mortem.** Doesn't have to be long: what happened, when, what
   we did, what we'll change so it doesn't happen again.
