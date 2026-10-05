# CLAUDE.md — kaya-rentals

Instructions for AI coding agents working in this repository.

## Project Overview

AI-powered rental property management for Ontario landlords and tenants, built for the CHI Accelerator. Real architecture, currently blocked by an org-wide unpaid Supabase invoice (affects this + two other repos) — not an architecture problem.

## Do Not Reopen

There is no Laravel implementation anywhere in this repository. The stack is React + Supabase + Hono. An earlier assumption to the contrary was investigated and disproven directly against the code — do not re-raise it.

## Product Purpose

Property management with real security engineering behind it: a 29-case security test suite already exists (`npm run test:security`) covering CORS, security headers, auth token validation, brute-force lockout, rate limiting, and regression tests confirming specific past vulnerabilities (a hardcoded demo password, a fake OTP flow) stay removed.

## Repository Structure

- `supabase/functions/make-server-2071350e/` — the real, live edge function (confirmed via `backend.service.ts` and both security test files referencing this exact slug).
- `supabase/functions/server/` — was a byte-identical dead duplicate of the above; removed. If you see a `server/` directory reappear, verify it's not a re-export before assuming it needs to exist.
- `tests/security/` — real, substantive tests. Run these before and after any auth/API change.
- **No SQL migration files exist in `supabase/migrations/`.** This is a real gap, not an oversight to ignore — whatever schema exists live was never captured in version control. If you add tables/columns, write a real migration file; don't just apply changes ad hoc via the dashboard.

## Technology Stack

React, Supabase (Postgres, Auth, Edge Functions/Hono), TypeScript.

## Current Blocker

The Supabase project (`ceucvzbpgzqatazckdpa`) is paused behind an org-level unpaid invoice. Until resolved: no live schema verification, no running the security test suite against real infrastructure, no live demo. This is an account-level issue, not something fixable in code.

## Development Workflow

`feature/* → dev → staging → main`, both protected.

## Security

Once the backend is restored, run `npm run test:security` before trusting any claim about current RLS/auth state — it was not verified live during the last audit precisely because the backend was unreachable.

## AI Agent Rules

- Do not assume Laravel exists or needs reconciling — see "Do Not Reopen" above.
- Any new table needs an actual migration file committed to `supabase/migrations/` — this repo currently has zero, which should not continue.
- Before removing anything that looks like a duplicate directory, diff it against the suspected real version and check actual references (frontend calls, test files) first — the last "duplicate" cleanup here was verified this way, not assumed.

## Definition of Done

New endpoints/tables have a real migration file. Security-relevant changes are covered by `tests/security/`. No claim of "production-ready" without the test suite having actually been run against live infrastructure.
