# Webhook fails

> **Note:** the Razorpay webhook is **not yet wired** as of step 13. We rely on
> the client-side redirect callback. This runbook is the future shape — keep
> it in sync when you implement the endpoint.

## Symptoms

- Razorpay dashboard shows webhook delivery attempts with 4xx / 5xx response
  codes against our `/api/webhooks/razorpay` endpoint.
- Bookings stay `pending_payment` after a successful charge (see also
  [payment-stuck.md](payment-stuck.md)).
- Structured log shows `event: webhook.razorpay.*` with `level: error`.

## First 5 minutes

1. Check the Razorpay dashboard: **Settings → Webhooks → \[your endpoint\] →
   Recent deliveries**. Failed deliveries show the response body returned.
2. The two most common failures:
   - **`401 Invalid signature`** → `RAZORPAY_WEBHOOK_SECRET` in our env doesn't
     match the secret configured on Razorpay's side. Rotate one and update
     the other.
   - **`500 internal`** → real bug, check the structured log (`event:
     webhook.razorpay.process_failed`) and the stack trace.

## Replaying missed webhooks

Razorpay's dashboard has a "Retry" button on each failed delivery. For larger
backfills, use their **Webhook events** export:

1. Export the failed events as CSV from Razorpay dashboard.
2. For each `payment.captured` event in the CSV, run the reconciliation query
   from [payment-stuck.md](payment-stuck.md) to flip the booking manually.

## Signature verification

Webhooks must be verified with `crypto.timingSafeEqual` — the existing
`verifyRazorpaySignature` helper in `src/lib/razorpay.ts` already uses it for
the redirect callback. Reuse it; do not roll your own.

## Defence in depth

Even with the webhook live, keep the redirect callback path active. Both
should be idempotent so duplicate notifications are safe. The booking should
flip to `confirmed` exactly once regardless of which arrives first.
