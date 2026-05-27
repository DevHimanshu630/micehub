# MICEHub

India's MICE booking platform — book conference halls, banquet venues, and event spaces. Send RFPs, compare quotes, and confirm bookings with secure payments and automatic GST invoices.

## Repository layout

```
.
├── PLAN.md             — tech stack & architecture
├── ROLES_AND_FLOW.md   — roles + end-to-end booking scenario
├── BUILD_ORDER.md      — 13-step build plan to MVP
├── web/                — Next.js 16 + TypeScript + Tailwind app
└── .github/workflows/  — CI pipeline (typecheck · lint · build)
```

## Quick start

```bash
cd web
pnpm install
pnpm dev          # http://localhost:3000
```

## Useful scripts (run from `web/`)

| Command            | Purpose                          |
| ------------------ | -------------------------------- |
| `pnpm dev`         | Run dev server with Turbopack    |
| `pnpm build`       | Production build                 |
| `pnpm typecheck`   | TypeScript check (no emit)       |
| `pnpm lint`        | ESLint                           |
| `pnpm format`      | Prettier write                   |
| `pnpm format:check`| Prettier check (used in CI)      |

## Current status

**Step 1 of 13** — landing page live. See [BUILD_ORDER.md](BUILD_ORDER.md) for the full roadmap.
