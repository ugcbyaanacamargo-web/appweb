# Project State

Last updated: 2026-09-20
Source of truth: AGENTS.md → docs/brain/INDEX.md → this file → DECISIONS.md

## Product and repository

Óris360° is developed **exclusively** in `ugcbyaanacamargo-web/appweb`.

Public site: `https://oris360-site.netlify.app/`.
Functional contract: `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`.
Visual design: `docs/design/AURORA.md`.

**Explicit user correction, 2026-09-20:** Saboriza is NOT the Óris360° Sistema Online or backend. Do not create/modify panels there, redirect users to it, request its credentials or depend on its Supabase. Older Saboriza architecture artifacts are archival only and must not direct future implementation.

Canonical internal-panels design: `docs/superpowers/specs/2026-09-20-internal-oris360-panels-design.md`.
Phase-one plan: `docs/superpowers/plans/2026-09-20-internal-panels-first-slice.md`.

## Product surfaces and business rules

1. `/`: existing mobile sales PWA, fixed ten-menu structure, offline-first, user/company/device/realm isolation, manual commercial sync, **explicit-only** Quote/Order sends, local-only document history.
2. `/vendedor`: separate online web panel for the authenticated seller, same site/identity and current company.
3. `/empresa`: separate company-admin web panel for owners/admins, same site/identity and current company.

New web panels are NOT extra entries in the fixed mobile menu. The existing `Sistema Online` action routes within Óris360°, according to the user's role. Sales documents do not enter mobile history from the online area.

## Current development checkpoint

Branch: `feature/oris360-internal-panels`.

Implemented in the branch:
- company roles in `CompanyRef`, DEMO owner identity and role-aware company administration;
- company DEMO manual product CRUD (name, SKU, price, stock, description, active, image), browser-local persistence, input validation and company isolation;
- vendor DEMO web report and read-only seller-scoped sent documents;
- photo field in product model, product photos displayed after local commercial sync;
- internal `/empresa` and `/vendedor` routing, back to the existing mobile App and history handling;
- Saboriza external login removed from the App's Sistema Online screen;
- Playwright browser tests, DEMO gateway unit tests, production smoke release marker for company panel.

These are **DEMO capabilities**, NOT a shared production backend. The DEMO data remain within the same browser. Do not claim synchronization across physical devices, real server-side RBAC or cloud image storage.

Latest verified branch HEAD before further changes: `20269fbdb604e726a64d91894958c16d34b4b340`:
- engine integrity `35545616413`: success;
- app-ci `35545616410`: success;
- browser E2E `35545616390`: success.
Any further changes require fresh per-SHA verification. No production/Netlify publication may be claimed until merge and production smoke confirm the new panel marker.

## Work that still MUST be implemented in appweb

- real first-party Óris360° backend in this repository (Netlify Functions or another explicitly authorized service) with persistent shared database and authenticated image storage;
- registration/7-day-trial, real Auth and company memberships, server-enforced owner/admin/seller RBAC and lifecycle;
- full products/catalog/categories/media/unit and pack price/stock contracts;
- company-admin clients, seller enrollment, seller portfolios, commissions and assignments;
- first commercial snapshot per scope with image caching and transactional offline base;
- idempotent Quote/Order APIs, official sequence, actual stock adjustment and authorized central views;
- Missions assignment/admin, push sender, location/map, seller reports;
- online session handoff, centrally configured Help and WhatsApp/AI integration;
- true security, multi-company and multi-device integration/E2E coverage.

No secret/service-role keys in frontend or GitHub. Do not replace genuine server persistence with DEMO localStorage and call it real multi-device functionality.

## Verify/release

- `.github/workflows/app-ci.yml` — audit/lint/Vitest/build/PWA;
- `.github/workflows/e2e.yml` — browser user flows;
- `.github/workflows/engine-integrity.yml` — project graph and skills;
- `.github/workflows/production-smoke.yml` — deployed release marker and Aurora CSS.

Historical reference: earlier Saboriza PRs and archived docs explain why the prior design was superseded; they are NOT active integration instructions.
