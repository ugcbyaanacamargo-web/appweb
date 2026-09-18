# appweb — Óris360° Vendas Mobile

Repositório do **App de Vendas Mobile Óris360°**, uma PWA React/TypeScript offline-first, além do motor de desenvolvimento assistido já mantido neste repositório.

## Óris360° Vendas

A aplicação foi construída para continuar operando comercialmente sem internet depois do primeiro login online e da primeira sincronização válida da empresa naquele aparelho.

### Funcionalidades implementadas

- login e criação de conta em modo DEMO;
- autenticação offline depois da primeira ativação válida;
- múltiplas empresas por usuário;
- isolamento local por aparelho + usuário + empresa;
- IndexedDB/Dexie;
- Pedidos com exatamente as abas **TODOS** e **NÃO ENVIADOS**;
- Orçamento → Pedido sem criar documento duplicado;
- salvamento local separado de geração e transmissão;
- transmissão somente por ação explícita;
- idempotência;
- bloqueio permanente no App após confirmação do servidor;
- duplicação de documento enviado sempre como novo Orçamento;
- clientes criados/editados offline;
- prevenção de duplicidade por CPF/CNPJ;
- produtos ativos, preço atual da base offline e regras de estoque;
- sincronização comercial manual e transacional;
- conta bloqueada preservando operação offline e envio explícito;
- Tarefas/Missões com execução offline e retorno automático permitido;
- localização operacional condicionada a conexão/permissão;
- Relatórios e Comissões online-only;
- Sistema Online online-only;
- Ajuda com contatos vindos de configuração central;
- IA no WhatsApp preparada para integração;
- PWA/service worker;
- configuração pronta para Netlify.

### Modo DEMO

Enquanto a API real Óris360° não estiver conectada, o App utiliza `DemoOrisGateway`, persistido no navegador.

Credenciais DEMO:

```text
vendedor@demo.oris360.local
demo1234
```

O modo DEMO possui duas empresas para testar isolamento de contexto e regras diferentes de estoque.

## API real

A interface externa é `src/infrastructure/orisGateway.ts`.

O ponto único para trocar o backend DEMO pela API real é:

```text
src/infrastructure/gatewayFactory.ts
```

O contrato completo da integração está em:

- `docs/API_INTEGRATION.md`

Nenhum endpoint, token, telefone ou e-mail oficial foi inventado.

## Aceite

A rastreabilidade dos 24 critérios funcionais está em:

- `docs/ACCEPTANCE_MATRIX.md`

Os testes cobrem domínio, isolamento, sincronização, transmissão, idempotência, cliente offline, missões, bloqueio, estoque e histórico local.

## Desenvolvimento

```bash
npm install
npm run dev
```

Testes:

```bash
npm run test:run
```

Build de produção:

```bash
npm run build
```

Saída:

```text
dist/
```

## Publicação no Netlify

O repositório já contém `netlify.toml`.

Configuração esperada:

```text
Build command: npm run build
Publish directory: dist
Node: 22
```

Ao importar este repositório no Netlify, a configuração é lida automaticamente.

O App inclui:
- fallback SPA;
- service worker;
- manifest PWA;
- headers de segurança;
- política de cache específica para o service worker.

## Arquitetura

- React 19
- TypeScript
- Vite
- Dexie / IndexedDB
- vite-plugin-pwa
- Vitest
- GitHub Actions
- Netlify-ready

## Motor do repositório

O projeto também mantém os motores/skills upstream em `vendor/` e o contrato de trabalho em:

- `AGENTS.md`
- `docs/SKILL_ROUTER.md`
- `docs/RUNTIME.md`
- `ENGINE_MANIFEST.md`

Para validar o motor:

```bash
python scripts/validate_engine.py
```

## Segurança

- credencial offline persistente protegida por PBKDF2 + AES-GCM;
- sessão ativa em `sessionStorage`;
- CSP e headers de segurança no Netlify;
- auditoria de dependências runtime no CI;
- submódulos fixados por SHA;
- nenhum segredo deve ser commitado no repositório.
