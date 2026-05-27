# Payment stuck

## Symptoms

- Planner says they paid but the booking still shows "Pending payment".
- `bookings.status = 'pending_payment'` but a matching `payments` row exists
  with `status = 'success'` or `status = 'created'` past hold expiry.
- Razorpay dashboard shows the order as `paid` but our DB doesn't.

## Why this happens (with current architecture)

We rely on the **client-side redirect callback** to call `verifyPayment` after
Razorpay's checkout closes. If the planner closes the tab before the callback
fires, or the network drops mid-call, the booking stays `pending_payment`
even though money has changed hands. We do *not* yet have a Razorpay webhook
endpoint to reconcile this server-side.

## Diagnostic queries

```sql
-- Bookings that are pending_payment but have a successful payment.
SELECT b.id, b.status, b.hold_expires_at, p.id AS payment_id, p.status, p.razorpay_payment_id, p.completed_at
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id
WHERE b.status = 'pending_payment'
ORDER BY b.created_at DESC;

-- All payments past 30 minutes with no matching confirmed booking.
SELECT p.id, p.razorpay_order_id, p.status, p.created_at, b.status AS booking_status
FROM payments p
JOIN bookings b ON b.id = p.booking_id
WHERE p.created_at < NOW() - INTERVAL '30 minutes'
  AND b.status <> 'confirmed';
```

## Fix (per booking)

1. **Confirm money was actually received.** Cross-check the Razorpay dashboard:
   `Razorpay → Transactions → Payments` and search by the `razorpay_payment_id`.
   If status is not "captured", do NOT confirm the booking — it's a real
   failure, ask the planner to retry.
2. **Manually flip the booking to confirmed.** From a psql session against the
   production DB (use the Neon SQL editor for an audit trail):
   ```sql
   UPDATE payments
     SET status = 'success',
         razorpay_payment_id = 'pay_xxxxxxxxxxxxxx',
         completed_at = NOW()
     WHERE id = '<payment-id>';

   UPDATE bookings SET status = 'confirmed' WHERE id = '<booking-id>';

   UPDATE booking_spaces SET status = 'confirmed' WHERE booking_id = '<booking-id>';
   ```
3. **Notify the planner** by replying to the support ticket they opened (or
   open one on their behalf at `/admin/support`).

## Permanent fix

Wire a Razorpay webhook endpoint at `/api/webhooks/razorpay` that:
- Verifies the `X-Razorpay-Signature` header against `RAZORPAY_WEBHOOK_SECRET`.
- Looks up the payment by `razorpay_order_id`.
- Idempotently flips the booking + booking_spaces to `confirmed`.

That gives us a server-side path that doesn't depend on the planner's browser
completing the callback. Tracked as a Step-13.5 follow-up.
