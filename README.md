# Kaya — AI-Powered Landlord Platform

**A rental property management platform for Ontario landlords: AI-assisted tenant screening, revenue tracking, and application management, built to compete with Buildium, AppFolio, and Yardi.**

[![Status](https://img.shields.io/badge/status-beta%20%2F%20pre--launch-orange)]()
[![License](https://img.shields.io/badge/license-proprietary-red)]()

![Kaya landing page](docs/screenshots/dashboard.png)

## Overview

Kaya gives independent landlords and small property managers the tools larger platforms (Buildium, AppFolio, Yardi) offer, at a price point and simplicity level built for someone managing a handful of properties, not a portfolio.

## Problem

Independent landlords either use spreadsheets and manual processes, or pay for enterprise property-management platforms built for large portfolios they don't need.

## Solution

AI-assisted applicant screening (scoring, approve/review recommendations), per-property revenue and occupancy tracking, and Ontario-specific landlord-tenant workflow support (e.g. generating an N4 eviction notice) built directly into the app, at a scale and price point suited to small landlords.

## Key Capabilities

- Dashboard: revenue trend, occupancy rate, pending applications, per-property status
- AI-powered applicant screening with income-ratio and fit scoring
- Rent status tracking (paid / overdue / vacant) by unit
- "Ask Kaya AI" — in-app assistant for queries like vacancy prediction or generating Ontario-specific notices
- 16 backend API endpoints covering the above

## Architecture

React frontend, Hono backend running on Supabase Edge Functions (Deno), Supabase Postgres + Auth. This has been directly verified — there is no Laravel implementation anywhere in this repository, despite an earlier internal assumption to the contrary. A real, substantive security test suite already exists (29 cases: CORS, security headers, auth token validation, rate limiting, and regression tests confirming specific past vulnerabilities — a hardcoded demo password, a fake OTP flow — stay removed).

**Current blocker:** the Supabase project backing this app is paused behind an organization-level unpaid invoice (shared with two other CREOVA products). This is an account/billing issue, not an architecture or code problem — the codebase itself has not been found to have the issues an earlier internal document suggested.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Recharts, Framer Motion |
| Backend | Hono on Supabase Edge Functions (Deno) |
| Database / Auth | Supabase (Postgres + Auth) |
| Testing | Playwright — real UI + API security tests in `tests/security/` |

## Repository Structure

- `supabase/functions/make-server-2071350e/` — the live edge function backend (confirmed via frontend and test file references)
- `tests/security/` — the real security test suite
- No SQL migration files currently exist in `supabase/migrations/` — a known, real gap; whatever schema exists live was never captured in version control

## Getting Started

### Prerequisites
Node.js 18+, Supabase CLI (for local edge functions)

### Installation

```bash
git clone https://github.com/creova-gif/kaya-rentals.git
cd kaya-rentals
npm install
```

## Configuration

| Variable | Required | Notes |
|---|---|---|
| Supabase project ID / anon key | Yes | Frontend Supabase client — confirmed this is the only key used client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only | Used correctly via `Deno.env.get()` in the edge function — never move to a frontend-accessible file |

## Development

```bash
npm run dev
```

## Testing

```bash
npm run test:security:api
npm run test:security:ui
```

These require the Supabase backend to be reachable — currently blocked (see Architecture above).

## Security

29-case real security test suite exists and covers meaningful ground. Cannot currently be run against live infrastructure due to the Supabase billing block. RLS policy state on live tables is unverified for the same reason.

## Project Status

Beta / pre-launch, real engineering underneath. This repo previously contained ~112 historical audit/status docs with a documented internal contradiction about completion status — that contradiction has been flagged (see the note previously added to `DOCUMENTATION_INDEX.md`). Being built toward a CHI Accelerator demo deadline.

## Roadmap

- [x] Core UI/UX and feature set
- [x] Backend APIs (16 endpoints)
- [x] Real security test suite
- [ ] Resolve Supabase billing block, then verify security tests pass against live infrastructure
- [ ] Capture live schema as a baseline migration (currently zero migrations in git)
- [ ] Rate limiting, PII encryption — status unconfirmed pending backend access

## Contributing

Private, proprietary CREOVA product. External contributions are not accepted at this time.

## License

Proprietary — All Rights Reserved. See `LICENSE`.

## Author / Organization

Built by [Justin Mafie](https://github.com/creova-gif) under CREOVA.

## Documentation

See `CLAUDE.md` for AI-agent-specific notes, including an explicit "do not reopen the Laravel question" instruction.
