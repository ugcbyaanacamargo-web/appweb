# Project State

Last updated: 2026-09-18

## Current phase

**Repository brain and full CI/E2E quality gates are integrated on `main`. The Óris360° Sales PWA remains implemented against the explicit DEMO gateway; real Óris360° API/SSO and production hosting remain external dependencies.**

The repository can now reconstruct development context from `AGENTS.md` → `docs/brain/INDEX.md`, route tasks to the smallest relevant gstack/Superpowers/ECC guidance, and automatically prove core code/browser gates through GitHub Actions.

## Verified repository baseline

- Default branch: `main`.
- Brain/CI merge commit: `83f4fb916149a09d8c35d30baa586a5234cd661c`.
- Source PR: #6.
- Verified PR head before merge: `48ccad3c7a14f19359c7726f4ecc7c5c3c96b8b8`.
- `Engine integrity`: success on the verified PR head.
- `app-ci`: success on the verified PR head; runtime dependency audit, lint, 44 Vitest tests, TypeScript/Vite build and PWA/Netlify artifact checks passed.
- `e2e`: success on the verified PR head; 3 Playwright Chromium journeys passed.
- Eleven pinned upstream repositories remain registered as Git submodules, including gstack, Superpowers and ECC.

## Repository intelligence now available

- canonical Prompt Mestre at `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`;
- brain entry at `docs/brain/INDEX.md`;
- machine-readable graph at `docs/brain/GRAPH.json`;
- intent routes for feature, bug, integration, UI, security and release;
- architecture/domain/testing nodes;
- gstack/Superpowers/ECC skill cards;
- Definition of Done;
- CI contract;
- validator enforcing graph paths, 20 immutable rules, 24 acceptance criteria and CI scripts.

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

No real endpoint, token, SSO URL, official phone or email may be invented.

## Deployment status

Netlify configuration exists, but a production `*.netlify.app` deployment has not been verified from this runtime.

## Next concrete work

For every future product request:
1. start at `AGENTS.md`;
2. enter `docs/brain/INDEX.md`;
3. select the matching route and nodes;
4. resolve skills through `docs/SKILL_ROUTER.md`;
5. implement with tests;
6. require current GitHub Actions evidence before completion.

When official Óris360° integration data becomes available, follow the Integration route and replace/extend the DEMO gateway without inventing contracts.

## Relevant entry points

- `AGENTS.md`
- `docs/brain/INDEX.md`
- `docs/brain/GRAPH.json`
- `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`
- `docs/SKILL_ROUTER.md`
- `docs/ACCEPTANCE_MATRIX.md`
- `docs/API_INTEGRATION.md`
- `docs/brain/DEFINITION_OF_DONE.md`
- `src/infrastructure/orisGateway.ts`
- `src/infrastructure/gatewayFactory.ts`
