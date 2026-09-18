# Decisions

Durable decisions for the appweb project. Append new decisions; do not silently rewrite history.

## 2026-09-18 — Repository is the durable operating source

**Decision:** Keep project instructions, skill routing, state, decisions, specs, and plans in this GitHub repository.

**Reason:** Future sessions need an auditable source of truth that survives conversation boundaries.

**Consequence:** Every meaningful repository task starts by restoring repository context and ends by persisting any changed project truth.

## 2026-09-18 — Reuse upstream capabilities instead of rebuilding them

**Decision:** gstack, Superpowers, Anthropic/Addy/Vercel skills, Mem0, MCP references, Bolt.diy, and Dyad remain pinned upstream submodules rather than being copied/reimplemented as home-grown frameworks.

**Reason:** The project should benefit from established implementations while preserving provenance, licensing boundaries, and update control.

**Consequence:** New custom skills are a last resort; the agent must search existing pinned capabilities first.

## 2026-09-18 — Runtime truth must remain explicit

**Decision:** A vendored repository is a persistent source/reference, not proof that its runtime is currently executing.

**Reason:** GitHub storage cannot grant ChatGPT or another host new execution capabilities.

**Consequence:** The agent must distinguish between a runtime-native available skill/tool and guidance read from a pinned upstream source.

## 2026-09-18 — Semantic continuity uses explicit project state

**Decision:** `PROJECT_STATE.md` and this file are the portable cross-session memory for repository work. gstack context-save/context-restore and Addy context-engineering are the governing upstream patterns.

**Reason:** This avoids relying on hidden or host-specific memory for facts that must remain auditable.

**Consequence:** Important decisions and current work state are written here/root state files without secrets.


## 2026-09-18 — Óris360° Sales App is an offline-first PWA

**Decision:** Implement the sales client as a React/TypeScript/Vite PWA with IndexedDB/Dexie as the operational local database.

**Reason:** The product's primary invariant is continuing sales after a valid first synchronization even when connectivity is unavailable.

**Consequence:** UI code must not treat network availability as a requirement for local sales operations. Online-only areas remain explicitly gated.

## 2026-09-18 — Sales documents never use the general commercial sync channel

**Decision:** Pedido/Orçamento transmission is an explicit user action with a stable idempotency key. The general commercial synchronization service never uploads sales documents.

**Reason:** This is a master business rule and prevents accidental submission when connectivity returns.

**Consequence:** Automatic queues may be used for Mission returns, but never for sales documents.

## 2026-09-18 — Local history belongs to the device context

**Decision:** Central Pedido/Orçamento history is never downloaded into the App. Local document history is scoped by device + user + company.

**Reason:** The product explicitly defines device-local history.

**Consequence:** A new/reinstalled device starts with zero local Pedido/Orçamento history even when the server contains previously submitted documents.

## 2026-09-18 — Real API integration is isolated behind OrisGateway

**Decision:** The complete App is allowed to run against `DemoOrisGateway` until the real Óris360° API is provided. Production integration replaces only the gateway adapter/factory.

**Reason:** The user will connect the API later and no official endpoint/credential was available during implementation.

**Consequence:** Never hardcode guessed endpoints or credentials into product/domain/UI code. Follow `docs/API_INTEGRATION.md`.

## 2026-09-18 — Netlify is the target static/PWA host

**Decision:** Build output is `dist/`, with deployment configuration in `netlify.toml`.

**Reason:** The user selected Netlify and wants a free `*.netlify.app` domain.

**Consequence:** Keep SPA fallback, PWA artifacts and security headers compatible with Netlify. Actual site creation requires access to the user's Netlify account.


## 2026-09-18 — ECC joins gstack and Superpowers as a pinned upstream engine

**Decision:** Pin affaan-m/ECC under vendor/engines/ecc and route only the smallest relevant specialized skills through it.

**Reason:** ECC adds research, API/backend/frontend, security, e2e, memory and verification capabilities without replacing the existing process engines.

**Consequence:** Do not duplicate runtime hooks/plugins just because complete sources are vendored. Superpowers governs lifecycle, gstack governs product/review/QA/release, and ECC supplies specialized capability guidance when relevant.
