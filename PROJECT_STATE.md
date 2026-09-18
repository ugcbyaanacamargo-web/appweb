# Project State

Last updated: 2026-09-18

## Current phase

**Óris360° Sales PWA implemented against the explicit DEMO gateway; repository brain and stronger CI/E2E gates are being added on `feature/repository-brain-ci-e2e`.**

The offline domain, mobile interface, PWA build and Netlify configuration exist. The real Óris360° API remains an external integration dependency behind `OrisGateway`. Production hosting has not yet been verified.

## Verified repository baseline before this branch

- Default branch: `main`.
- Baseline commit: `aad913e18cae7b727ffb705c589af4c5adf6c8db`.
- Eleven pinned upstream repositories are registered as Git submodules, including gstack, Superpowers and ECC.
- Existing app CI checks runtime dependency audit, Vitest, build and PWA/Netlify artifacts.
- Existing engine-integrity workflow validates pinned engine structure.
- Runtime-specific tools and permissions must be re-checked in every future session.

## Branch work in progress

This branch adds:
- canonical in-repository copy of the Prompt Mestre;
- `docs/brain/INDEX.md` + linked graph;
- route/node/skill navigation;
- repository Definition of Done;
- ESLint gate;
- Playwright Chromium E2E for core user journeys;
- stronger `validate_engine.py` checks.

These branch changes are not considered verified until their GitHub Actions runs succeed.

## Product capabilities implemented against DEMO

- React/TypeScript/Vite mobile-first PWA.
- IndexedDB/Dexie offline persistence.
- Device + user + company data isolation.
- First-activation online gate and later offline login.
- Fixed ten-item global menu.
- Offline Quotes/Orders, explicit transmission, idempotency and sent-document lock.
- Customer creation/editing offline and CPF/CNPJ deduplication.
- Manual transactional commercial sync.
- Mission execution offline and allowed automatic return.
- Online gates for Reports and Sistema Online.
- PWA/service worker and Netlify configuration.

## External dependencies still pending

The real Óris360° API/SSO/official integration endpoints have not been provided.

Required contracts remain documented in:
- `docs/API_INTEGRATION.md`

No real endpoint or credential may be invented.

## Deployment status

Netlify configuration exists, but a production `*.netlify.app` deployment has not been verified from this runtime.

## Next concrete task

1. Push and open PR for `feature/repository-brain-ci-e2e`.
2. Inspect app-ci, e2e and engine-integrity for the PR head SHA.
3. Fix any failing gate.
4. Re-review against the Prompt Mestre and branch plan.
5. Merge only after required checks are green.
6. Verify production hosting separately when Netlify access is available.

## Relevant entry points

- `AGENTS.md`
- `docs/brain/INDEX.md`
- `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`
- `docs/SKILL_ROUTER.md`
- `docs/ACCEPTANCE_MATRIX.md`
- `docs/API_INTEGRATION.md`
- `src/infrastructure/orisGateway.ts`
- `src/infrastructure/gatewayFactory.ts`
