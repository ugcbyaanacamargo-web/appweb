# Implementação fase 1 — painéis internos Óris360°

## Objetivo
Eliminar navegação obrigatória ao Saboriza e criar painéis internos reais em appweb; priorizar fluxo DEMO de produto → sincronização manual → venda e um painel vendedor isolado. Não fingir backend multiaparelho.

## Contratos
- `src/domain/models.ts`: CompanyRef.role opcional e foto/descrição opcionais em Product, preservando snapshots legados.
- `src/infrastructure/demoOrisGateway.ts`: conta DEMO administrativa distinta; verificação owner/admin para gestão; CRUD de produto por empresa, persistência demo localStorage; lista central de documentos por vendedor sem download para Dexie; guard de roles em todas as ações admin.
- `src/app/App.tsx`: workspace local app/seller/admin com URLs `/vendedor` e `/empresa`, gate por papel e contexto; restabelecer mobile em `/`.
- `src/ui/CompanyPanel.tsx`: gerenciamento manual de produto completo para campos existentes (nome, SKU, preço, estoque, status, descrição e uma foto), salvar, editar, inativar, erro/estado vazio, reabrir após refresh.
- `src/ui/SellerPanel.tsx`: resultados seller-scoped e documentos centrais DEMO; sem histórico central no App mobile.
- `src/ui/OnlinePages.tsx`: não redirecionar para Saboriza; abrir painel interno conforme role.
- `src/ui/Products.tsx`: renderizar foto armazenada offline, com fallback à inicial do produto.
- `e2e/sales-flow.spec.ts`, testes unitários Demo Gateway.
- `PROJECT_STATE.md`, `DECISIONS.md`, docs de API: revogar a antiga decisão e registrar as partes ainda sem backend.

## TDD
1. RED: E2E que entra vendedor DEMO → Sistema Online → painel vendedor interno, sem Saboriza; teste admin com login owner demo → produto manual → reload → App → sync → catálogo mostra produto/foto.
2. RED: Vitest role denial e isolamento company; testes de validação de preço/sku/estoque/foto.
3. GREEN: código mínimo sem reescrever motor offline.
4. REFACTOR: acessibilidade, URLs, loading/erro.
5. GitHub Actions app-ci/e2e/engine e smoke Netlify específico do novo painel.

## Limites expressos
DEMO persiste apenas no mesmo navegador. O próximo ciclo implementa backend próprio multiempresa do Óris360°, storage central de fotos, auth/RBAC server-side, carteira de clientes, Missões/Push, comissões, documentos centrais e SSO real. Não classificar telas DEMO como backend online real.
