# Kaya — AI-Powered Landlord Platform

**A rental property management platform for Ontario landlords: AI-assisted tenant screening, revenue tracking, and application management, built to compete with Buildium, AppFolio, and Yardi.**

[![Status](https://img.shields.io/badge/status-beta%20%2F%20pre--launch-orange)]()
[![License](https://img.shields.io/badge/license-proprietary-red)]()

> ⚠️ **A note on status before anything else:** this repo currently contains two internal docs with conflicting status claims — `DOCUMENTATION_INDEX.md` says "100% COMPLETE & PRODUCTION-READY," while `EXECUTIVE_SUMMARY.md` (dated 3 days later) lists unresolved critical security gaps and calls the platform "Beta / Pre-Launch." This README uses the more conservative status until that's reconciled — **recommend resolving which is actually true before this goes in front of anyone external.**

---

## What this is

Kaya gives independent landlords and small property managers the tools that larger platforms (Buildium, AppFolio, Yardi) offer, at a price point and simplicity level built for someone managing a handful of properties, not a portfolio. AI does the tenant-screening legwork — scoring applicants and flagging which ones are ready to approve — instead of the landlord doing that manually.

---

## Core Features

Based on what's actually implemented in the dashboard and API layer:

- **Dashboard** — revenue trend, occupancy rate, pending applications, and per-property status at a glance
- **AI-powered applicant screening** — each application gets a score (e.g., income ratio, overall fit) with an approve/review recommendation, so the landlord isn't reading every application cold
- **Property management** — per-property occupancy, revenue, and risk status (healthy / needs attention)
- **Rent status tracking** — paid on time / overdue / vacant, broken out by unit
- **"Ask Kaya AI"** — an in-app assistant for questions like *"predict vacancy for next month"* or *"generate an N4 for Unit 3A"* (Ontario eviction notice — this implies real Ontario-specific landlord-tenant workflow knowledge baked in, worth highlighting as a differentiator)
- **16 backend API endpoints** (per `EXECUTIVE_SUMMARY.md`) covering the above

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Recharts (charts), Framer Motion (animation) |
| Backend | Hono |
| Database / Auth | Supabase (Postgres + Auth + Edge Functions) |
| Edge functions | Deno (Supabase Functions) |
| Testing | Playwright (UI + API security tests already exist — `tests/security/`) |

*(Correcting earlier assumption: this is React + Supabase + Hono, not Laravel — worth updating anywhere else that stack was referenced.)*

---

## Getting Started (Local Dev)

### Prerequisites
- Node.js 18+
- Supabase CLI (for local edge functions)

### Installation

```bash
git clone https://github.com/creova-gif/kaya-rentals.git
cd kaya-rentals
npm install
```

### Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_PROJECT_ID` / equivalent | Yes | Supabase project |
| Public anon key | Yes | Frontend Supabase client — confirmed this is the *only* key used client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only | Used correctly in `supabase/functions/server/` via `Deno.env.get()` — **do not** move this to any frontend-accessible file |

### Running locally

```bash
npm run dev
```

### Running the existing security tests

```bash
npm run test:security:api
npm run test:security:ui
```

---

## Documentation

This repo already contains **30+ internal markdown docs** (audit reports, implementation summaries, workflow maps) written during development. Rather than duplicate them, here's the real map:

- **Start here:** `DOCUMENTATION_INDEX.md` — but verify its "100% complete" framing against `EXECUTIVE_SUMMARY.md` first
- **Business case / competitive positioning:** `MARKET_DIFFERENTIATORS.md`
- **Architecture:** `COMPLETE_ARCHITECTURE_SUMMARY.md`
- **Current gaps / pre-launch checklist:** `EXECUTIVE_SUMMARY.md`, `KAYA_PRE_LAUNCH_AUDIT.md`

**Recommendation:** once status is reconciled, move the historical/audit-report docs (`*_COMPLETE.md`, `*_SUMMARY.md` that describe past work rather than current state) into a `/docs/archive` folder, and keep only the current, living docs at root. Thirty status reports at the root level makes it hard for anyone — including future you — to tell what's current.

---

## Roadmap / Status

Per the most recent internal audit (`EXECUTIVE_SUMMARY.md`):
- [x] UI/UX — complete
- [x] Core feature set (6 core + 3 new features)
- [x] Backend APIs (16 endpoints functional)
- [x] Security: service role key exposure — **verified resolved** as of this audit (checked current code + full commit history, clean)
- [ ] Rate limiting on APIs — listed as a Week 1 item; confirm current status
- [ ] Data encryption for PII — listed as a gap; confirm current status
- [ ] Working authentication system — listed as a gap in the audit; confirm current status since the frontend Supabase client code looks structurally correct

---

## Contributing

This is a private, proprietary CREOVA product. External contributions are not accepted at this time.

## License

Proprietary — All Rights Reserved. See `LICENSE`.

## Credits

Built by CREOVA. Product lead: Justin Mafie.
