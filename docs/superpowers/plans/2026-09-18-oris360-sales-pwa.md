# Óris360° Sales PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Construir uma PWA mobile-first offline-first do App de Vendas Óris360° que implemente as 20 regras-mãe e os 24 critérios de aceite, seja publicável no Netlify e isole a futura integração real por um gateway.

**Architecture:** React/TypeScript/Vite no frontend; IndexedDB/Dexie como persistência operacional; regras de negócio puras separadas da UI; serviços explícitos para sync e transmissão; OrisGateway como contrato externo e DemoOrisGateway para funcionamento demonstrável sem endpoints reais. Service worker fornece app-shell offline.

**Tech Stack:** React 19, TypeScript 5, Vite 7, Dexie, vite-plugin-pwa, Vitest, Testing Library.

**Spec:** docs/superpowers/specs/2026-09-18-oris360-sales-pwa-design.md

## Global Constraints

- Offline-first depois da primeira sincronização válida.
- Sincronização comercial somente manual.
- Sincronização nunca envia Pedidos/Orçamentos.
- Transmissão de documento somente por ação explícita.
- Idempotência obrigatória.
- Documento enviado bloqueado.
- Histórico central não é baixado.
- Isolamento por dispositivo/usuário/empresa.
- Logout não apaga dados.
- Conta bloqueada não sincroniza, mas pode enviar documento.
- Não inventar endpoints, contatos ou credenciais oficiais.
- Netlify deve publicar dist/.

---

### Task 1: Contrato de domínio e testes RED
Files: src/domain/models.ts, src/domain/rules.test.ts, src/domain/rules.ts.
Produz tipos e funções puras de preço, estoque, conversão, duplicação e bloqueio.
- [ ] Escrever testes para R6–R12, R18 e duplicação.
- [ ] Executar no CI e confirmar falha por comportamento não implementado.
- [ ] Implementar somente o necessário.
- [ ] Reexecutar testes.

### Task 2: Persistência e isolamento
Files: src/infrastructure/db.ts, src/infrastructure/scope.ts, src/infrastructure/db.test.ts.
- [ ] Testar queries por scope.
- [ ] Testar logout sem delete.
- [ ] Implementar repositórios locais e snapshot ativo/staging.
- [ ] Verificar isolamento.

### Task 3: Gateway e backend demo
Files: src/infrastructure/orisGateway.ts, src/infrastructure/demoOrisGateway.ts, src/infrastructure/connectivity.ts.
- [ ] Testar idempotência.
- [ ] Testar deduplicação CPF/CNPJ.
- [ ] Testar validação de estoque.
- [ ] Implementar gateway demo.

### Task 4: Sincronização transacional
Files: src/services/sync.ts, src/services/sync.test.ts.
- [ ] Testar R3, R16, R20 e erro isolado de cliente.
- [ ] Confirmar que documentos nunca são enviados.
- [ ] Implementar staging/commit.
- [ ] Aplicar inativação/repreço após snapshot válido.

### Task 5: Transmissão explícita
Files: src/services/transmit.ts, src/services/transmit.test.ts.
- [ ] Testar offline, timeout, confirmação, retry e conta bloqueada.
- [ ] Testar cliente novo/editado antes do documento.
- [ ] Testar ajuste de estoque do servidor.
- [ ] Implementar bloqueio pós-confirmação.

### Task 6: Aplicação e sessão
Files: src/app/App.tsx, src/app/AppContext.tsx, src/app/session.ts, src/main.tsx.
- [ ] Implementar landing/login.
- [ ] Implementar seleção de empresa.
- [ ] Exigir online na primeira ativação.
- [ ] Restaurar scope já ativado offline.

### Task 7: UI mobile operacional
Files: src/ui/Shell.tsx, Orders.tsx, QuoteEditor.tsx, Customers.tsx, Products.tsx, Missions.tsx, OnlinePages.tsx, src/styles.css.
- [ ] Implementar TODOS / NÃO ENVIADOS.
- [ ] Cliente obrigatório antes do catálogo.
- [ ] Ordem de quatro ações.
- [ ] Estados enviado/bloqueado e DUPLICAR PEDIDO.
- [ ] Menu exatamente com 10 itens.
- [ ] Acessibilidade e responsividade.

### Task 8: PWA e Netlify
Files: package.json, vite.config.ts, index.html, netlify.toml, tsconfig*.json, public/icon.svg.
- [ ] Executar testes.
- [ ] Executar TypeScript/build.
- [ ] Validar manifest/service worker.

### Task 9: Aceite, CI e documentação
Files: src/acceptance/masterRules.test.ts, .github/workflows/app-ci.yml, README.md, PROJECT_STATE.md, DECISIONS.md.
- [ ] Cobrir 24 critérios.
- [ ] CI: npm ci && npm test -- --run && npm run build.
- [ ] Documentar modo demo e Netlify.
- [ ] Documentar contrato do gateway real.

### Task 10: Review e entrega
- [ ] Executar review gstack + Superpowers.
- [ ] Corrigir defeitos críticos/importantes.
- [ ] Reexecutar suíte.
- [ ] Abrir PR com evidência.
- [ ] Integrar somente após checks verdes.
