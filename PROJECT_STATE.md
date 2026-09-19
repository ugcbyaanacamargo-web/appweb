# Project State

Last updated: 2026-09-19

## Current phase

**Complete App Flows is implemented on `feature/complete-app-flows` and has passed code/browser gates on the verified code SHA `6bde97aee6bf124871cf81c9586f547f55801225`. The real Óris360° server-side integrations and production Netlify deployment remain external dependencies.**

The fixed ten-item seller menu remains unchanged. Missing functional flows around integration setup, password recovery, reports, Sistema Online, WhatsApp status, Help actions, dynamic customer fields and Mission Web Push were implemented without inventing official endpoints or credentials.

## Verified branch evidence

Verified code SHA before this state/documentation update:

`6bde97aee6bf124871cf81c9586f547f55801225`

GitHub Actions on that SHA:

- `Engine integrity`: success.
- `app-ci`: success.
  - runtime dependency audit: 0 vulnerabilities;
  - lint: success;
  - Vitest: 12 test files / 65 tests passed;
  - TypeScript + Vite production build: success;
  - PWA/Netlify artifact validation: success.
- `e2e`: success.
  - 7 Playwright Chromium journeys passed.

The seven browser journeys cover:
1. fixed ten-item menu;
2. quote/customer/product gating and reload persistence;
3. explicit send, sent-document lock and duplication;
4. real-API configuration health check before activation;
5. password recovery gateway flow;
6. Reports, Sistema Online and WhatsApp gateway flows;
7. backend-defined customer fields working offline and persisting after reload.

Final branch documentation changes still require their own current GitHub Actions evidence before integration.

## Repository intelligence

- canonical Prompt Mestre: `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`;
- brain entry: `docs/brain/INDEX.md`;
- machine-readable graph: `docs/brain/GRAPH.json`;
- functional audit: `docs/FUNCTIONAL_AUDIT.md`;
- integration contract: `docs/API_INTEGRATION.md`;
- Definition of Done: `docs/brain/DEFINITION_OF_DONE.md`.

## Product capabilities implemented

### Offline commercial operation

- React/TypeScript/Vite mobile-first PWA.
- IndexedDB/Dexie local persistence.
- Isolation by device + user + company + integration realm.
- First activation online; later offline login from encrypted cached credentials.
- Offline credentials are isolated between DEMO and each real API realm.
- Fixed ten-item global menu.
- Offline Quotes/Orders.
- Save, Generate Order and Send remain separate actions.
- Explicit transmission with idempotency.
- Server confirmation required before sent state.
- Sent-document lock and duplication as a new Quote.
- Manual transactional commercial sync.
- Central Order/Quote history is never downloaded.

### Customers

- offline create/edit;
- CPF/CNPJ duplicate prevention;
- central active/inactive ownership preserved;
- backend-defined additional customer fields;
- runtime sanitization of field schema and values;
- local persistence of those fields;
- pending customers sent before related documents.

### Real API client boundary

- `HttpOrisGateway` implements the same application gateway as DEMO.
- device-level integration setup screen;
- HTTPS base URL + explicit endpoint mapping;
- health check must pass before real mode is activated;
- no server secret/private API key is stored in the browser;
- runtime validation rejects malformed successful API payloads;
- client-owned fields such as `scopeKey` and `pendingSync` are not required from the server;
- integration realm keeps API environments isolated from each other and from DEMO.

### Online/support flows

- password recovery calls the configured gateway;
- Reports & Commissions loads seller-scoped gateway data;
- Sistema Online requests an integrated/temporary session URL;
- WhatsApp/AI page reads backend integration status and management URL when supplied;
- Help phone/WhatsApp/e-mail actions are driven by centrally synchronized data.

### Missions

- Mission execution remains available offline after receipt;
- allowed automatic Mission return remains separate from sales-document transmission;
- Web Push subscription client implemented;
- public VAPID key comes from commercial configuration;
- private VAPID key remains server-side;
- logout/company change unsubscribes the browser push subscription;
- push notification opens the Mission area;
- supported Mission image evidence is limited to three images of at most 5 MB each.

## External dependencies still pending

The repository now contains the client-side integration machinery, but the following production dependencies have **not** been provided or verified:

- official Óris360° API base URL and route mappings;
- real server implementation matching `docs/API_INTEGRATION.md`;
- production authentication/session policy and real SSO provider;
- real WhatsApp/AI provider integration;
- VAPID private key and server-side Web Push delivery;
- official complete customer-field schema supplied by the real backend;
- existing Delivery module source/contract if its catalog must be reused literally;
- official centrally configured support contacts;
- production Netlify site/URL and post-deploy validation.

No endpoint, token, SSO URL, phone or e-mail is invented.

## Deployment status

Netlify configuration exists and builds successfully in CI. A production `*.netlify.app` deployment has not been created/verified from this runtime.

## Next concrete work

1. Validate this final documentation/state SHA through all GitHub Actions gates.
2. Review the final branch diff.
3. Create/merge the delivery PR only according to the chosen branch-finishing action.
4. When official backend details are supplied, use `CONFIGURAR INTEGRAÇÃO` and `docs/API_INTEGRATION.md` to connect and validate the real environment.
5. Validate the production Netlify deployment separately.

## Relevant entry points

- `AGENTS.md`
- `docs/brain/INDEX.md`
- `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`
- `docs/FUNCTIONAL_AUDIT.md`
- `docs/API_INTEGRATION.md`
- `docs/ACCEPTANCE_MATRIX.md`
- `src/infrastructure/orisGateway.ts`
- `src/infrastructure/httpOrisGateway.ts`
- `src/infrastructure/integrationConfig.ts`
- `src/infrastructure/gatewayFactory.ts`
- `src/app/App.tsx`
