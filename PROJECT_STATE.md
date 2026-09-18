# Project State

Last updated: 2026-09-18

## Current phase

**Óris360° full-platform architecture expansion in progress.**

The seller PWA on main is verified and functional for the original offline-first sales scope, but it is not yet a complete company platform. The current expansion adds the missing System Online / company-admin surface, sellers, product administration, customer portfolios, mission assignment, reporting, SSO and integration management.

## Verified repository baseline

- Default branch: main
- Main product commit: 041da33b4647de44c548d017c3a9bce17eeff006
- Current expansion branch: feature/oris360-full-platform
- PR #3 from the first seller-PWA phase is merged.
- Existing seller PWA CI on main passed dependency audit, tests, production build and PWA/Netlify artifact verification.
- gstack and Superpowers are pinned upstream engines.
- ECC is being added as a third pinned upstream engine at c752aac18616e26bf146f034a86947d8f6fc207e.
- Runtime-native tools/skills still must be checked per session; vendoring source is not runtime execution.

## Existing seller capabilities

- React/TypeScript/Vite mobile-first PWA.
- IndexedDB/Dexie offline persistence.
- Device + user + company data isolation.
- First-activation online gate and later offline login.
- Fixed ten-item seller menu.
- Pedidos with TODOS and NÃO ENVIADOS.
- Offline Quotes/Orders, conversion, repricing, stock policy and duplication.
- Explicit-only document transmission with idempotency and server confirmation.
- Customer creation/editing offline and CPF/CNPJ deduplication.
- Manual transactional commercial sync.
- Last-valid-snapshot preservation.
- Account-blocked offline behavior.
- Mission execution offline and allowed automatic return.
- Operational location channel with browser permission/connectivity constraints.
- Demo backend for single-browser functional validation.
- Netlify configuration and PWA service worker.

## Confirmed gaps in the current product

- No company-admin/System Online CRUD surface.
- No seller/user administration.
- No central product/SKU/price/stock administration UI.
- No customer-to-seller portfolio management.
- No mission creation/assignment UI.
- No shared central backend between real devices/users.
- No real reports/commission data source.
- No real cross-domain SSO.
- No WhatsApp Business webhook/provider integration.
- No real Web Push sender/backend.

These are product gaps, not isolated missing buttons.

## Approved design direction pending user spec review

Use one repository with two product surfaces:

1. App do Vendedor — existing offline-first seller client.
2. Sistema Online / Painel da Empresa — online administrative surface.

They share domain contracts. Demo mode remains for development, while the real central API is connected later through gateway adapters.

Design:
- docs/superpowers/specs/2026-09-18-oris360-full-platform-design.md

Integration requirements:
- docs/INTEGRATIONS.md

## Central integration requirement

Real company ↔ seller synchronization across different devices requires a central API/database. IndexedDB/localStorage on a static Netlify PWA cannot provide shared multi-user state by itself.

## Next concrete task

1. Complete engine validation with ECC pinned.
2. User reviews the full-platform design spec.
3. After approval, create the implementation plan with Superpowers writing-plans.
4. Implement Foundation/RBAC + composed gateway using TDD.
5. Build System Online/admin modules phase by phase.
6. Connect real API when URL, documentation and sandbox are supplied.
7. Perform gstack review/QA/security and deployment verification.

## Relevant files

- AGENTS.md
- docs/SKILL_ROUTER.md
- ENGINE_MANIFEST.md
- docs/superpowers/specs/2026-09-18-oris360-full-platform-design.md
- docs/INTEGRATIONS.md
- src/infrastructure/gatewayFactory.ts
- src/infrastructure/orisGateway.ts
- DECISIONS.md
