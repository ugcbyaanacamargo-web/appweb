# Óris360° ↔ Saboriza: primeira entrega de integração

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o Óris360° reconhecer o Sistema Online Saboriza em sua experiência real e preparar uma fronteira verificável para consumir produtos/clientes sem inventar estoque, login integrado ou APIs ainda inexistentes.

**Architecture:** Preservar `OrisGateway`, Dexie e os fluxos offline atuais. Introduzir somente acesso explícito ao portal público Saboriza sem prometer SSO e uma tradução isolada dos registros públicos conhecidos do Saboriza; qualquer snapshot completo/cliente/pedido/SSO aguarda backend autorizado e compatível.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright, Dexie, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-19-oris360-complete-platform-design.md` e `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`.

## Global Constraints

- Menu móvel mantém **exatamente dez itens**, HOME Pedidos.
- A base comercial sincroniza somente manualmente, nunca envia Pedido/Orçamento.
- Pedidos e Orçamentos só são enviados explicitamente; histórico central nunca volta para o aparelho.
- Nunca presumir que autenticação DEMO equivale à conta Saboriza, nem anunciar SSO sem handoff real.
- Nunca inventar estoque do Saboriza, SKU oficial, tabela, função, valor, contato ou chave.
- Sem alterações no repositório Saboriza, no Supabase ou nos dados dos usuários nesta entrega.
- Operar em branch isolada e verificar GitHub Actions/Playwright antes de integrar.

## Review Focus

1. Servidor responde `available: false` com URL: jamais chamar isso de sessão autenticada nem abrir URL não confiável.
2. Navegador pode bloquear pop-up depois de `await`: oferecer um link direto de ação humana para Saboriza.
3. Sem internet: não sugerir que Sistema Online funciona offline.
4. Produto Saboriza não contém estoque/SKU no schema conhecido: não preencher com zero ou dados falsos para liberar venda.
5. Cliente Saboriza tem CNPJ mas não necessariamente CPF: não tratar identificador ausente como cadastro pronto para sincronizar.

---

### Task 1: Acesso honesto ao Sistema Online Saboriza

**Files:**
- Modify: `src/ui/OnlinePages.tsx`
- Modify: `e2e/sales-flow.spec.ts`
- Test: `e2e/sales-flow.spec.ts`

**Interfaces:**
- Consumes: `runtime.online`, `runtime.gateway.createOnlineSession(context)`, `OnlineSessionResult`.
- Produces: link HTTPS explícito para `https://saboriza-catalogo.vercel.app/admin/login`, sem token, mais tentativas SSO apenas quando resposta `available` e URL HTTPS válida.

- [x] **Step 1: Write failing browser test.** Extend existing Reports/Online/WhatsApp journey to assert the named Saboriza link appears, points to `https://saboriza-catalogo.vercel.app/admin/login`, is independently clickable, and explanatory text says login integrado ainda depende de conexão oficial.
- [x] **Step 2: Observe RED.** Push only the failing test to isolated branch; inspect the Playwright job failure and confirm it fails because the link is absent.
- [x] **Step 3: Implement minimal UI.** Keep SSO attempt on the existing button, but never open `session.url` if `available = false`. Render HTTPS anchor with `target="_blank"` and `rel="noopener noreferrer"`; warn that DEMO login does not authenticate in Saboriza and that signing in may be required.
- [x] **Step 4: Observe GREEN.** Run full Playwright via GitHub Actions, plus lint, Vitest, build, PWA and engine integrity.
- [x] **Step 5: Commit.** `feat: link Sistema Online to official Saboriza login`.

### Task 2: Validação de catálogo Saboriza sem estoque inventado

**Files:**
- Create: `src/infrastructure/saboriza/catalogMapping.ts`
- Create: `src/infrastructure/saboriza/catalogMapping.test.ts`

**Interfaces:**
- Consumes: parsed, unknown Saboriza products with fields `id`, `name`, `unit_price`, `is_active`, `updated_at`.
- Produces: `mapSaborizaProducts(records: unknown, scopeKey: string, details: Map<string, { sku: string; stock: number }>): Product[]`; throws `GatewayError('INVALID_DATA')` on missing/invalid/duplicate product id, price, timestamps, SKU or stock.

- [x] **Step 1: Write failing unit tests.** Product with valid verified stock+SKU maps price/active correctly; product lacking stock or SKU fails; invalid price fails; duplicate id fails; empty active catalog can succeed only when the central snapshot intentionally returned an empty list.
- [x] **Step 2: Observe RED.** Commit test-only changes and inspect failing Vitest job for missing mapper export.
- [x] **Step 3: Implement minimal mapper.** No Supabase call or guessed RPC; reject invalid data rather than substituting zero stock.
- [x] **Step 4: Observe GREEN.** Run tests/build/lint and relevant regression.
- [x] **Step 5: Commit.** `feat: add strict Saboriza catalog boundary`.

### Task 3: API pendente, sem fingir integração

**Files:**
- Modify: `docs/API_INTEGRATION.md`
- Modify: `docs/SABORIZA_ADAPTATION_MATRIX.md`
- Modify: `PROJECT_STATE.md`
- Modify: `DECISIONS.md` only if a new durable choice arises

**Interfaces:**
- Documents: exact Saboriza source fields, missing remote stock/SKU/quote/order/SSO/permissions and final required Supabase sandbox/prod connection details.

- [x] **Step 1: Document what the mapper validates and which public schema values were confirmed from the source.**
- [x] **Step 2: Mark Saboriza production adapter as **not activated** pending authorized project URL, publishable key, RLS, matching snapshot/RPCs and sandbox tests.
- [x] **Step 3: Verify diff is scoped and contains no secret.**
- [x] **Step 4: Inspect all branch gates; keep PR draft if real integration prerequisites remain.**

## Next separate plans once central services are authorized

1. Supabase auth/company-memberships and first snapshot, separate test plan.
2. Product/customer snapshot and client upsert under RLS.
3. Atomic idempotent quote/order RPC, official number and real stock.
4. Mission Web Push/location and seller commissions.
5. Secure one-time SSO and WhatsApp/IA service connection.

These are **dependent projects**, not fake stages that can be called complete before backend/service evidence exists.

## Evidence from this delivery

- Browser test RED: GitHub Actions E2E run `35528329820`, 1 failed / 7 passed, missing Saboriza link.
- Browser test GREEN: E2E run `35528433690`, success.
- Catalog mapper test RED: app-ci run `35528546576`, missing `./catalogMapping` module; 65 existing tests passed.
- Mapper GREEN: app-ci run `35528631836`, success; E2E `35528631858`, success; Engine integrity `35528631942`, success.
- This first delivery deliberately does not activate the production Supabase gateway, modify Saboriza, or claim shared authentication.
