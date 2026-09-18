# appweb — Óris360° Vendas Mobile

Repositório do **App de Vendas Mobile Óris360°**, uma PWA React/TypeScript offline-first, e do motor de desenvolvimento assistido que governa este projeto.

## Entrada para agentes

Toda sessão de desenvolvimento deve começar por:

`AGENTS.md` → `docs/brain/INDEX.md`

O cérebro do repositório direciona o agente para a especificação, estado, decisões, rota, nós e skills mínimos necessários.

Especificação funcional canônica:
- `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`

## Estado de integração

A aplicação possui uma implementação funcional usando `DemoOrisGateway` para validação do comportamento local. A API/SSO reais do Óris360° ainda dependem de contratos oficiais externos e não são apresentados como integração concluída.

A fronteira externa é:
- `src/infrastructure/orisGateway.ts`

O ponto de troca do gateway é:
- `src/infrastructure/gatewayFactory.ts`

Contrato pendente:
- `docs/API_INTEGRATION.md`

## Funcionalidades do App DEMO

- autenticação inicial online e acesso offline posterior;
- múltiplas empresas por usuário;
- isolamento local por aparelho + usuário + empresa;
- IndexedDB/Dexie;
- Pedidos com **TODOS** e **NÃO ENVIADOS**;
- Orçamento → Pedido sem documento duplicado;
- salvar, gerar Pedido e enviar como ações separadas;
- transmissão explícita com idempotência;
- bloqueio pós-envio;
- duplicação como novo Orçamento;
- clientes offline e prevenção de duplicidade por CPF/CNPJ;
- produtos/preço/estoque pela base local;
- sincronização comercial manual/transacional;
- Missões offline com retorno automático permitido;
- gates online para Relatórios e Sistema Online;
- PWA/service worker;
- configuração Netlify.

## Credenciais DEMO

```text
vendedor@demo.oris360.local
demo1234
```

O modo DEMO possui duas empresas para exercitar isolamento e regras distintas.

## Aceite

A rastreabilidade dos 24 critérios está em:
- `docs/ACCEPTANCE_MATRIX.md`

## Desenvolvimento

```bash
npm install
npm run dev
```

## Verificação

```bash
npm run lint
npm run test:run
npm run build
npx playwright install chromium
npm run test:e2e
python scripts/validate_engine.py
```

No GitHub, os workflows obrigatórios são:
- `app-ci`
- `e2e`
- `Engine integrity`

## Publicação no Netlify

```text
Build command: npm run build
Publish directory: dist
Node: 22
```

O repositório contém `netlify.toml`, fallback SPA, manifest/service worker e headers de segurança. A existência dessa configuração não prova que uma URL de produção já foi criada ou validada.

## Arquitetura

- React 19
- TypeScript
- Vite
- Dexie / IndexedDB
- vite-plugin-pwa
- Vitest
- ESLint
- Playwright
- GitHub Actions
- Netlify-ready

## Motores e skills

Fontes upstream fixadas ficam em `vendor/`. O agente deve navegar por:
- `docs/brain/INDEX.md`
- `docs/SKILL_ROUTER.md`
- `docs/RUNTIME.md`
- `ENGINE_MANIFEST.md`

GitHub armazena as instruções, mas somente capacidades expostas pelo runtime atual podem executar ações nativamente.

## Segurança

- credencial offline protegida por PBKDF2 + AES-GCM;
- sessão ativa em `sessionStorage`;
- CSP e headers no Netlify;
- auditoria de dependências runtime no CI;
- submódulos fixados por SHA;
- nenhum segredo deve ser commitado.
