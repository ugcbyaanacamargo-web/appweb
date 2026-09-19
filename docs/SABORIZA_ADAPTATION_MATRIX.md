# Matriz de adaptação Óris360° ↔ Saboriza

Data: 2026-09-19

Autoridade funcional: `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`  
Design atual: `docs/superpowers/specs/2026-09-19-oris360-complete-platform-design.md`

| Área | Óris360° hoje | Saboriza hoje | O que falta para produção |
|---|---|---|---|
| Menu fixo / mobile | Implementado | Não se aplica | preservar exatamente 10 itens |
| Primeiro login / offline | Implementado com gateway + cache local | Supabase Auth no admin | usar o mesmo Supabase Auth e memberships reais |
| Criar conta / trial | DEMO/contrato | não comprovado | provisionamento de empresa + owner + trial 7 dias |
| Multiempresa | local já isolado por empresa | não comprovado | companies + memberships + RLS |
| Banco local | Dexie/IndexedDB | não se aplica | preservar |
| Histórico local | implementado | orders centrais existem | snapshot não pode baixar orders |
| Clientes offline | implementado | customers existe | mapear schema real + CPF/CNPJ + carteira vendedor |
| Produtos | leitura local implementada | products/categories existe | adapter + catálogo offline coerente |
| Preço | implementado | unit_price existe | mapear fonte |
| Produto ativo | implementado | is_active existe | mapear fonte |
| Estoque | regra local implementada | saldo central não exposto no schema público | fonte oficial calculada antes de ativar integração real |
| Venda sem estoque | regra local implementada | configuração não comprovada | configuração central + validação server-side |
| Orçamento | implementado localmente | tipo orçamento não comprovado | contrato central para quote |
| Pedido | implementado localmente | orders/order_items existe | adaptar envio preservando estrutura existente |
| Idempotência | chave local implementada | garantia central não comprovada | unique constraint/RPC por empresa + key |
| Número oficial | cliente preparado | order_number existe | resposta oficial para quote/order |
| Sync manual | implementado | snapshot dedicado não existe | RPC transacional |
| Conta bloqueada | implementado localmente | estado de conta não comprovado | estado/trial/bloqueio central |
| Missões offline | implementado cliente | módulo não encontrado | tabelas/API + atribuição vendedor |
| Push Missões | cliente implementado | sender não encontrado | subscriptions + VAPID privada + sender |
| Localização | cliente implementado | mapa não encontrado | armazenamento + consulta administrativa |
| Relatório vendedor | gateway implementado | indicadores gerais existem | seller_id + comissão + RPC seller-scoped |
| Sistema Online | gateway SSO implementado | site Vercel existe | one-time handoff para Saboriza |
| IA WhatsApp | status/management gateway | WhatsApp comercial simples existe | integração/estado server-side quando implementada |
| Ajuda | cliente suporta contatos centrais | contatos empresariais existem | contatos oficiais Óris360° separados/configuráveis |
| Configuração API | tela técnica genérica | Supabase conhecido | produção pré-configurada; tela técnica só diagnóstico |

## Reutilização obrigatória

Reutilizar do Saboriza:
- Supabase Auth;
- Produtos;
- Categorias;
- Clientes;
- Pedidos;
- Itens;
- Configurações;
- Indicadores quando compatíveis;
- catálogo/Delivery como fonte funcional.

Não duplicar esses módulos administrativamente dentro do `appweb`.

## Lacunas de backend que bloqueiam integração completa

1. multiempresa;
2. vendedor/membership;
3. carteira de clientes;
4. CPF/CNPJ compatível;
5. estoque oficial calculado;
6. regra permitir venda sem estoque;
7. Orçamento central;
8. idempotência central;
9. snapshot transacional;
10. conta/trial/bloqueio;
11. Missões;
12. Push server-side;
13. localização/mapa;
14. comissão por vendedor;
15. SSO;
16. contatos oficiais Óris360°;
17. estado/configuração IA WhatsApp.

## Regra de status

Enquanto uma lacuna necessária não tiver backend real, o App:
- mantém DEMO explicitamente identificado;
- preserva o contrato;
- não apresenta integração falsa;
- não enfraquece o Prompt Mestre.
