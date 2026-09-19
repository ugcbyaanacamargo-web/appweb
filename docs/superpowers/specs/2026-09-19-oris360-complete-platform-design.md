# Óris360° Sales App + Saboriza — Design de Integração

Data: 2026-09-19  
Status: ESPECIFICAÇÃO PARA REVISÃO DO USUÁRIO  
Autoridade funcional: `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`

## 1. Objetivo

Adaptar o `appweb` para que o **App de Vendas Mobile Óris360°** continue obedecendo literalmente ao Prompt Mestre e passe a ter como **Sistema Online oficial** o ecossistema Saboriza:

- App do vendedor: `https://oris360-site.netlify.app/`
- Sistema Online: `https://saboriza-catalogo.vercel.app/`
- fonte central de dados/autenticação do Saboriza: Supabase;
- repositório público identificado do Sistema Online: `Ruanzinn01/Saboriza-Catalogo`.

O App permanece offline-first. O Saboriza permanece online e administrativo.

## 2. Regra de autoridade

Em qualquer conflito:

1. o Prompt Mestre do Óris360° vence para o comportamento do App;
2. o Saboriza é reutilizado onde já possui funcionalidade compatível;
3. nenhuma limitação atual do Saboriza pode enfraquecer uma regra-mãe do App;
4. quando o Saboriza ainda não possui a capacidade exigida, a lacuna é tratada como integração/backend pendente — nunca como motivo para alterar o comportamento definido.

A especificação canônica do Prompt Mestre não será reescrita nem simplificada.

## 3. O que já existe e será preservado

### No Óris360° App

O `main` já possui:

- PWA React/TypeScript/Vite;
- IndexedDB/Dexie;
- isolamento local por dispositivo + usuário + empresa + ambiente de integração;
- primeiro acesso online e uso posterior offline;
- menu fixo de 10 itens;
- Pedidos com TODOS / NÃO ENVIADOS;
- Orçamento e Pedido local;
- SALVAR separado de GERAR PEDIDO e ENVIAR;
- idempotency key local;
- bloqueio depois do envio;
- duplicação como novo Orçamento;
- clientes offline;
- sincronização comercial manual/transacional;
- Missões offline;
- fluxo de retorno de Missão;
- Web Push no lado cliente;
- relatórios/Sistema Online/WhatsApp atrás do gateway;
- configuração de API genérica;
- CI, Vitest e Playwright.

Esses comportamentos não serão descartados nem reescritos sem necessidade.

### No Saboriza

O código público analisado já possui:

- Supabase Auth no painel administrativo;
- painel `/admin`;
- Produtos;
- Categorias;
- Clientes;
- Fornecedores;
- Pedidos;
- Itens de Pedido;
- Cupons;
- Indicadores;
- Configurações;
- RPCs `create_order` e `update_order_items`;
- catálogo público/Delivery;
- checkout.

Portanto, o Óris360° **não** criará um segundo CRUD de produto, cliente ou pedido para a empresa.

## 4. Fronteira definitiva do produto

### Óris360° App — vendedor

Responsável por:

- operação mobile;
- offline-first;
- base comercial local;
- clientes locais/pendentes;
- Orçamentos/Pedidos locais;
- envio explícito;
- Missões do vendedor;
- localização operacional;
- relatórios do próprio vendedor;
- abertura integrada do Sistema Online;
- Ajuda;
- IA no WhatsApp em nível previsto.

O menu continua exatamente:

1. Pedidos
2. Clientes
3. Produtos
4. Tarefas / Missões
5. IA no WhatsApp
6. Relatórios e Comissões
7. Sistema Online
8. Ajuda
9. Sincronizar
10. Sair da minha conta

### Saboriza — Sistema Online

Responsável por:

- administração central;
- produtos;
- categorias;
- clientes centrais;
- pedidos/documentos recebidos;
- configurações;
- indicadores;
- usuários/vendedores quando esse módulo for adicionado;
- carteira de clientes por vendedor;
- criação/atribuição de Missões;
- comissão;
- mapa da equipe;
- integrações empresariais.

## 5. Alternativas analisadas

### A. App falar diretamente com todas as tabelas Supabase

Vantagem: menos código de servidor.

Problemas:
- regras críticas ficariam distribuídas no navegador;
- idempotência e estoque seriam mais difíceis de proteger;
- multiempresa e permissões ficariam mais frágeis;
- segredos de WhatsApp/Push/IA não podem ficar no cliente.

**Não recomendado.**

### B. Manter a tela genérica com URL + 14 endpoints digitados manualmente

Vantagem: funciona com qualquer backend.

Problemas:
- não corresponde mais à realidade conhecida;
- é configuração técnica demais para vendedor;
- mantém o produto genérico quando já sabemos que o backend é Saboriza/Supabase.

**Manter somente como ferramenta de desenvolvimento/diagnóstico, não como experiência normal de produção.**

### C. Gateway específico Saboriza/Supabase atrás de `OrisGateway`

O App usa Supabase Auth e operações seguras via RPC/Edge Functions, mantendo toda regra local já implementada.

Vantagens:
- reaproveita o Saboriza;
- preserva o isolamento do domínio do App;
- permite transações no banco;
- permite RLS;
- mantém segredos server-side;
- permite Web Push/WhatsApp/SSO em Edge Functions;
- substitui a integração genérica sem contaminar UI/regra de negócio.

**DECISÃO: abordagem C.**

## 6. Estrutura técnica da integração

A UI e o domínio do App não acessam Supabase diretamente.

A composição continua em:

`src/infrastructure/gatewayFactory.ts`

Nova implementação futura:

```text
src/infrastructure/saboriza/
  saborizaClient.ts
  SaborizaOrisGateway.ts
  parsers.ts
  contracts.ts
```

Responsabilidades:

- `saborizaClient.ts`: cria o cliente Supabase usando somente URL + chave pública;
- `SaborizaOrisGateway.ts`: traduz os contratos Saboriza para `OrisGateway`;
- `parsers.ts`: valida respostas externas em runtime;
- `contracts.ts`: tipos do contrato remoto.

A lógica de negócio continua em `domain/` e `services/`.

## 7. Configuração de produção

Configuração pública permitida no frontend:

```text
VITE_SABORIZA_SUPABASE_URL
VITE_SABORIZA_SUPABASE_PUBLISHABLE_KEY
VITE_SABORIZA_ONLINE_URL=https://saboriza-catalogo.vercel.app
```

Nunca no navegador:

- secret/service-role key;
- senha do banco;
- chave privada VAPID;
- token WhatsApp;
- Meta App Secret;
- chave de IA;
- segredo de assinatura.

A documentação oficial do Supabase confirma que publishable/anon key pode ser usada no navegador com RLS correta, enquanto secret/service-role deve permanecer em ambiente controlado do servidor.

## 8. Autenticação e mesma conta

### Login do App

O App usará Supabase Auth do mesmo projeto do Saboriza.

Fluxo:

```text
e-mail + senha
→ Supabase Auth
→ usuário autenticado
→ buscar memberships/empresas
→ selecionar empresa
→ primeira sincronização obrigatória
→ base local válida
→ offline liberado
```

O primeiro login no aparelho continua exigindo internet.

### Criar uma conta

O botão CRIAR UMA CONTA continua significando **nova conta Óris360°**, nunca “criar vendedor”.

Necessita backend de provisionamento para:

- criar usuário;
- criar empresa/ambiente;
- criar vínculo owner;
- iniciar trial de 7 dias;
- registrar estado sem cobrança automática.

Esse fluxo só será marcado como real quando o backend Saboriza suportá-lo.

### Multiempresa

O Saboriza público atual não demonstra multiempresa.

Para cumprir o Prompt Mestre será necessário um modelo central equivalente a:

```text
companies
company_memberships
seller_profiles
```

Cada recurso comercial central deve ser associado a uma empresa ou derivado de um contexto server-side que determine a empresa.

O servidor nunca confiará somente em um `companyId` enviado pelo navegador.

## 9. Dados locais e histórico

Nada muda nas regras locais:

- IndexedDB continua sendo a base operacional offline;
- escopo inclui dispositivo + usuário + empresa + ambiente;
- logout não apaga IndexedDB;
- aparelho novo começa com ZERO Pedidos/Orçamentos locais;
- pedidos históricos do Saboriza nunca são baixados para o App;
- o snapshot comercial nunca contém histórico central de documentos.

## 10. Produtos e catálogo

### Fonte online

O Saboriza já possui:

- `products`;
- `categories`;
- `unit_price`;
- `is_active`;
- apresentação/embalagem;
- imagens;
- catálogo público.

Esses dados devem alimentar o snapshot do Óris360°.

### Uso no App

O vendedor:

- consulta;
- pesquisa;
- vê preço;
- vê estoque conhecido;
- usa produto na venda.

O vendedor não administra produto.

### Catálogo/Delivery

O fluxo “Adicionar produtos” deve utilizar os mesmos conceitos de catálogo do Saboriza/Delivery, mas renderizados a partir da base local para funcionar offline.

Não usar iframe do site online como catálogo offline.

A identidade visual Óris360° permanece própria; reaproveitar funcionalidade e dados, não copiar marca Saboriza.

### Estoque

O schema público analisado do Saboriza ainda não expõe estoque de produto.

O Prompt Mestre exige estoque e a regra Saboriza existente determina que saldo deve ser consequência de movimentações, não um campo manual.

Portanto:

- não adicionar um campo de estoque editável ao App;
- o snapshot deve consumir o saldo central calculado pelo módulo de estoque do Saboriza;
- enquanto esse saldo oficial não existir, a integração real não atende R11/R24/R25 e não pode ser declarada completa.

## 11. Clientes

### Fonte central

O Saboriza possui `customers`, mas o schema público atual é centrado em CNPJ.

O Prompt Mestre exige CPF/CNPJ.

A camada central deverá suportar identificador fiscal normalizado suficiente para CPF e CNPJ sem quebrar os dados já existentes.

### Fluxos obrigatórios

- criar cliente offline;
- editar cliente offline;
- usar imediatamente;
- enviar cliente antes de documento relacionado;
- no sync geral, processar pendências de cliente primeiro;
- deduplicar dentro da mesma empresa;
- conflito usa timestamp mais recente;
- vendedor não exclui/inativa pelo App.

### Carteira por vendedor

O Saboriza atual não possui associação cliente-vendedor.

Será necessária estrutura central para definir quais clientes pertencem ao vendedor.

O snapshot retorna somente a carteira autorizada + regras necessárias.

## 12. Orçamento e Pedido

O App preserva integralmente:

- nova operação sempre Orçamento;
- SALVAR não envia;
- GERAR PEDIDO não envia;
- envio somente por ação explícita;
- conversão é definitiva;
- documento enviado é bloqueado;
- duplicação gera novo Orçamento;
- reenvio manual usa mesma idempotency key.

### Adaptação do Saboriza

O Saboriza atual possui `orders` e `order_items`, mas não expõe no schema versionado um tipo Orçamento/Pedido compatível com o Prompt Mestre.

A integração server-side precisará representar ambos os tipos sem apagar a estrutura existente.

O contrato central precisa armazenar, no mínimo:

- tipo: quote/order;
- vendedor;
- empresa;
- identificador local;
- idempotency key;
- número oficial;
- itens aceitos;
- campos complementares;
- origem Óris360°;
- timestamps.

A solução concreta no banco deve ser aditiva e revisada contra dados reais antes de migration.

## 13. Idempotência

A garantia real pertence ao servidor.

A operação de envio deve ter uma restrição única equivalente a:

```text
empresa + idempotency_key
```

Repetir a mesma transmissão devolve o documento oficial já criado.

Timeout depois de gravação nunca cria um segundo documento.

## 14. Preço e estoque

### Preço

No App:

- sempre reprecificar documento não enviado com a base offline mais atual;
- duplicação usa preço atual local.

No servidor:

- Orçamento preserva quantidade e não movimenta estoque;
- Pedido aplica regra de estoque.

### Venda sem estoque

A configuração central deve expor:

`allowSaleWithoutStock`

Se NÃO:

- servidor valida saldo atual;
- reduz item até o saldo;
- item zero é removido;
- outros itens continuam;
- devolve itens finais aceitos.

Se SIM:

- mantém quantidade solicitada conforme regra empresarial.

## 15. Sincronização comercial

O botão SINCRONIZAR continua sendo manual.

Fluxo definitivo:

```text
1. confirmar internet/autenticação
2. verificar estado da conta
3. enviar clientes pendentes individualmente
4. solicitar snapshot comercial
5. validar snapshot completo
6. gravar staging local
7. ativar snapshot atomicamente
8. atualizar data/hora da última sincronização bem-sucedida
```

Nunca envia Pedido/Orçamento.

### Snapshot central

Preferência: uma função/RPC transacional que devolva um único snapshot consistente, porque múltiplas consultas independentes podem enxergar versões diferentes da base.

Conteúdo:

- clientes autorizados;
- produtos ativos;
- preços;
- saldo de estoque calculado;
- categorias/catálogo;
- `allowSaleWithoutStock`;
- `accountBlocked`;
- contatos de Ajuda;
- VAPID pública;
- campos de cliente;
- demais configurações indispensáveis.

Nunca incluir histórico central de Pedidos/Orçamentos.

## 16. Conta bloqueada

Estado central precisa distinguir:

- conta ativa;
- trial expirado/bloqueado.

Bloqueada:

- não pode obter novo snapshot comercial;
- mantém última base local;
- vendedor continua offline;
- envio explícito de Pedido/Orçamento continua permitido.

O backend de envio não pode reutilizar a mesma trava usada no snapshot.

## 17. Tarefas / Missões

O Saboriza público atual não apresenta módulo de Missões.

Será necessário adicionar ao ecossistema central:

- Missão;
- destinatário/vendedor;
- status;
- prazo;
- evidências/requisitos;
- retorno;
- timestamps.

O vendedor vê somente as Missões destinadas a ele.

Depois de recebida, a Missão permanece local e executável offline.

Retorno pode subir automaticamente ao reconectar.

## 18. Notificação automática de Missões

Web Push permanece exceção autorizada.

O App já possui o lado cliente da `PushSubscription`.

Backend precisa:

- persistir subscription por usuário/dispositivo;
- disparar push quando Missão for atribuída;
- manter chave VAPID privada server-side;
- abrir a área de Missões ao tocar na notificação.

Produtos, preços, clientes e estoque não usam esse canal para sincronização automática.

## 19. Localização / Mapa da Equipe

App:

- envia localização somente autenticado + online + permissão;
- localização de evidência pode ficar pendente offline.

Saboriza:

- precisa armazenar última localização operacional por vendedor;
- precisa de visualização administrativa do mapa;
- precisa de política de retenção.

A PWA continua sujeita às limitações reais de Android/iOS para execução em segundo plano.

## 20. Relatórios e Comissões

O Saboriza já possui indicadores gerais, mas não possui no schema público:

- vendedor associado ao documento;
- percentual de comissão;
- relatório seller-scoped.

Necessário:

- vínculo do documento ao vendedor;
- comissão configurada no perfil do vendedor;
- função/endpoint que devolva somente dados permitidos ao vendedor autenticado;
- visão administrativa no Saboriza.

O App não calcula sozinho a condição comercial que torna uma venda elegível para comissão; a fonte central decide.

## 21. Sistema Online

URL oficial:

`https://saboriza-catalogo.vercel.app/`

O botão SISTEMA ONLINE não deve abrir um endereço genérico.

### Login integrado

Como Netlify e Vercel são origens diferentes, a sessão de navegador não é automaticamente compartilhada.

Manter o contrato já existente `createOnlineSession`.

Fluxo recomendado:

```text
App autenticado
→ servidor cria código SSO curto e de uso único
→ abre Saboriza com código
→ Saboriza troca código por sessão
→ código é invalidado
```

Não colocar access token reutilizável na URL.

## 22. IA no WhatsApp

O Prompt Mestre exige somente integração prevista nesta etapa.

No App:

- mostrar estado fornecido pelo backend;
- abrir gerenciamento quando autorizado.

No Saboriza/backend:

- conexão WhatsApp Business;
- webhook;
- segredos;
- IA;
- regras de capacidade.

Esses segredos nunca entram no frontend.

## 23. Ajuda

Contatos Óris360° devem ser centrais e configuráveis.

O App recebe no snapshot:

- telefone/WhatsApp oficial;
- e-mail oficial.

Nenhum valor será inventado.

## 24. Experiência de configuração

A tela atual “CONFIGURAR INTEGRAÇÃO” será reclassificada:

### Produção

- integração Saboriza pré-configurada por ambiente;
- vendedor não digita URL ou rotas;
- tela normal mostra apenas estado da conexão/diagnóstico.

### Desenvolvimento/diagnóstico

A configuração HTTP genérica pode permanecer disponível de forma avançada para testes e ambientes não produtivos.

Ela não faz parte do menu fixo de 10 itens.

## 25. Backend Saboriza necessário

Capacidades ausentes ou não comprovadas no schema público atual:

1. multiempresa/memberships;
2. perfil de vendedor;
3. comissão por vendedor;
4. carteira cliente-vendedor;
5. CPF e CNPJ de forma compatível;
6. status/trial/bloqueio da conta;
7. saldo de estoque oficial para snapshot;
8. configuração permitir venda sem estoque;
9. documento central com quote/order + idempotência;
10. snapshot comercial transacional;
11. upsert de cliente com deduplicação/timestamp;
12. Missões/atribuições/evidências;
13. Push subscriptions e envio Web Push;
14. localização operacional;
15. relatório seller-scoped;
16. SSO one-time exchange;
17. contatos oficiais de Ajuda;
18. estado da integração WhatsApp/IA.

Essas capacidades devem ser implementadas no ecossistema Saboriza/Supabase, não simuladas no App.

## 26. Segurança

Regras obrigatórias:

- RLS em todo dado exposto ao cliente;
- `auth.uid()`/claims para identificar usuário;
- membership validada server-side;
- operação sensível via RPC/Edge Function;
- publishable key pode estar no browser somente com RLS;
- secret/service-role nunca no browser;
- validar todos os payloads recebidos;
- não confiar em companyId, sellerId, preço ou estoque enviados pelo cliente como autoridade;
- idempotência garantida pelo banco;
- logs sem senha/token/segredo;
- URLs externas somente HTTPS em produção.

## 27. Estados de erro

O App deve distinguir:

- offline;
- autenticação inválida;
- conta bloqueada;
- timeout/rede;
- servidor indisponível;
- resposta inválida;
- permissão negada;
- integração não configurada.

Falhas de integração nunca apagam a última base comercial válida.

## 28. Plano de adaptação visual futura

Sem alterar o menu fixo:

- Pedidos permanece Home;
- Produtos evolui de lista simples para catálogo móvel compatível com os dados Saboriza;
- Clientes usa os campos centrais reais do Saboriza;
- Sistema Online abre o Saboriza;
- Relatórios usa dados seller-scoped;
- IA no WhatsApp vira estado/entrada para gestão no Saboriza;
- Tarefas/Missões mantém execução mobile;
- Configuração técnica deixa de ser uma tarefa do vendedor.

A identidade visual continua Óris360°.

## 29. Matriz online/offline

Permanece exatamente a do Prompt Mestre:

| Função | Offline | Online |
|---|---|---|
| Criar/editar cliente | Sim | Sim |
| Consultar produtos/catálogo | Sim | Sim |
| Criar Orçamento/Pedido | Sim | Sim |
| Salvar | Sim | Sim |
| Gerar Pedido | Sim | Sim |
| Enviar documento | Não | Sim, manual |
| Sincronizar base | Não | Sim, manual |
| Receber nova Missão em tempo real | Não | Sim |
| Executar Missão recebida | Sim | Sim |
| Retornar Missão | Pendente | Pode ser automático |
| Relatórios/Comissões | Não | Sim |
| Sistema Online | Não | Sim |
| Rastreamento em tempo real | Não | Sim |

## 30. Regras-mãe

As 20 regras R1–R20 do Prompt Mestre são invariantes de arquitetura.

Nenhuma integração Saboriza poderá alterar:

- sync manual;
- envio explícito;
- histórico local por aparelho;
- documento enviado bloqueado;
- duplicação como Orçamento;
- preço da base offline atual;
- estoque conforme política;
- Orçamento sem estoque;
- isolamento usuário/empresa/dispositivo;
- logout preservando base;
- bloqueio sem destruir offline;
- deduplicação fiscal;
- idempotência;
- preservação da última base válida.

## 31. Critérios de aceite

Os testes 1–24 continuam obrigatórios.

A integração Saboriza adiciona estes critérios:

S1. Produção não exige que vendedor digite URL/rotas de API.  
S2. Login do App usa a mesma identidade central utilizada pelo ecossistema Saboriza.  
S3. Snapshot usa somente dados da empresa/vendedor autorizados.  
S4. Snapshot nunca retorna `orders`/histórico central.  
S5. Produto/preço/ativo vêm da fonte Saboriza.  
S6. Estoque vem da fonte central calculada, não de campo manual inventado no App.  
S7. Cliente offline sincronizado aparece no Sistema Online sem duplicar CPF/CNPJ.  
S8. Pedido/Orçamento enviado explicitamente aparece no Sistema Online e reenvio é idempotente.  
S9. Documento de outro vendedor/empresa não é acessível indevidamente.  
S10. Missão criada no Sistema Online chega somente ao vendedor destinado.  
S11. Retorno de Missão offline aparece no Sistema Online após reconexão.  
S12. Relatório do vendedor contém somente seus dados.  
S13. Sistema Online abre `saboriza-catalogo.vercel.app` via handoff seguro.  
S14. Nenhum secret/service-role aparece no bundle do App.  
S15. Conta bloqueada não sincroniza snapshot, mas ainda pode enviar documento explicitamente.  
S16. Queda durante snapshot conserva integralmente a base anterior.

## 32. Ordem de implementação

Preservar as cinco fases do Prompt Mestre.

### FASE 1 — Fundação

- criar `SaborizaOrisGateway`;
- autenticação Supabase;
- memberships/empresa ativa;
- configuração de produção;
- primeira sincronização;
- isolamento local por realm Saboriza.

### FASE 2 — Operação Comercial

- mapear Cliente Saboriza ↔ Cliente Óris;
- mapear Produto/Categoria Saboriza ↔ catálogo local;
- integrar experiência de catálogo offline;
- preço/ativo;
- fonte central de estoque;
- regras locais de estoque/preço.

### FASE 3 — Transmissão

- RPC/API de cliente relacionado;
- RPC/API de documento;
- idempotência central;
- número oficial;
- quantidades aceitas;
- bloqueio/duplicação já existentes no App.

### FASE 4 — Sincronização

- pendências de cliente;
- snapshot transacional;
- conta bloqueada;
- última sync;
- falhas parciais de cliente.

### FASE 5 — Integrações

- Missões;
- Web Push;
- localização;
- comissão/relatório;
- SSO Saboriza;
- Ajuda;
- WhatsApp/IA em nível previsto.

## 33. Dependências para implementação real

Para conectar a produção depois da aprovação deste design serão necessários:

- URL do projeto Supabase do Saboriza;
- publishable key do projeto;
- acesso autorizado ao Supabase para migrations/RLS/RPC/Edge Functions;
- confirmação de ambiente seguro de teste antes de alterar dados de produção;
- contatos oficiais de Ajuda;
- regra oficial de quando a comissão é considerada elegível;
- credenciais server-side de WhatsApp/IA apenas quando essa integração for implementada;
- VAPID privada apenas no backend.

Não enviar secret/service-role em conversa ou código frontend.

## 34. Não objetivos

Não fazer nesta adaptação:

- criar CRUD de produto no App;
- criar CRUD administrativo duplicado do Saboriza;
- baixar histórico central;
- enviar documento automaticamente;
- sincronizar base automaticamente;
- inventar estoque;
- inventar SKU/código externo não exigido pelo Prompt Mestre;
- inventar contatos;
- inventar comissão;
- expor segredo;
- modificar o repositório Saboriza sem autorização explícita e acesso correspondente.

## 35. Prova antes de conclusão

Nenhuma fase poderá ser chamada de concluída apenas porque uma tela existe.

Cada fase futura exige:

- teste de domínio/serviço;
- TDD quando aplicável;
- Playwright do fluxo humano;
- lint/typecheck/build;
- CI;
- comparação com R1–R20;
- comparação com testes 1–24;
- critérios S1–S16 quando relacionados;
- produção verificada depois de deploy quando houver integração real.
