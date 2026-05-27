# MICE Portal — Step-by-Step Build Order

**Rule for every step:** at the end of it, you can *open the browser and see something working*. No long invisible phases. Each step builds on the one before.

Rough total to MVP: **~12 weeks** with 1–2 developers.

---

## Step 1 — "Hello, MICE Portal" (Day 1–3)

**What we build**
- Empty Next.js + TypeScript project, repo on GitHub.
- One public landing page: logo, tagline, "Coming soon" banner.
- Deployed to Vercel with a real URL.
- CI pipeline runs typecheck + lint on every push.

**What you see at the end**
> You open `micehub.vercel.app` on your phone and the landing page loads.

**Why first**
This proves the whole pipeline works — code → CI → deploy → URL. Every later step rides on this.

---

## Step 2 — Database + first table (Day 4–6)

**What we build**
- Postgres database connected (Neon, free tier).
- One table: `properties` (id, name, city, capacity, description).
- A simple "Add Property" form on `/admin/properties/new` (no login yet — temporary).
- A list page `/admin/properties` showing what's in the DB.

**What you see at the end**
> You type in "Taj Lands End, Mumbai, 500 capacity" → click Save → it appears in the list. Refresh the page — still there.

**Why now**
Data is the heart of the system. Once we can store and read it, everything else is just shaping the experience around it.

---

## Step 3 — Public venue listing (Week 2)

**What we build**
- Public page `/venues` — shows the properties from Step 2, with photos, capacity, location.
- Property detail page `/venues/[id]` — bigger photos, full description.
- Basic search bar: filter by city.

**What you see at the end**
> Anyone (no login) can visit the site, browse venues, click into one, see details. You can demo this to a friend and they'll get what the product is.

**Why now**
This is the first thing that *feels like a product*. You can show it to potential customers and get reactions before building deeper.

---

## Step 4 — Authentication for 3 user types (Week 3)

**What we build**
- Sign-up + login for three personas: **Planner**, **Venue**, **Platform Admin**.
- After login, each lands on their own empty dashboard:
  - Planner → `/dashboard` (says "Your RFPs will appear here")
  - Venue → `/venue/dashboard` (says "Your properties will appear here")
  - Admin → `/admin/dashboard` (says "All bookings will appear here")
- Email verification on signup.

**What you see at the end**
> You can sign up as a Planner, log out, sign up again as a Venue, log out, log in as Admin. Each shows a different dashboard.

**Why now**
We had to build auth before any step where "who you are" matters. Doing it now means every later feature just slots in behind the right login.

---

## Step 5 — Venue self-onboarding (Week 4)

**What we build**
- When a Venue logs in, they can add their own property: name, location, photos (uploaded to S3), description, amenities.
- They can add multiple **Spaces** inside their property (main hall, breakout rooms) with capacity and layout options.
- New properties are marked `PENDING_APPROVAL` — they won't show on the public listing yet.
- Platform Admin sees pending properties in their dashboard, can click **Approve** → property goes live.

**What you see at the end**
> A real venue (Rajesh from Taj) can sign up, add his property, upload photos. You (as Admin) approve it. It appears on the public `/venues` page within seconds.

**Why now**
This unlocks the supply side of the marketplace. Without venues self-onboarding, you'd have to manually add every property — which doesn't scale.

---

## Step 6 — Planner search & RFP (Week 5–6)

**What we build**
- Planner side: better search — filter by city, capacity, date range, amenities.
- "Request a Quote" button on each venue.
- An RFP wizard form: event type, dates, guest count, F&B needs, A/V needs.
- Planner can select multiple venues and send the same RFP to all of them in one go.
- Each selected Venue sees the RFP in their inbox.

**What you see at the end**
> Priya logs in as a Planner, searches for 500-capacity venues in Mumbai, picks 3, sends an RFP. Rajesh (logged in at Taj) sees a new RFP in his inbox immediately.

**Why now**
This is where the two sides of the marketplace first *connect*. Before this, planners and venues were in separate silos.

---

## Step 7 — Venue quotes & comparison (Week 7)

**What we build**
- Venue side: quote-builder form — add line items (space rental, F&B per person, A/V package), system calculates total.
- Venue clicks "Send Quote" → goes back to Planner.
- Planner sees all quotes side-by-side in a comparison table: price, inclusions, response time.

**What you see at the end**
> Three venues respond to Priya's RFP with different quotes. Priya sees them in a comparison grid and can pick a winner.

**Why now**
With this, the system is *commercially complete on the conversation side* — even without payments, two parties can fully negotiate a deal here.

---

## Step 8 — Booking + soft hold (Week 8)

**What we build**
- Planner clicks "Book this Quote" → system creates a 15-minute **soft hold** on the venue's calendar.
- Postgres `EXCLUDE` constraint enforced at the DB level: no two bookings can overlap on the same space.
- Booking status starts as `PENDING_PAYMENT`.
- A simple calendar view on the Venue side shows held + confirmed slots.

**What you see at the end**
> Priya clicks Book. Rajesh refreshes his calendar — the slot is now marked "HELD" in yellow. If Priya doesn't pay in 15 minutes, the hold auto-releases.

**Why now**
This is the **single most important technical step** for an industry-grade booking system. Get this wrong and you get double-bookings. We isolate it as its own step so we can test it hard.

---

## Step 9 — Payments via Razorpay (Week 9)

**What we build**
- Razorpay integration (test mode first).
- After clicking Book, Priya sees "Pay 20% Advance" → Razorpay checkout opens.
- On payment success, Razorpay webhook hits our backend → booking flips to `CONFIRMED`, hold becomes a permanent block.
- Idempotency keys on every payment call (no duplicate charges if she clicks twice).
- Failed/abandoned payments → hold expires after 15 min, slot released.

**What you see at the end**
> Priya pays ₹3.6 lakh (test card). Booking turns green = CONFIRMED. Rajesh's calendar slot turns from yellow to green. Real money flow is working.

**Why now**
Money is the trickiest part. We do it after the booking logic is solid, so we can focus on payment edge cases (failures, refunds, duplicates) without also debugging booking bugs.

---

## Step 10 — Invoices + notifications (Week 10)

**What we build**
- On payment confirm, generate a PDF GST invoice (using `@react-pdf/renderer`).
- Email to Priya + Rajesh with booking details + invoice attached (Resend or SES).
- SMS to both (MSG91).
- Both can download invoices from their dashboards anytime.

**What you see at the end**
> Priya pays → within 10 seconds, both she and Rajesh get an email + SMS. Invoice PDF looks professional and has the right GSTIN.

**Why now**
A booking isn't really "done" without artifacts the user can keep. This step turns the digital transaction into something they can show their boss or auditor.

---

## Step 11 — Platform Admin tools (Week 11)

**What we build**
- Admin dashboard: list of all bookings, all venues, all users.
- Admin can search any booking by ID, see full timeline + audit log.
- Simple support-ticket inbox — users can click "Need Help" → ticket created → Admin replies.
- Approve/reject new property listings (we already started this in Step 5).

**What you see at the end**
> You (as Admin) can see every booking on the platform, jump to any one, and help users who reach out. The marketplace is now *operable*.

**Why now**
Before launch, you need the tools to run the business. Without this, you'd be SSH-ing into the database to answer support questions.

---

## Step 12 — Payouts to venues (Week 12)

**What we build**
- After an event is marked complete, calculate venue payout = booking amount − platform commission.
- Payout queue in Admin dashboard.
- Admin clicks "Release Payout" → triggers Razorpay Route transfer to venue's bank account.
- Venue sees payout status in their dashboard.

**What you see at the end**
> Event happens → 2 days later, Admin clicks Release → Rajesh sees ₹16.2 lakh hit Taj's bank account. **Full money cycle is complete.**

**Why now**
This is the last piece that makes the platform sustainable. Without payouts, venues stop using the platform.

---

## Step 13 — Hardening before real launch (Week 13–14)

**What we build (no new features — just safety)**
- Sentry wired everywhere → every error gets logged.
- Structured logs to Axiom/Datadog.
- Load test with k6 (simulate 1000 concurrent searches, 100 concurrent bookings).
- Security review (OWASP top 10) + third-party pen test.
- Backup + restore drill for the database.
- Runbook for common incidents (payment stuck, webhook fails, etc.).

**What you see at the end**
> When something breaks at 2 AM, you know exactly what broke and how to fix it. You sleep peacefully.

**Why last**
You can't harden what doesn't exist yet. But you also can't launch publicly without this. Two weeks of "boring" work that prevents disasters later.

---

## Visual Recap

```
Week 1  →  Step 1: Landing page live
Week 1  →  Step 2: First DB table + admin form
Week 2  →  Step 3: Public venue listing
Week 3  →  Step 4: Auth for 3 user types
Week 4  →  Step 5: Venue self-onboarding
Week 5–6 → Step 6: Search + RFP
Week 7  →  Step 7: Quotes + comparison
Week 8  →  Step 8: Booking + soft hold ⭐ critical
Week 9  →  Step 9: Razorpay payments ⭐ critical
Week 10 →  Step 10: Invoices + notifications
Week 11 →  Step 11: Admin tools
Week 12 →  Step 12: Payouts to venues
Week 13–14 → Step 13: Hardening + launch prep
```

---

## The Three Golden Rules

1. **Never skip a step.** Each one is meaningful on its own. Skipping means future steps stand on shaky ground.
2. **Demo at the end of every step.** Show it to 1 real planner or 1 real venue manager. Their reaction = your next sprint planning.
3. **Don't add features that aren't in this list.** Every "while we're at it…" idea goes into a backlog file, not into the current step. We ship MVP first, polish later.

---

## What "Done" Looks Like at Each Step

| Step | Done = |
|---|---|
| 1 | Friend opens URL on their phone, page loads |
| 2 | You add a venue, refresh, still there |
| 3 | A non-tech friend understands what the product is |
| 4 | Three different signups, three different dashboards |
| 5 | A real venue can list themselves without your help |
| 6 | A real planner can find a venue and request a quote |
| 7 | A planner can compare 3 quotes and pick one |
| 8 | Two planners cannot book the same slot — DB stops them |
| 9 | Test payment flows from card → confirmed booking |
| 10 | Both sides get a real-looking invoice in their email |
| 11 | You can run the marketplace without opening any code |
| 12 | A venue sees money hit their bank account |
| 13 | Sentry catches an error, alerts you, you have a fix in an hour |

When all 13 are green, **MVP is live and real customers can transact**.
