# Project State

Last updated: 2026-09-18

## Current phase

**Óris360° Sales PWA implemented / ready for production hosting connection.**

The application structure, offline domain, demo backend, mobile interface, PWA build and Netlify configuration are implemented. The real Óris360° API is intentionally deferred and plugs into the existing `OrisGateway` abstraction.

## Verified repository baseline

- Default branch target: `main`
- Product branch: `feature/oris360-sales-pwa`
- Product PR: #3
- Ten pinned upstream repositories remain registered as Git submodules.
- Engine-integrity workflow remains active.
- App CI validates runtime dependency audit, tests, production build and PWA/Netlify artifacts.
- Runtime-specific tools and permissions must still be re-checked at the start of future sessions.

## Completed product capabilities

- React/TypeScript/Vite mobile-first PWA.
- IndexedDB/Dexie offline persistence.
- Device + user + company data isolation.
- First-activation online gate and later offline login.
- Fixed ten-item global menu.
- Pedidos with TODOS and NÃO ENVIADOS.
- Offline Quotes/Orders, conversion, repricing, stock policy and duplication.
- Explicit-only document transmission with idempotency and server confirmation.
- Customer creation/editing offline and CPF/CNPJ deduplication.
- Manual transactional commercial sync.
- Last-valid-snapshot preservation.
- Account-blocked offline behavior.
- Mission execution offline and allowed automatic return.
- Operational location channel with browser permission/connectivity constraints.
- Reports/System Online online gates.
- Help configuration contract.
- IA no WhatsApp integration placeholder.
- Demo backend for complete functional validation without the real API.
- `OrisGateway` contract and `gatewayFactory.ts` integration seam.
- Acceptance matrix covering the 24 requested criteria.
- Netlify configuration, CSP/security headers, SPA fallback and PWA service worker.
- Persistent offline authentication encrypted with PBKDF2 + AES-GCM.

## External integration intentionally pending

The user will connect the real Óris360° API later.

Required contracts are documented in:

- `docs/API_INTEGRATION.md`

This is not treated as a blocker for the completed App structure.

## Deployment status

Code/build configuration is ready for Netlify.

Actual Netlify site creation still requires authorization in the user's Netlify account. This ChatGPT runtime currently has no Netlify connector/account session, so no production URL has been created yet.

## Next concrete task

1. Merge PR #3 after final CI evidence.
2. Import `ugcbyaanacamargo-web/appweb` into Netlify.
3. Confirm the generated `*.netlify.app` URL.
4. Smoke-test the hosted PWA.
5. Later replace `DemoOrisGateway` with the real API adapter.

## Relevant files

- `src/infrastructure/gatewayFactory.ts`
- `src/infrastructure/orisGateway.ts`
- `docs/API_INTEGRATION.md`
- `docs/ACCEPTANCE_MATRIX.md`
- `netlify.toml`
- `AGENTS.md`
- `docs/SKILL_ROUTER.md`
- `DECISIONS.md`
