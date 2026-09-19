# Decisions

Durable decisions for the appweb project. Append new decisions; do not silently rewrite history.

## 2026-09-18 — Repository is the durable operating source

**Decision:** Keep project instructions, skill routing, state, decisions, specs and plans in this GitHub repository.

**Reason:** Future sessions need an auditable source of truth that survives conversation boundaries.

**Consequence:** Every meaningful repository task starts by restoring repository context and ends by persisting changed project truth.

## 2026-09-18 — Reuse upstream capabilities instead of rebuilding them

**Decision:** gstack, Superpowers, ECC, Anthropic/Addy/Vercel skills, Mem0, MCP references, Bolt.diy and Dyad remain pinned upstream submodules rather than copied/reimplemented as home-grown frameworks.

**Reason:** The project should benefit from established implementations while preserving provenance, licensing boundaries and update control.

**Consequence:** New custom skills are a last resort; the agent searches existing pinned capabilities first.

## 2026-09-18 — Runtime truth must remain explicit

**Decision:** A vendored repository is a persistent source/reference, not proof that its runtime is executing.

**Reason:** GitHub storage cannot grant ChatGPT or another host new execution capabilities.

**Consequence:** The agent distinguishes runtime-native tools from guidance read from pinned upstream source.

## 2026-09-18 — Semantic continuity uses explicit project state

**Decision:** `PROJECT_STATE.md` and this file are the portable cross-session memory for repository work.

**Reason:** Auditable project facts must not depend on hidden or host-specific memory.

**Consequence:** Important decisions and current state are written here without secrets.

## 2026-09-18 — Óris360° Sales App is an offline-first PWA

**Decision:** Implement the sales client as a React/TypeScript/Vite PWA with IndexedDB/Dexie as the operational local database.

**Reason:** The primary invariant is continuing sales after a valid first synchronization even without connectivity.

**Consequence:** UI code must not require network availability for local sales operations except explicitly online-only areas.

## 2026-09-18 — Sales documents never use the general commercial sync channel

**Decision:** Pedido/Orçamento transmission is an explicit user action with a stable idempotency key. General commercial synchronization never uploads sales documents.

**Reason:** This is a master business rule and prevents accidental submission when connectivity returns.

**Consequence:** Automatic queues may be used for Mission returns, never for sales documents.

## 2026-09-18 — Local history belongs to the device context

**Decision:** Central Pedido/Orçamento history is never downloaded into the App. Local document history is scoped by device + user + company.

**Reason:** The product explicitly defines device-local history.

**Consequence:** New/reinstalled devices start with zero local Pedido/Orçamento history.

## 2026-09-18 — Real API integration is isolated behind OrisGateway

**Decision:** The App may run against `DemoOrisGateway` until the real Óris360° API is provided. Production integration replaces the gateway adapter/factory.

**Reason:** No official endpoint/credential is available.

**Consequence:** Never hardcode guessed endpoints or credentials. Follow `docs/API_INTEGRATION.md`.

## 2026-09-18 — Netlify is the target static/PWA host

**Decision:** Build output is `dist/`, with deployment configuration in `netlify.toml`.

**Reason:** Netlify is the selected hosting target.

**Consequence:** Keep SPA fallback, PWA artifacts and security headers compatible with Netlify. Actual site creation requires authorized access.

## 2026-09-18 — ECC joins gstack and Superpowers as a pinned upstream engine

**Decision:** Pin affaan-m/ECC under `vendor/engines/ecc` and route only the smallest relevant specialized skills through it.

**Reason:** ECC adds research, API/backend/frontend, security, E2E, memory and verification capabilities without replacing process engines.

**Consequence:** Superpowers governs lifecycle, gstack governs product/review/QA/release, and ECC supplies specialized guidance.

## 2026-09-18 — Repository brain is the navigation layer

**Decision:** `AGENTS.md` always routes first through `docs/brain/INDEX.md`; `docs/brain/GRAPH.json` represents the same routes, nodes, skills and gates in machine-readable form.

**Reason:** ChatGPT Web does not automatically execute or load every vendored skill. A small linked graph gives deterministic navigation without flooding context.

**Consequence:** New durable capabilities/routes must update the brain and keep the bootstrap path unbroken.

## 2026-09-18 — Prompt Mestre is canonical product specification

**Decision:** Preserve the user's Prompt Mestre in `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`.

**Reason:** The repository must be able to reconstruct product requirements without depending on a specific chat attachment.

**Consequence:** Historical executor wording such as "Você, Base44" does not change the functional rules or force a specific runtime.

## 2026-09-18 — UI behavior requires browser-level proof

**Decision:** Add ESLint and Playwright E2E as required CI gates alongside Vitest/build and engine integrity.

**Reason:** Unit/domain tests can pass while buttons, navigation or persistence flows remain broken in the browser.

**Consequence:** Interactive features should gain/maintain E2E coverage when technically testable, and completion claims require current CI evidence.

## 2026-09-19 — Real API configuration is explicit and secret-free in the browser

**Decision:** The PWA may store only non-secret integration metadata: HTTPS base URL and route mappings. A real integration profile activates only after its health endpoint succeeds.

**Reason:** The user needs a self-service place to connect the App, but browser-delivered code cannot safely hold server private keys.

**Consequence:** Server secrets remain in the backend/hosting secret store. The App sends only the authenticated user's session token after login and never invents official endpoints.

## 2026-09-19 — Integration realm is part of local trust/isolation

**Decision:** Offline authentication cache and local data scopes are separated by integration realm in addition to device, user and company.

**Reason:** DEMO and a real API — or two real API environments — may reuse the same user/company IDs and must never share local commercial state.

**Consequence:** Switching integration profiles cannot expose another realm's offline credentials or IndexedDB scope. DEMO retains the legacy scope-key shape; real realms receive an encoded realm prefix.

## 2026-09-19 — External API payloads require runtime validation

**Decision:** Successful HTTP responses are validated at runtime before entering application/domain state.

**Reason:** TypeScript types do not validate untrusted JSON. A malformed 200 response must not corrupt authentication, snapshots, documents, reports, missions or online integration state.

**Consequence:** Malformed success payloads fail with `INVALID_DATA` instead of being trusted through type casts.

## 2026-09-19 — Customer extensibility is backend-schema driven

**Decision:** Name and CPF/CNPJ remain the fixed local base, while additional editable customer fields are defined by a synchronized backend schema.

**Reason:** The master specification requires editing all allowed customer data, but the official complete field schema has not been supplied.

**Consequence:** The App renders/persists only allowed sanitized field definitions and does not invent permanent commercial fields.

## 2026-09-19 — Mission push uses a client/server split

**Decision:** The PWA owns notification permission, Web Push subscription and service-worker handling; the backend owns VAPID private credentials and actual push delivery.

**Reason:** Private push credentials cannot safely exist in browser code, while Missions are the specification's automatic-notification exception.

**Consequence:** The commercial snapshot may supply only the public VAPID key. Production push remains dependent on server-side delivery.

