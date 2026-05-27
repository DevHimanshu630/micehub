# Security headers

## What we send today

Configured in [`web/next.config.ts`](../../web/next.config.ts), applied to
every route:

| Header | Value | Why |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Block MIME-type sniffing attacks |
| `X-Frame-Options` | `SAMEORIGIN` | Block clickjacking via iframe embeds |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Don't leak URLs to third parties |
| `Permissions-Policy` | camera/mic/geo off, payment=self | Drop browser permissions we don't use |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS in browsers that have seen us once |

Verify in a deployed environment with:

```sh
curl -sI https://<your-domain>/ | grep -i -E 'x-frame|x-content|referrer|permissions|strict-transport'
```

## What we deliberately don't send (yet)

### Content-Security-Policy

Adding a CSP that doesn't break the app is non-trivial because we load:

- **Clerk widgets** — they inline scripts and load resources from
  `*.clerk.accounts.dev`.
- **Razorpay checkout.js** — loaded from `checkout.razorpay.com`, opens
  popups, posts back to our origin.
- **Next.js** — uses inline `<script>` tags for hydration data (nonce-based
  CSP is possible but each route needs the nonce threaded through).

If you decide to add CSP before public launch:

1. Start with **report-only** mode (`Content-Security-Policy-Report-Only`) so
   nothing breaks while you discover violations.
2. Use a free reporting endpoint like [report-uri.com](https://report-uri.com)
   for the first few weeks.
3. Once the report log is quiet, switch to enforcing mode.
4. Don't forget to test the Razorpay checkout end-to-end — the popup is the
   most fragile bit.

### CORS

We don't set CORS headers because we don't expose any cross-origin API
endpoints. `/api/invoices/[bookingId]` is same-origin only; the security
model is Clerk session cookies + ownership check. If we ever add a public
JSON API, we'll need explicit CORS allow-lists.

## When to revisit this file

- Before going to a real public launch.
- After any major dependency change that adds a third-party script tag.
- After a Vercel platform change that affects response-header passthrough.
