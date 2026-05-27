# Load tests

We use [k6](https://k6.io) for load testing. The scripts here target only the
publicly accessible parts of the app (landing + venue listing). Authenticated
flows (RFP creation, payments, payout release) aren't exercised because they
need Clerk session cookies that k6 can't get without proxying through a real
browser.

## Setup

```sh
brew install k6   # or download from https://k6.io/docs/get-started/installation/
```

## Run

```sh
# 1. Always start with smoke to make sure BASE_URL is reachable.
k6 run -e BASE_URL=http://localhost:3000 load-tests/smoke.js

# 2. Then the real load test — points either at local dev or a preview deploy.
k6 run -e BASE_URL=http://localhost:3000 load-tests/search.js
```

For more realistic numbers, point at a deployed environment rather than `next
dev` (the dev server adds significant overhead, so its p95 isn't meaningful).

## What "passing" looks like

The scripts have built-in thresholds:

- `http_req_failed: rate<0.02` — fewer than 2% of requests error
- `http_req_duration p(95)<2000ms` — 95th-percentile response under 2s
- `http_req_duration p(99)<4000ms` — 99th-percentile under 4s

k6 exits non-zero if any threshold is violated. Wire that into CI when you're
ready to make load testing a pre-merge gate.

## What we are NOT testing yet

- Authenticated flows (RFP, booking, payment) — needs a Clerk-aware session
  harness. When you build it: log in via Clerk's API in `setup()`, share the
  cookie via `__VU` state.
- Concurrent booking on the same space — needs a test fixture that resets the
  DB between runs. Plan: add a `/api/test/reset` route gated behind an env flag
  and only enabled on a staging DB.
- Webhook receiver — once you wire a Razorpay webhook (currently we rely on the
  client-side redirect callback), point a separate k6 script at it with
  pre-signed mock payloads.
