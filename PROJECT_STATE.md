# Project State

Last updated: 2026-09-20

## Current phase

**First approved Óris360° ↔ Saboriza delivery merged and verified on the public Netlify site. The actual Saboriza/Supabase data integration is NOT active.**

The canonical functional source remains:

- `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`

The current integration design is:

- `docs/superpowers/specs/2026-09-19-oris360-complete-platform-design.md`

The Saboriza gap matrix is:

- `docs/SABORIZA_ADAPTATION_MATRIX.md`

## Production and App baseline

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

## Delivered integration milestones

- PR #9 merged: official Saboriza admin login link, honest SSO availability, strict product mapping, approved spec/plan/integration matrix.
- PR #10 merged: production smoke now checks the new Saboriza button instead of an old generic marker.
- `main` now includes commits `1888e88c43ccf5368de9aee38c54087592d05de2` and `09f065abae8d289901a37d42b78f36072d0fd223`.
- Verified production bundle after release: `/assets/index-CXhatpMT.js`, containing `ACESSAR PAINEL SABORIZA`.
- Saboriza source remains read-only; no database migration or API secrets have been applied.

## Design and first implementation phase

The user approved the written integration spec on 2026-09-20. The first-delivery plan is `docs/superpowers/plans/2026-09-20-saboriza-first-integration.md`.

Implemented and test-driven; released to the public App:
- explicit external link to official Saboriza admin login without claiming shared DEMO authentication;
- SSO launch now requires `available: true` and a safe URL;
- strict Saboriza product mapper requiring verified stock/SKU and rejecting unsupported pack conversions;
- browser E2E regression and Vitest mapper tests.

Verified on merged `main` SHA `09f065abae8d289901a37d42b78f36072d0fd223`:
- Engine integrity run `35529210819`: success;
- app-ci run `35529210769`: dependency audit, lint, Vitest, production build and PWA/Netlify artifacts successful;
- Playwright run `35529210775`: success;
- production-smoke run `35529210749`: success against the exact Saboriza UI marker and deployed bundle.

These checks validate the first shipped slice, **not** real company ↔ seller data synchronization.

Not implemented: actual Supabase Auth integration, backend snapshot/RPC, client sync against Saboriza, cross-device sales, one-time SSO and WhatsApp webhook. Do not describe these as completed.

## Implementation direction after approval

Preserve Prompt Mestre phases:

1. Foundation — Saboriza gateway/auth/membership/first snapshot.
2. Commercial operation — customer/product/catalog/price/stock mapping.
3. Transmission — client upsert, quote/order, idempotency, official number.
4. Sync — pending clients, transactional snapshot, blocked-account behavior.
5. Integrations — Missions, push, location, reports/commission, SSO, Help, WhatsApp/AI.

## Óris360° Aurora visual refresh — 2026-09-20

The user requested a modern/futuristic interactive overhaul of the existing App, without changing the closed master business rules.

Released through PR #12, merged to `main` as `820110a423e8503c7f46c994d10bc70c824fe066` and verified on Netlify.

Visual-only implementation:
- atmospheric midnight/aurora shell and auth entry;
- refined light commercial cards, hierarchy, buttons, active drawer, toasts and floating action;
- responsive spacing and visible keyboard focus;
- hover/touch microinteractions and page entrance animations;
- explicit reduced-motion override.

No business-domain, Dexie, gateway or remote-integration behavior was changed.

Evidence from feature HEAD `326ab8fc0a6b887d339f231e7727a7da9c9affd7`:
- app-ci `35540800891`: success (audit/lint/Vitest/build/PWA);
- Playwright `35540800900`: success (including new mobile visual/reduced-motion acceptance);
- Engine integrity `35540800889`: success.
After merge to `main` commit `820110a423e8503c7f46c994d10bc70c824fe066`, all four gates passed:
- engine `35541162285`;
- app-ci `35541162289`;
- Playwright `35541162262`;
- production smoke `35541162284`.

Production smoke inspected deployed JavaScript `/assets/index-DYa2MGNb.js` and the redesigned stylesheet `/assets/index-DbhvZFZ1.css`, confirming `ACESSAR PAINEL SABORIZA` and CSS marker `--iris-night`. This is release-specific evidence, not merely a generic PWA marker.

`docs/design/AURORA.md` is the permanent visual reference.
Production smoke now must inspect the CSS marker `--iris-night` and the existing Saboriza JS marker to prevent an old Netlify deploy from passing.

Real Saboriza/Supabase data integration remains pending; visual change does not pretend to resolve it.

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


## Aurora follow-up — live local overview (2026-09-20)

The user's request for a futuristic interactive redesign was already shipped by another concurrent branch while `feature/oris360-futuristic-mobile-design` was being developed. The conflicting design PR #13 was closed without merge to avoid replacing the latest Aurora CSS.

This additive follow-up is isolated on `feature/aurora-order-overview` based on Aurora main commit `820110a423e8503c7f46c994d10bc70c824fe066`.

Scope:
- real local document/unsent/sent totals on the Pedidos page, no backend traffic and no third tab;
- accessible `aria-current=page` for selected navigation item;
- a small Aurora-matched CSS component only, retaining the existing Aurora visual system;
- mobile E2E for overview/count update and current menu item;
- production smoke requires both Aurora CSS token `--iris-night` and unique overview JS text `SEU DIA EM MOVIMENTO`.

Do not merge the superseded broad CSS branch. This follow-up has no changes to pricing, stock, manual sync, Saboriza integration, local history or offline behavior.

Verify latest GitHub Actions and public Netlify before recording release evidence.


## Full product and panel gap audit — 2026-09-20

The user clarified that product completion requires a **separate seller web panel**, all company ↔ seller workflows, and end-to-end functionality beyond the existing mobile UI. Complete code-grounded read-only gap audit:

- `docs/product/2026-09-20-complete-platform-gap-audit.md`.

Important correction to prior broad statements: the inspected Saboriza source already contains a manual product form and ONE product image uploader using Supabase Storage (`product-images`). These features must be reused, not duplicated inside appweb. However, the appweb Product model/catalog has no image field or offline image cache, Saboriza has no seller-specific web route discovered, and the cross-system API is not live.

Product surfaces:
- appweb = fixed ten-menu offline-first seller mobile PWA;
- Saboriza /admin = existing company/admin control panel, needs Óris-specific seller/team controls;
- Saboriza seller-only web area = NOT IMPLEMENTED in inspected source; separate authorization/routes needed, not another mobile menu item.

The audit is based on repository code and earlier CI evidence; interactive public-site navigation and live Supabase RLS/API access could not be executed in this runtime. Do not claim the missing real backend/seller panel works.

Next architectural cycle: decompose foundation/roles, commercial product/media+catalog/snapshot, document transmission, dedicated seller web panel, Missions/team and subscription/integrations into independently testable specifications and plans. Follow Superpowers design-review gate; the earlier Saboriza integration spec cannot by itself prove a written implementation plan for these newly recognized subsystems.
