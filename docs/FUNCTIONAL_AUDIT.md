# Functional Audit — Óris360° Sales App

Date: 2026-09-19
Baseline audited: `main @ 37f51126db61c045f26df9960db995a92fe3c96e`
Implementation branch: `feature/complete-app-flows`

## Master acceptance criteria

The 24 master criteria remain traced in:
- `docs/ACCEPTANCE_MATRIX.md`

No master rule was intentionally weakened in this implementation.

## Gaps found in the audited baseline

| Area | Baseline status |
|---|---|
| Esqueci a senha | INCOMPLETE — informational toast only |
| API real setup | MISSING |
| HTTP gateway | MISSING |
| Reports & Commissions | INCOMPLETE — placeholder |
| Sistema Online | INCOMPLETE — static URL only |
| IA no WhatsApp | INCOMPLETE — placeholder |
| Ajuda | PARTIAL |
| Mission background push | PARTIAL |
| Integration diagnostics | MISSING |
| Full customer fields | OFFICIAL SCHEMA NOT AVAILABLE |

## Status after implementation

| Area | Client/App status | External dependency still required |
|---|---|---|
| Esqueci a senha | IMPLEMENTED through gateway | real reset endpoint/delivery channel |
| API real setup | IMPLEMENTED | official base URL + route mappings |
| HTTP gateway | IMPLEMENTED + runtime response validation | real server contract |
| Reports & Commissions | IMPLEMENTED through gateway | real seller-report endpoint/data |
| Sistema Online | IMPLEMENTED through temporary/integrated session request | real SSO provider/session endpoint |
| IA no WhatsApp | IMPLEMENTED status/management flow | real WhatsApp/AI provider/backend |
| Ajuda | IMPLEMENTED actionable phone/WhatsApp/e-mail | official centrally supplied contacts |
| Mission Web Push | CLIENT IMPLEMENTED | VAPID private key + server delivery |
| Integration diagnostics | IMPLEMENTED | production network/CORS configuration |
| Customer fields | IMPLEMENTED as backend-defined schema | official real schema values |
| Delivery catalog literal reuse | CURRENT LOCAL CATALOG REMAINS | existing Delivery module source/contract |

## Additional defects found and fixed during review

### Real API responses were trusted by TypeScript only

**Risk:** malformed HTTP 200 JSON could enter application state.

**Fix:** `HttpOrisGateway` now validates external success payloads at runtime and rejects invalid shapes with `INVALID_DATA`.

### DEMO/API credentials could share the same offline cache identity

**Risk:** switching backend could reuse an offline auth record from another integration.

**Fix:** offline credentials are namespaced and cryptographically derived with an integration realm.

### DEMO/API local data could collide when server IDs matched

**Risk:** same device/user/company IDs from two environments could share IndexedDB scope.

**Fix:** local scope now includes the integration realm for non-DEMO environments.

### Realm normalization could collapse case-sensitive API paths

**Risk:** `/TenantA` and `/tenanta` could be treated as the same environment.

**Fix:** host/origin is normalized while path case is preserved.

### Server was being asked to understand local-only scope fields

**Risk:** real backend contract would unnecessarily depend on device-local identifiers.

**Fix:** HTTP adapter injects `scopeKey` and local pending state on the client.

### Mission evidence accepted unrestricted image input

**Risk:** oversized/unsupported evidence could consume excessive local storage or create unstable behavior.

**Fix:** three-image limit, 5 MB maximum per image and explicit supported image formats.

## Verified browser journeys

On code SHA `6bde97aee6bf124871cf81c9586f547f55801225`, Playwright Chromium passed seven journeys:

1. exact fixed menu;
2. customer-before-product quote flow + reload persistence;
3. explicit document send + lock + duplicate;
4. API configuration + health validation;
5. password recovery gateway;
6. Reports/Online/WhatsApp gateway flows;
7. dynamic customer fields offline + persistence.

## External boundaries

The following cannot be truthfully completed without external systems/data:

- official Óris360° API URLs;
- production backend implementation;
- real SSO;
- real WhatsApp/AI provider;
- VAPID private key and server-side push sender;
- official support contacts;
- existing Delivery module source/contract;
- production Netlify site and post-deploy checks.

These are dependencies, not placeholders disguised as completed integrations.

## Invariants preserved

- fixed ten-item main menu;
- general sync never sends Orders/Quotes;
- sales-document send remains explicit;
- DEMO is clearly DEMO;
- no guessed official endpoint/token/contact;
- sent document remains locked;
- local operation remains offline-first after valid activation;
- company/user/device/integration data isolation is enforced.
