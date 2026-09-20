# Project State

Last updated: 2026-09-19

## Current phase

**Saboriza integration design approved; first independently testable delivery implemented on feature/oris360-complete-platform. Full production Saboriza/Supabase integration is NOT active.**

The canonical functional source remains:

- `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`

The current integration design is:

- `docs/superpowers/specs/2026-09-19-oris360-complete-platform-design.md`

The Saboriza gap matrix is:

- `docs/SABORIZA_ADAPTATION_MATRIX.md`

## Verified production baseline before this design branch

Production App:
- `https://oris360-site.netlify.app/`

Known verified seller-app baseline:
- offline-first PWA;
- fixed ten-item menu;
- device/user/company/integration-realm isolation;
- local Quotes/Orders;
- explicit send;
- idempotency contract;
- sent-document lock;
- manual transactional commercial sync;
- offline customers;
- Missions client;
- Reports / Sistema Online / WhatsApp behind gateway;
- generic HTTP integration setup;
- CI + Playwright infrastructure.

The existing 24 Prompt Mestre acceptance criteria remain mapped in:
- `docs/ACCEPTANCE_MATRIX.md`

## Real System Online target

The user identified:

- `https://saboriza-catalogo.vercel.app/`

Read-only inspection confirmed a matching public repository:
- `Ruanzinn01/Saboriza-Catalogo`

The inspected source declares the same Vercel production URL.

## Saboriza capabilities already available

The public source currently contains:

- Supabase Auth for admin;
- admin panel;
- products;
- categories;
- customers;
- suppliers;
- orders;
- order items;
- coupons;
- indicators;
- settings;
- public catalog/Delivery;
- checkout;
- RPCs `create_order` and `update_order_items`.

## Architectural decision

Óris360° remains the **seller/mobile/offline client**.

Saboriza remains the **Sistema Online/company-admin system**.

Do not build a second product/customer/order admin inside appweb.

The production integration should evolve from the generic HTTP setup to a dedicated Saboriza/Supabase adapter behind `OrisGateway`.

## Confirmed Saboriza gaps relative to the Prompt Mestre

Not proven in the public schema/source:

- multi-company memberships;
- seller profiles;
- seller commission;
- customer portfolio by seller;
- CPF + CNPJ central model;
- official calculated stock source exposed to the App;
- allow-sale-without-stock setting;
- central Quote representation;
- server idempotency for Óris360° documents;
- transactional commercial snapshot;
- account/trial/block state;
- Missions/assignments/evidence;
- Push subscriptions/server sender;
- team location/map;
- seller-scoped report;
- one-time SSO handoff;
- central Óris360° Help contacts;
- WhatsApp/AI integration state contract.

These are backend/integration gaps. They must not be hidden by frontend mocks.

## Current implementation branch

- branch: `feature/oris360-complete-platform`
- purpose: Saboriza integration design plus first real App delivery; remaining production API work is blocked by external capabilities.

## Design and first implementation phase

The user approved the written integration spec on 2026-09-20. The first-delivery plan is `docs/superpowers/plans/2026-09-20-saboriza-first-integration.md`.

Implemented and test-driven on the feature branch:
- explicit external link to official Saboriza admin login without claiming shared DEMO authentication;
- SSO launch now requires `available: true` and a safe URL;
- strict Saboriza product mapper requiring verified stock/SKU and rejecting unsupported pack conversions;
- browser E2E regression and Vitest mapper tests.

Verified on implementation SHA `f52276b9a25e7f3901586a7e168dbcad6e0a149b`: app-ci success, e2e success, Engine integrity success. Subsequent documentation HEAD still requires its own fresh CI checks.

Not implemented: actual Supabase Auth integration, backend snapshot/RPC, client sync against Saboriza, cross-device sales, one-time SSO and WhatsApp webhook. Do not describe these as completed.

## Implementation direction after approval

Preserve Prompt Mestre phases:

1. Foundation — Saboriza gateway/auth/membership/first snapshot.
2. Commercial operation — customer/product/catalog/price/stock mapping.
3. Transmission — client upsert, quote/order, idempotency, official number.
4. Sync — pending clients, transactional snapshot, blocked-account behavior.
5. Integrations — Missions, push, location, reports/commission, SSO, Help, WhatsApp/AI.

## External inputs required before real production integration

- Saboriza Supabase project URL;
- Supabase publishable key;
- authorized access for migrations/RLS/RPC/Edge Functions;
- safe test environment or explicit production-change procedure;
- official Help contacts;
- official commission eligibility rule;
- server-side VAPID/WhatsApp/AI secrets only when those phases are implemented.

Never put secret/service-role keys in frontend or chat.

## Relevant entry points

- `AGENTS.md`
- `docs/brain/INDEX.md`
- `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`
- `docs/superpowers/specs/2026-09-19-oris360-complete-platform-design.md`
- `docs/SABORIZA_ADAPTATION_MATRIX.md`
- `docs/API_INTEGRATION.md`
- `docs/ACCEPTANCE_MATRIX.md`
- `src/infrastructure/orisGateway.ts`
- `src/infrastructure/gatewayFactory.ts`
