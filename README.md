# appweb — Óris360° Vendas Mobile

Repositório do **App de Vendas Mobile Óris360°**, uma PWA React/TypeScript offline-first, e do motor de desenvolvimento assistido que governa este projeto.

## Entrada para agentes

Toda sessão de desenvolvimento deve começar por:

`AGENTS.md` → `docs/brain/INDEX.md`

Especificação funcional canônica:
- `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`

Auditoria funcional:
- `docs/FUNCTIONAL_AUDIT.md`

## Estado de integração

O App possui dois modos:

1. **DEMO** — servidor simulado local claramente identificado;
2. **API REAL** — cliente HTTP configurável pelo próprio App.

A tela inicial possui:

`CONFIGURAR INTEGRAÇÃO → API REAL`

Para ativar o modo real, o usuário informa a URL base HTTPS e as rotas descritas em:

- `docs/API_INTEGRATION.md`

O App testa primeiro o endpoint de saúde. A configuração só é salva/ativada após resposta bem-sucedida.

**Nenhuma chave privada de servidor deve ser colocada no navegador.**

A infraestrutura cliente para integração está implementada, mas a API/SSO/WhatsApp/Web Push reais continuam dependendo do backend oficial e de dados externos ainda não fornecidos.

## Funcionalidades implementadas

- autenticação inicial online e acesso offline posterior;
- cache offline criptografado com PBKDF2 + AES-GCM;
- isolamento por integração + aparelho + usuário + empresa;
- múltiplas empresas por usuário;
- IndexedDB/Dexie;
- Pedidos com **TODOS** e **NÃO ENVIADOS**;
- Orçamento → Pedido sem documento duplicado;
- salvar, gerar Pedido e enviar como ações separadas;
- transmissão explícita com idempotência;
- bloqueio pós-envio;
- duplicação como novo Orçamento;
- clientes offline e prevenção de duplicidade por CPF/CNPJ;
- campos adicionais de cliente definidos pelo backend;
- produtos/preço/estoque pela base local;
- sincronização comercial manual/transacional;
- Missões offline com retorno automático permitido;
- Web Push de Missões preparado no cliente;
- Relatórios e Comissões via gateway;
- Sistema Online via sessão integrada/SSO fornecida pelo backend;
- IA no WhatsApp via status/URL de gerenciamento fornecidos pelo backend;
- Ajuda com contatos centrais;
- configuração segura da API real com teste de conexão;
- PWA/service worker;
- configuração Netlify.

## Credenciais DEMO

```text
vendedor@demo.oris360.local
demo1234
```

As credenciais DEMO aparecem somente quando o App está em modo DEMO.

## API real

Contrato completo:
- `docs/API_INTEGRATION.md`

Pontos importantes:
- URL base deve usar HTTPS em produção;
- endpoints são configuráveis;
- CORS deve permitir o domínio autorizado do App;
- o token de sessão do usuário é enviado como Bearer depois do login;
- respostas JSON são validadas em runtime;
- `scopeKey` e `pendingSync` são internos ao cliente;
- segredos server-side não entram em `localStorage`, `VITE_*` ou bundle JavaScript.

## Aceite

Rastreabilidade dos 24 critérios principais:
- `docs/ACCEPTANCE_MATRIX.md`

A suíte também possui testes adicionais para integração, segurança de estado, campos dinâmicos, evidências de Missão e fluxos de navegador.

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

No GitHub:
- `app-ci`
- `e2e`
- `Engine integrity`

## Publicação no Netlify

```text
Build command: npm run build
Publish directory: dist
Node: 22
```

O repositório contém `netlify.toml`, fallback SPA, manifest/service worker e headers de segurança. Configuração de build não é prova de que uma URL de produção já foi criada ou validada.

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

Fronteira da API:
- `src/infrastructure/orisGateway.ts`

Adaptador HTTP:
- `src/infrastructure/httpOrisGateway.ts`

Configuração:
- `src/infrastructure/integrationConfig.ts`

Seleção dinâmica do gateway:
- `src/infrastructure/gatewayFactory.ts`

## Motores e skills

Fontes upstream fixadas ficam em `vendor/`.

O agente deve navegar por:
- `docs/brain/INDEX.md`
- `docs/SKILL_ROUTER.md`
- `docs/RUNTIME.md`
- `ENGINE_MANIFEST.md`

## Segurança

- credencial offline protegida por PBKDF2 + AES-GCM;
- cache offline separado por integration realm;
- dados locais separados por integration realm + device + user + company;
- sessão ativa em `sessionStorage`;
- nenhuma chave privada de API/VAPID no navegador;
- respostas externas validadas em runtime;
- CSP e headers no Netlify;
- auditoria de dependências runtime no CI;
- submódulos fixados por SHA;
- nenhum segredo deve ser commitado.
