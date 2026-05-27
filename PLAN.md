# MICE Portal — Technology & Architecture Plan

**Project:** Property booking portal for the MICE industry (Meetings, Incentives, Conferences, Exhibitions).
**Goal:** Industry-grade software with a very low surface area for errors — type-safe, testable, observable, and scalable.
**Date:** 2026-05-27

---

## 1. What "MICE Portal" Means Here

A B2B + B2C property booking platform tailored for MICE events. It is *not* a generic hotel booking site — it must handle:

- **Venue inventory** — banquet halls, conference rooms, exhibition spaces, hotel room blocks, outdoor lawns.
- **Complex RFPs (Request for Proposal)** — a planner sends one RFP to many venues, each responds with a quote.
- **Multi-day, multi-room bookings** — a 3-day conference may need 1 main hall + 4 breakout rooms + 200 hotel rooms + F&B.
- **Catering, A/V, decor add-ons** — bundled into a single quote.
- **Role-based access** — Planner, Property Owner, Property Staff, Sales Manager, Finance, Admin.
- **Calendar / availability** — must be real-time and conflict-free.
- **Contracts, payments, GST invoicing, refunds** — money is involved, so accuracy is non-negotiable.

---

## 2. Core Engineering Principles (to minimise errors)

1. **Type safety end-to-end** — one schema source of truth from DB → API → UI.
2. **Strict validation at every boundary** — never trust input; never trust the DB to enforce business rules alone.
3. **Transactional booking writes** — availability + booking + payment intent must commit atomically.
4. **Idempotent APIs** — every write endpoint takes an idempotency key (critical for payments).
5. **Audit log for every state change** — who did what, when, why.
6. **Automated testing pyramid** — unit, integration (real DB), and end-to-end (Playwright).
7. **CI gates** — typecheck, lint, tests, and migration dry-run must pass before merge.
8. **Feature flags** — ship dark, ramp gradually.
9. **Observability from day one** — structured logs, traces, error tracking.

---

## 3. Recommended Technology Stack

### 3.1 Language & Runtime
| Layer | Choice | Why |
|---|---|---|
| Primary language | **TypeScript** (strict mode) | One language across frontend & backend reduces context-switching bugs; mature ecosystem; first-class types catch entire classes of errors at compile time. |
| Runtime | **Node.js 20 LTS** | Stable, well-supported, huge ecosystem. |

> Alternative considered: **Go** for backend. Faster and simpler concurrency, but loses the shared-types advantage with a TS frontend. Pick Go only if the team has strong Go experience.

### 3.2 Frontend
| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR/SSG for SEO on venue listing pages, server components reduce client JS, mature, hireable. |
| UI library | **shadcn/ui + Tailwind CSS** | Copy-paste components you own, accessible by default, easy to brand. |
| Forms | **React Hook Form + Zod** | Zod schema is shared with backend → impossible-to-drift validation. |
| Data fetching | **TanStack Query** (for client) + Server Components (for server) | Cache, retry, stale-while-revalidate out of the box. |
| State | **Zustand** for any cross-page client state | Tiny, no boilerplate. Avoid Redux unless the app actually needs it. |
| Calendar UI | **FullCalendar** or **react-big-calendar** | Battle-tested for availability views. |
| Charts (admin dashboard) | **Recharts** | Simple and composable. |

### 3.3 Backend / API
| Concern | Choice | Why |
|---|---|---|
| API style | **tRPC** (internal) + **REST/OpenAPI** (for partners) | tRPC gives end-to-end type safety with zero codegen for the web app; REST/OpenAPI is the lingua franca for third-party integrations. |
| Framework | **Next.js Route Handlers** + **Fastify** for heavier APIs if split later | Start as a Next.js monolith, split into a Fastify service only when load demands. |
| Validation | **Zod** | Same schema on FE and BE. |
| Background jobs | **BullMQ** (Redis-backed) | Send emails, generate PDFs, sync calendars, send reminders, settle payments. |
| Scheduling | **BullMQ repeat jobs** or **node-cron** | Daily report rollups, expiry of held inventory. |

### 3.4 Database & Persistence
| Concern | Choice | Why |
|---|---|---|
| Primary DB | **PostgreSQL 16** | ACID, rich types (JSONB, ranges, exclusion constraints), excellent for booking systems. |
| ORM / query builder | **Drizzle ORM** | Type-safe SQL, lightweight, no hidden N+1 magic. (Prisma is the alternative — easier DX, but heavier and historically weaker on raw SQL escape hatches.) |
| Migrations | **Drizzle Kit** | Version-controlled, reviewable migrations. |
| Cache + queues | **Redis 7** | Session, rate limiting, BullMQ. |
| Object storage | **AWS S3** (or Cloudflare R2) | Property photos, brochures, contract PDFs. |
| Search | **PostgreSQL full-text** initially → **Meilisearch** when search becomes a UX bottleneck | Don't reach for Elasticsearch until you need it. |

> **Postgres killer feature for this domain:** use `tstzrange` columns + `EXCLUDE USING gist (room_id WITH =, period WITH &&)` constraints to make double-booking *physically impossible* at the DB level. This single pattern eliminates an entire bug class.

### 3.5 Auth
| Concern | Choice | Why |
|---|---|---|
| Auth library | **Auth.js (NextAuth v5)** or **Clerk** | Auth.js if you want full control & self-hosted; Clerk if you want it done in a day with MFA, orgs, SSO out of the box. |
| Authorization | **Casbin** or hand-rolled RBAC + row-level Postgres policies | RBAC for app-level roles; RLS as defense-in-depth. |

### 3.6 Payments
| Concern | Choice | Why |
|---|---|---|
| Gateway (India) | **Razorpay** (primary) + **Stripe** (for international cards) | Razorpay handles UPI, netbanking, GST invoicing well; Stripe for cross-border. |
| Invoicing | **Server-side PDF via `@react-pdf/renderer`** | Versioned templates, deterministic output. |

### 3.7 Communications
| Concern | Choice |
|---|---|
| Transactional email | **Resend** or **AWS SES** |
| SMS / WhatsApp | **MSG91** or **Gupshup** (India-focused) |
| Push (web) | **Web Push API via VAPID** |

### 3.8 DevOps / Infrastructure
| Concern | Choice | Why |
|---|---|---|
| Hosting (app) | **Vercel** (initial) → **AWS ECS Fargate / Fly.io** (scale) | Vercel is the fastest path for Next.js; migrate when costs or limits force it. |
| DB hosting | **Neon** or **Supabase** or **AWS RDS** | Neon's branching is a superpower for migration testing. |
| Redis hosting | **Upstash** | Serverless-friendly. |
| CI/CD | **GitHub Actions** | Standard, free for private repos at small scale. |
| IaC | **Terraform** (when infra grows beyond Vercel) | Reviewable infra changes. |
| Secrets | **Doppler** or **AWS Secrets Manager** | Never `.env` in git. |

### 3.9 Observability & Quality
| Concern | Choice |
|---|---|
| Error tracking | **Sentry** |
| Logs | **Axiom** or **Datadog** (structured JSON only) |
| Tracing | **OpenTelemetry → Sentry/Datadog** |
| Uptime | **Better Stack** or **Checkly** |
| Analytics | **PostHog** (product analytics + feature flags + session replay in one) |

### 3.10 Testing
| Layer | Tool |
|---|---|
| Unit | **Vitest** |
| Component | **React Testing Library** |
| Integration (DB) | **Vitest + Testcontainers (real Postgres)** |
| End-to-end | **Playwright** |
| Load | **k6** |
| Contract (for partner APIs) | **Pact** |

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Next.js Client) + Mobile (later, React Native)│
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / tRPC
┌───────────────────────▼─────────────────────────────────┐
│            Next.js App (Vercel / ECS)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Web (RSC+CSR)│  │ tRPC Router  │  │ REST/OpenAPI │  │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘  │
│                           │                  │          │
│                  ┌────────▼──────────────────▼───────┐ │
│                  │  Domain services (TypeScript)     │ │
│                  │  - Availability                   │ │
│                  │  - Booking                        │ │
│                  │  - Quoting                        │ │
│                  │  - Payment                        │ │
│                  │  - Contracts                      │ │
│                  └──────┬───────────────┬────────────┘ │
└─────────────────────────┼───────────────┼──────────────┘
                          │               │
              ┌───────────▼──┐    ┌───────▼─────────┐
              │ PostgreSQL   │    │  Redis (BullMQ) │
              │ (Neon/RDS)   │    │  Jobs + Cache   │
              └──────────────┘    └────────┬────────┘
                                           │
                                  ┌────────▼─────────┐
                                  │ Worker Service   │
                                  │ - Email/SMS      │
                                  │ - PDF gen        │
                                  │ - Calendar sync  │
                                  │ - Webhooks       │
                                  └──────────────────┘

External: Razorpay, Stripe, S3, Resend, MSG91, Sentry, PostHog
```

---

## 5. Domain Model (first cut)

- **Organization** (planner company or property group)
- **User** (belongs to Organization, has Roles)
- **Property** (a venue: hotel, convention centre, banquet)
- **Space** (room/hall/lawn within a Property; has capacity, layout options)
- **Inventory Calendar** (per-Space, day-level + time-slot)
- **Hold** (short-lived soft lock, e.g. 15 min while planner checks out)
- **RFP** → many **Proposals** (one per Property)
- **Booking** (confirmed) — has many **BookingLineItems** (Space, F&B, A/V)
- **Contract** (PDF, signed via DocuSign / Digio)
- **Payment** → **Invoice** → **Refund**
- **AuditLog** (append-only)

---

## 6. Phased Delivery Plan

### Phase 0 — Foundations (Week 1–2)
- Repo + monorepo tooling (**pnpm workspaces** + **Turborepo**)
- CI pipeline (lint, typecheck, test, build) — *gate merges from day one*
- Auth, base layout, design system
- Postgres schema + first migrations
- Sentry + structured logging wired

### Phase 1 — MVP Inventory & Discovery (Week 3–6)
- Property/Space admin CRUD
- Public search & listing pages
- Property profile pages with photos
- Availability calendar view (read-only)

### Phase 2 — RFP & Quoting (Week 7–9)
- Planner sends RFP
- Property receives RFP in dashboard, responds with proposal
- Quote comparison view for planner

### Phase 3 — Booking & Payments (Week 10–13)
- Hold → confirm flow with DB-level exclusion constraint
- Razorpay integration (idempotent, webhook-driven)
- Auto-generated invoices (PDF)
- Email + SMS notifications

### Phase 4 — Contracts, Refunds, Reporting (Week 14–16)
- e-Sign integration (DocuSign or Digio)
- Refund flow with finance approval
- Property dashboard analytics
- Admin reports

### Phase 5 — Hardening & Launch (Week 17–18)
- Load test with k6
- Security review (OWASP top 10)
- Pen test (third-party)
- Soft launch to pilot properties

---

## 7. Compliance & Legal (India-focused)

- **GST** — invoice format, HSN/SAC codes, GSTIN capture and validation.
- **DPDP Act 2023** — consent capture, data export/delete flows.
- **PCI-DSS** — never store card data; rely on Razorpay/Stripe tokenization.
- **Contract law** — versioned T&Cs; capture acceptance with timestamp + IP.

---

## 8. Decisions Still Open (to discuss before Phase 0)

1. **Auth.js vs Clerk** — depends on budget and whether SSO/MFA is needed at launch.
2. **Monorepo vs polyrepo** — recommend monorepo (Turborepo) initially.
3. **Region** — primary AWS region (ap-south-1 Mumbai?) for latency + data residency.
4. **Mobile** — web-only at launch, React Native later? Or PWA-only?
5. **i18n** — English only at launch, or Hindi + regional at v1?
6. **Pilot properties** — how many, which cities? Drives capacity assumptions.

---

## 9. TL;DR Stack

> **Next.js 15 + TypeScript + tRPC + Zod + Drizzle + PostgreSQL + Redis/BullMQ + Tailwind/shadcn + Auth.js + Razorpay + Sentry + PostHog + Playwright + Vercel → AWS.**

This stack is boring on purpose. Every piece is widely used, well-documented, and hireable. Boring is what keeps error rates low.
