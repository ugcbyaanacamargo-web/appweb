# Óris360° — Integração real com Saboriza/Supabase

Autoridade funcional: `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`

Sistema Online oficial:
- `https://saboriza-catalogo.vercel.app/`

Fonte central conhecida:
- Supabase usado pelo Saboriza.

Design:
- `docs/superpowers/specs/2026-09-19-oris360-complete-platform-design.md`

Matriz de lacunas:
- `docs/SABORIZA_ADAPTATION_MATRIX.md`

## Regra principal

O App não inventa uma API própria nem duplica o painel Saboriza.

A integração real deve entrar pela fronteira existente:

`src/infrastructure/orisGateway.ts`

A composição permanece em:

`src/infrastructure/gatewayFactory.ts`

A implementação futura será específica do Saboriza/Supabase e traduzirá o backend real para o contrato `OrisGateway`.

## Configuração de produção

Variáveis públicas permitidas:

```text
VITE_SABORIZA_SUPABASE_URL
VITE_SABORIZA_SUPABASE_PUBLISHABLE_KEY
VITE_SABORIZA_ONLINE_URL=https://saboriza-catalogo.vercel.app
```

Nunca expor no frontend:

- service-role/secret key;
- senha do banco;
- VAPID privada;
- token WhatsApp;
- Meta App Secret;
- chave de IA;
- segredo de assinatura.

A configuração HTTP genérica atual pode continuar disponível somente para desenvolvimento/diagnóstico. Em produção, o vendedor não deve preencher manualmente URL e rotas.

## Autenticação

O objetivo é usar a mesma identidade central do Saboriza.

Fluxo esperado:

```text
Supabase Auth
→ usuário
→ memberships/empresas
→ empresa ativa
→ primeira sincronização
→ base local válida
→ operação offline
```

O backend ainda precisa suportar multiempresa/membership para cumprir o Prompt Mestre.

## Snapshot comercial

A sincronização comercial continua manual.

O backend deve fornecer um snapshot consistente contendo:

- clientes autorizados;
- produtos ativos;
- categorias/catálogo;
- preço;
- estoque oficial calculado;
- `allowSaleWithoutStock`;
- `accountBlocked`;
- contatos de Ajuda;
- VAPID pública;
- campos adicionais de cliente;
- demais configurações necessárias ao offline.

Nunca incluir histórico central de Pedidos/Orçamentos.

Preferência: RPC/função transacional que produza o snapshot inteiro.

## Clientes

A integração precisa:

- aceitar cliente novo/editado;
- deduplicar CPF/CNPJ dentro da empresa;
- devolver ID oficial;
- respeitar timestamp mais recente;
- preservar regra de inativação central;
- associar cliente ao vendedor/carteira quando aplicável.

O App transmite cliente relacionado antes do documento.

## Pedido / Orçamento

A operação server-side deve:

- aceitar quote/order;
- aceitar idempotency key;
- garantir unicidade por empresa;
- preservar Orçamento sem movimentar/reservar estoque;
- validar estoque somente para Pedido quando necessário;
- devolver quantidades finais aceitas;
- devolver número oficial;
- devolver confirmação inequívoca.

O App só marca `sent` depois da confirmação.

## Estoque

O App não inventará saldo.

O Saboriza deverá fornecer saldo oficial calculado pelo seu módulo central de estoque/movimentações.

Se `allowSaleWithoutStock = false`, a validação atual do servidor no momento do envio é obrigatória.

## Conta bloqueada

Snapshot/sincronização comercial:
- bloquear.

Operação offline com base válida:
- preservar.

Envio explícito de Pedido/Orçamento:
- permitir conforme Prompt Mestre.

As duas autorizações não podem ser tratadas como a mesma regra.

## Missões

Backend necessário:

- criar/atribuir Missão;
- listar somente Missões do vendedor;
- receber retorno/evidências;
- armazenar PushSubscription;
- enviar Web Push server-side.

Retorno de Missão pode ser automático ao reconectar.

## Relatórios e Comissões

O servidor deve devolver apenas dados do vendedor autenticado.

A fonte central precisa associar documentos ao vendedor e manter a comissão configurada no perfil.

A regra de elegibilidade da comissão continua sendo uma decisão central, não do App.

## Sistema Online / SSO

Destino:

`https://saboriza-catalogo.vercel.app/`

Como Netlify e Vercel são origens diferentes, não presumir compartilhamento de sessão do navegador.

Manter o contrato `createOnlineSession` para gerar handoff curto/de uso único.

Nunca colocar access token reutilizável em URL.

## IA no WhatsApp

O App consome apenas:
- disponibilidade;
- status;
- URL de gerenciamento autorizada.

Webhook, tokens, IA e segredos permanecem server-side.

## Segurança

- RLS em dados acessíveis ao cliente;
- membership validada pelo servidor;
- operações sensíveis em RPC/Edge Function;
- payload externo validado;
- companyId/sellerId/preço/estoque enviados pelo cliente não são autoridade;
- idempotência garantida no banco;
- CORS/origens restritos;
- secrets fora do bundle.

## Dependências ainda necessárias para implementação real

1. URL do projeto Supabase Saboriza;
2. publishable key;
3. acesso autorizado ao projeto para migrations/RLS/RPC/Edge Functions;
4. ambiente de teste seguro;
5. implementação das lacunas listadas em `docs/SABORIZA_ADAPTATION_MATRIX.md`;
6. contatos oficiais de Ajuda;
7. regra oficial de comissão;
8. VAPID privada no servidor quando Push for ativado;
9. credenciais server-side WhatsApp/IA quando essa integração for ativada.

Não enviar secret/service-role pelo chat nem salvar em `VITE_*`.
