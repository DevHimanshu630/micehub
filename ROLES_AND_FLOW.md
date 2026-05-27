# MICE Portal — Roles & Real Booking Scenario

This document answers: *Who uses the system, how many of each, and what exactly happens when a user tries to book a space?*

---

## 1. The Four Sides of the Platform

There are **4 distinct "sides"** of the system. Each side has its own login, its own dashboard, and its own permissions.

```
┌──────────────────┐     ┌──────────────────┐
│   USER SIDE      │     │   VENUE SIDE     │
│  (the Planner)   │◄───►│ (the Property)   │
│                  │ RFP │                  │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │      Booking flow      │
         └────────────┬───────────┘
                      │
              ┌───────▼────────┐
              │ PLATFORM ADMIN │  (your company — runs the marketplace)
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ SOFTWARE ADMIN │  (you / dev team — fixes bugs, technical issues)
              └────────────────┘
```

---

## 2. Roles, Counts, and Responsibilities

### A. USER SIDE — "The Planner" (the customer)
The person/company booking the venue for an event.

#### MVP (Phase 1 launch) — single-user model
| Role | How many per organisation | What they do |
|---|---|---|
| **Planner** | 1 login per company | Creates RFP, compares quotes, **pays directly**, downloads GST invoice. |

> **Example (MVP):** *"Acme Pvt Ltd"* signs up with one login (Priya). She does everything herself: searches venues, sends RFP, picks quote, pays via Razorpay, downloads invoice. No separate finance step.
>
> This matches reality for most SMBs and small event companies — there is no separate finance department, the same person handles booking + payment.

#### Future (Phase 4+) — multi-user for larger companies
Add these roles **only when an enterprise customer asks for it**:

| Role | How many | What they do |
|---|---|---|
| **Planner Admin** | 1 per company | Invites teammates, sees consolidated billing. |
| **Planner Member** | 0–50 per company | Creates RFPs, compares quotes, requests bookings. |
| **Finance Approver** *(optional toggle)* | 0–3 per company | Only enabled if the company turns on "require approval for payments > ₹X". |

> Keep the data model ready for multi-user from day one (every booking belongs to an `Organisation`), but **don't build the approval UI in MVP** — ship single-user, add roles when a real customer needs them.

---

### B. VENUE SIDE — "The Property" (the supplier)
The hotel, banquet hall, or convention centre listed on your platform.

| Role | How many per property | What they do |
|---|---|---|
| **Property Owner / GM** | 1 per property | Master account for the venue, approves staff, sees revenue. |
| **Sales Manager** | 1–5 per property | Responds to RFPs, sends quotes, negotiates. |
| **Banquet / Operations Manager** | 1–3 per property | Confirms availability, manages calendar, handles setup. |
| **Front Desk / Reservations** | 1–10 per property | Day-of-event check-in, room block management. |
| **Finance (Property)** | 1–2 per property | Issues invoices, processes refunds, reconciles payouts. |

> **Example:** *"Taj Lands End, Mumbai"* is one Property. It has 1 GM, 3 sales managers, 2 banquet ops, 5 front-desk users, 1 finance.

A **Property Group** (e.g. "Taj Hotels") can own multiple Properties — one Group Admin sits above the Property level.

---

### C. PLATFORM ADMIN — "Your Company" (marketplace operator)
The team running the MICE portal as a business.

| Role | How many (your company) | What they do |
|---|---|---|
| **Super Admin** | 1–2 only | Full god-mode. Can do anything. Used rarely. |
| **Operations Admin** | 2–5 | Onboards new properties, verifies KYC, sets commission %. |
| **Customer Support** | 3–15 (scales with users) | Handles user complaints, refund disputes, calls planners/venues. |
| **Finance Admin** | 1–3 | Reconciles payments, releases payouts to venues, GST filings. |
| **Content / Catalogue Admin** | 1–2 | Reviews property photos, descriptions, pricing changes. |

> **Example:** Your company "MICEHub" has 1 Super Admin (CTO), 3 Ops, 6 Support, 2 Finance, 1 Catalogue.

---

### D. SOFTWARE ADMIN — "Developer / DevOps Team"
This is **technically different from Platform Admin** — they don't manage business operations, they keep the software running.

| Role | How many | What they do |
|---|---|---|
| **Software Admin (Dev/DevOps)** | 1–5 (depending on team size) | Receives technical escalations, accesses logs (Sentry/Datadog), fixes bugs, deploys patches. |
| **On-call Engineer** | 1 rotating | Pager duty for outages. |

They **never** click around the UI to fix a user's booking — they fix the *system* so users can fix it themselves. If a Platform Admin can't resolve an issue (e.g. payment stuck, booking not showing), they raise a ticket → Software Admin investigates.

---

## 3. The Hierarchy in One Picture

```
SOFTWARE ADMIN (you, the dev team)
    │ fixes bugs / outages
    ▼
PLATFORM ADMIN (your company's ops & support team)
    │ approves properties, handles support tickets
    ▼
┌─────────────────┬──────────────────┐
│                 │                  │
PROPERTY OWNER    PLANNER (single login in MVP)
│
├ Sales Mgr
├ Banquet Ops
├ Front Desk
└ Finance
```

---

## 4. End-to-End Scenario — "Priya from Acme books Taj Lands End for a 2-day conference"

This is the full happy path + what happens when something breaks. **MVP version — single user does everything.**

### Step 1 — Planner creates an RFP
- **Who:** Priya (Planner at Acme Pvt Ltd) logs into the **User Side** with her single login.
- **What she does:** Fills a form — *"500 attendees, 12–13 June 2026, Mumbai, need 1 main hall + 4 breakout rooms + 250 hotel rooms + lunch + A/V."*
- **System action:** Creates RFP record, finds 8 matching properties in Mumbai, sends the RFP to each.
- **What's visible:** Priya sees "RFP sent to 8 properties — waiting for quotes."

### Step 2 — Property receives the RFP
- **Who:** Rajesh (Sales Manager at Taj Lands End) logs into the **Venue Side**.
- **What he sees:** New RFP in his inbox with all event details.
- **What he does:** Checks the calendar (built into the dashboard), confirms the dates are open, builds a quote: ₹18 lakh.
- **System action:** Quote is sent back to Priya; appears in her *"Quote Comparison"* view alongside 7 other quotes.

### Step 3 — Planner picks a quote, books, and pays — all in one flow
- **Who:** Priya. Same login. No handoff to anyone else.
- **What she does:**
  1. Compares 8 quotes, picks Taj's.
  2. Clicks *"Proceed to Book."*
  3. Reviews booking summary on next screen.
  4. Clicks *"Pay 20% Advance Now"* (₹3.6 lakh) → Razorpay checkout opens inline.
  5. Pays via UPI / card / netbanking.
- **System action (this is the critical part):**
  1. **Soft Hold** — when she clicks *"Proceed to Book"*, system creates a 15-minute hold on the Main Hall + 4 breakouts + 250 rooms. Inventory is locked using a Postgres `EXCLUDE` constraint so **no one else can grab the same slot** while she's paying.
  2. Booking record created with status `PENDING_PAYMENT`.
  3. Razorpay payment link generated with an **idempotency key** — if Priya clicks "Pay" twice or her network drops, only one charge happens.
  4. On payment success, Razorpay sends a **webhook** to the backend.
  5. Backend atomically: marks booking `CONFIRMED`, converts the soft hold into a permanent inventory block, generates a GST invoice PDF, fires emails/SMS to Priya + Taj.
  6. Audit log entry written.
- **What Priya sees:** Confirmation screen with booking ID, invoice download button, "Add to calendar" link. Email + SMS arrive within seconds.

> **Why no separate finance approval step in MVP:** Most SMBs don't have one. The same person who books also pays. Adding an extra approval step here would just slow things down and cost us conversions. The system is *designed* so we can add an optional approval workflow later (Phase 4+) for enterprises that ask for it — but we ship without it.

### Step 4 — Venue side confirms
- **Who:** Meera (Banquet Ops at Taj) gets a notification.
- **What she sees:** Confirmed booking on her calendar with full details, attendee list, F&B preferences.
- **What she does:** Marks the rooms as blocked in her internal Taj system too, assigns a coordinator.

### Step 5 — Event day
- Front desk uses the **Reservations dashboard** to check in attendees.
- Priya has a live event-day view of what's happening.
- After the event, Priya gets a notification to settle the remaining 80% — same one-click pay flow as the advance.

### Step 6 — Payout to venue
- **Who:** Suresh (Finance Admin at *MICEHub* — Platform Admin side).
- **What he sees:** "Payout queue" — booking complete, time to release ₹18 lakh minus 10% commission to Taj.
- **What he does:** Reviews, clicks *"Release Payout."*
- **System action:** Triggers bank transfer via Razorpay Route / RazorpayX.

> Note: the *Platform Admin* finance role on the MICEHub side stays — that's **your company's** finance person managing payouts to venues. Different from a Planner's internal finance team.

---

## 5. What If Something Goes Wrong? — The Escalation Path

This is the **"in case any issue persists, they can contact Software Admin"** flow you asked about.

### Scenario: Payment was deducted but booking shows "Pending"

```
Planner (Priya — same single login that paid)
   │ "Money is gone but my booking isn't confirmed!"
   │ Clicks "Need Help" → creates Support Ticket
   ▼
Customer Support (MICEHub — Platform Admin side)
   │ Opens admin panel, looks up the booking by ID
   │ Sees: payment status = SUCCESS, booking status = PENDING_PAYMENT
   │ Tries to manually trigger reconciliation
   │ → it fails with "Webhook signature mismatch"
   │ This is a technical problem they can't fix.
   │ Escalates ticket with severity HIGH
   ▼
Software Admin (Dev Team)
   │ Receives alert (also gets Sentry error notification automatically)
   │ Opens Sentry → sees the exception stack trace
   │ Opens Datadog logs → sees Razorpay sent webhook 3 times, all rejected
   │ Roots cause: webhook secret rotated yesterday, app still has old one
   │ Fix: deploy updated env var
   │ Re-process the queued webhook
   │ Booking auto-confirms → Priya gets confirmation email
   │ Notifies Support → Support closes ticket with Priya
   ▼
Post-mortem
   │ Add monitoring alert for webhook signature failures
   │ Add runbook: "if webhook fails, check secret rotation"
```

### Severity ladder (who handles what)

| Severity | Example | First responder | Escalates to |
|---|---|---|---|
| **P4 — Question** | "How do I change my GST number?" | Customer Support | (resolves directly) |
| **P3 — Data fix** | "Wrong venue capacity shown" | Catalogue Admin | Ops Admin |
| **P2 — Single user blocked** | "Can't download my invoice" | Customer Support | Software Admin |
| **P1 — Multiple users affected** | "Payments failing for everyone" | On-call Engineer | Software Admin team + CTO |
| **P0 — Outage** | "Whole site is down" | On-call Engineer | All hands |

---

## 6. Summary Table — Who Logs in Where

| Persona | Logs in at | Sees |
|---|---|---|
| Priya (Planner — single login) | `app.micehub.com` | RFP wizard, quote comparison, my bookings, **pay & invoices** |
| Rajesh (Sales Mgr, Taj) | `venue.micehub.com` | RFP inbox, calendar, quote builder |
| Meera (Banquet Ops, Taj) | `venue.micehub.com` | Confirmed bookings, event schedule |
| Suresh (MICEHub Finance) | `admin.micehub.com` | Payouts, reconciliation, GST reports |
| Customer Support (MICEHub) | `admin.micehub.com` | Tickets, user lookup, refund tools |
| Dev / DevOps (Software Admin) | Sentry, Datadog, GitHub, SSH/Cloud console | Logs, traces, infra — **not the app UI** |

---

## 7. Key Takeaway

The system has **a separation of concerns**:

- **Users (Planners + Venues)** can self-serve 95% of tasks.
- **Platform Admin** handles the remaining 5% (business issues, manual overrides).
- **Software Admin** is the last line — only touched for *technical* problems, and only via tools (Sentry, logs, deploys), never by hand-fixing user data in production.

This separation is what makes the system **industry-grade**: no single person can break it, every action is logged, and every issue has a clear owner.
