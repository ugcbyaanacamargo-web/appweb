# Óris360° Full Platform — Design

Data: 2026-09-19
Status: DIREÇÃO APROVADA PELO PEDIDO DE CONTINUIDADE DE 2026-09-19
Base: seller PWA atual no main, já com configuração de API, recuperação de senha, relatórios via gateway, sessão online, status do WhatsApp, Web Push, campos dinâmicos de cliente e CI/E2E. A expansão abaixo completa o lado empresarial sem quebrar o App do Vendedor.

## 1. Problema observado

O main atual implementa corretamente o núcleo offline do App do Vendedor, mas não constitui sozinho uma plataforma empresarial completa.

Os sintomas relatados pelo usuário têm uma causa arquitetural comum:

- não existe uma superfície administrativa real para empresa;
- OrisGateway atual não expõe operações administrativas;
- DemoOrisGateway persiste no navegador, portanto não sincroniza aparelhos reais;
- não há cadastro/gestão central de vendedores;
- não há CRUD central de produtos/SKU/preço/estoque;
- não há atribuição central de clientes a vendedores;
- não há criação/atribuição central de Missões;
- Relatórios/Comissões já consultam o gateway, mas não existe painel central da empresa;
- Sistema Online já solicita sessão pelo gateway, mas não existe ainda o painel interno completo nem SSO real externo;
- IA no WhatsApp já consulta status pelo gateway, mas não existe gerenciamento empresarial nem provedor/webhook/credenciais reais.

Conclusão: os fluxos técnicos já preparados não devem ser confundidos com produto empresarial completo. A plataforma precisa de uma segunda superfície — Sistema Online / Painel da Empresa — e de um contrato central compartilhado com o App do Vendedor.

## 2. Classificação

Mudança arquitetural.

Ela adiciona novos subsistemas e novos contratos que afetam autenticação, modelo de dados, sincronização, permissões, relatórios e integrações externas.

## 3. Abordagens consideradas

### A. Manter somente o App do Vendedor e depender de um Sistema Online externo

Vantagens:
- menor código no appweb;
- evita duplicar um ERP já existente.

Desvantagens:
- o produto continua inutilizável sozinho;
- todos os sintomas relatados permanecem dependentes de uma plataforma que ainda não foi fornecida;
- não existe lugar para cadastrar vendedor/produto/missão/comissão.

### B. Mesmo repositório, duas superfícies, mesmo domínio — RECOMENDADA

Superfícies:
1. App do Vendedor — mobile-first, offline-first, menu fixo atual.
2. Sistema Online / Painel da Empresa — responsivo/desktop-first, administrativo e online.

As duas superfícies usam o mesmo domínio e um gateway central. O modo DEMO usa um servidor simulado; a API real substitui somente o adaptador.

Vantagens:
- produto demonstrável ponta a ponta;
- regras comerciais ficam em um único lugar;
- empresa controla vendedor, produto, cliente, missão e comissão;
- caminho de integração com API real fica explícito;
- não quebra as 20 regras-mãe do App do Vendedor.

### C. Criar imediatamente um backend completo próprio

Exemplo: Postgres/Supabase + API/Netlify Functions.

Vantagens:
- sincronização real entre aparelhos desde já.

Desvantagens:
- exige conta/credenciais/infraestrutura externa;
- usuário declarou que conectará a API depois;
- introduzir um backend arbitrário agora pode conflitar com a futura API Óris360°.

Decisão: implementar a abordagem B. O backend real fica atrás do contrato; quando disponível, ele substitui o demo.

## 4. Superfície 1 — App do Vendedor

O menu global continua exatamente com os 10 itens definidos na especificação original.

O vendedor pode:
- trabalhar offline após primeira base válida;
- criar/editar clientes permitidos;
- consultar catálogo/produtos ativos;
- criar Orçamento/Pedido;
- salvar localmente;
- enviar documento explicitamente;
- receber/executar Missões;
- consultar seus relatórios quando online;
- abrir Sistema Online conforme sua permissão;
- usar IA no WhatsApp quando a integração estiver habilitada.

O vendedor não administra produto, preço, estoque, outros vendedores, permissões, comissão de outros vendedores ou definição de Missões para terceiros.

## 5. Superfície 2 — Sistema Online / Painel da Empresa

Nova superfície administrativa no mesmo projeto, acessada por usuário autorizado.

### Navegação administrativa

1. Dashboard
2. Vendedores e Usuários
3. Produtos e Estoque
4. Clientes
5. Missões
6. Pedidos e Orçamentos Online
7. Relatórios e Comissões
8. Mapa da Equipe
9. IA no WhatsApp
10. Configurações / Integrações

Essa navegação não altera o menu fixo do App do Vendedor.

### Permissões

Papéis mínimos:
- owner
- admin
- manager
- seller

O backend real deve ser a autoridade de autorização. A UI apenas reflete permissões.

## 6. Vendedores e usuários

O painel deve permitir:
- criar/convidar vendedor;
- editar nome/e-mail/dados operacionais;
- ativar/inativar acesso;
- definir papel;
- definir percentual de comissão;
- vincular uma ou mais empresas;
- atribuir clientes;
- atribuir Missões;
- visualizar indicadores daquele vendedor.

Modelo conceitual:
User
Company
CompanyMembership(userId, companyId, role, active)
SellerProfile(userId, companyId, commissionPercent)

No modo DEMO, criação de vendedor gera uma credencial de teste apenas para demonstração.

Na API real, senha deve ser tratada pelo provedor de autenticação/backend, nunca pelo admin em texto puro.

## 7. Produtos, SKU, preço e estoque

### Painel da empresa

Deve permitir:
- criar produto manualmente;
- SKU obrigatório e único dentro da empresa;
- buscar produto existente por nome/SKU;
- editar descrição;
- ativar/inativar;
- preço;
- estoque;
- unidade;
- código de barras opcional;
- imagem opcional.

### Busca por SKU

Existem dois conceitos distintos:

1. Busca interna — procurar SKU já cadastrado na empresa. Será funcional sem integração externa.
2. Busca externa — digitar um SKU/EAN e obter nome/imagem/dados de um catálogo externo. Isso exige um provedor de catálogo externo e não deve ser inventado.

O App do Vendedor permanece somente leitura para produto.

## 8. Clientes e carteira por vendedor

O painel da empresa enxerga todos os clientes da empresa.

Deve permitir:
- cadastrar/editar/inativar;
- pesquisar CPF/CNPJ;
- atribuir um cliente a um ou vários vendedores;
- reatribuir carteira;
- visualizar vendedor responsável.

Regra padrão proposta:
- cliente criado offline por vendedor fica imediatamente utilizável por ele;
- quando sincronizado, fica associado ao vendedor que o criou;
- admin pode alterar a atribuição depois;
- um cliente pode ser compartilhado com múltiplos vendedores quando a empresa permitir.

Snapshot do vendedor baixa somente a carteira autorizada + clientes criados localmente ainda pendentes.

## 9. Missões

### Painel

Admin/manager pode:
- criar Missão;
- título;
- descrição;
- prazo;
- prioridade;
- vendedor(es) destinatário(s);
- cliente relacionado opcional;
- requisitos de evidência;
- foto obrigatória opcional;
- localização obrigatória opcional;
- observação;
- status;
- cancelar/reabrir conforme permissão.

### App do vendedor

Recebe somente Missões destinadas a ele.

Estados:
assigned
received
in_progress
completed_local
returned
cancelled

Missão recebida continua executável offline.

Retorno pode subir automaticamente ao recuperar conexão.

## 10. Push de Missões

A PWA já possui service worker. Para push real, o backend precisa armazenar uma PushSubscription do vendedor e enviar Web Push quando uma Missão for atribuída.

O canal de push é exclusivo de eventos autorizados, como Missões. Ele não dispara sincronização comercial automática.

## 11. Sincronizar — significado exato

O botão SINCRONIZAR do App do Vendedor executa somente sincronização comercial manual.

Fluxo:
1. verificar internet;
2. validar conta/empresa;
3. enviar clientes novos/editados pendentes;
4. processar cada cliente independentemente;
5. baixar snapshot comercial autorizado para aquele vendedor:
   - clientes da carteira;
   - produtos ativos;
   - preços;
   - estoque;
   - configurações;
   - regra de venda sem estoque;
   - contatos de Ajuda;
6. validar snapshot em staging;
7. ativar atomicamente;
8. atualizar última sincronização concluída somente depois do sucesso.

Não faz:
- não envia Pedido;
- não envia Orçamento;
- não baixa histórico central;
- não baixa documentos de outro aparelho;
- não é o canal de Missões em tempo real.

## 12. Pedidos/Orçamentos no painel

O Sistema Online pode exibir todos os documentos que chegaram ao servidor, respeitando permissões.

Isso não viola a regra do App: o painel usa a base central; o App do Vendedor continua sem baixar histórico central.

Admin pode:
- pesquisar por vendedor/cliente/data/status;
- consultar documento;
- continuar fluxo de faturamento no backend real;
- visualizar origem/aparelho/idempotency key quando necessário para suporte.

## 13. Relatórios e comissões

Fonte de verdade: documentos centrais confirmados.

Painel:
- vendas por vendedor;
- quantidade de pedidos;
- ticket médio;
- comissão calculada;
- filtros de período;
- status de pagamento da comissão quando o backend suportar.

Vendedor:
- somente os próprios números.

Cálculo inicial:
commission = eligibleSalesAmount * sellerCommissionPercent / 100

A definição de eligibleSalesAmount deve vir do backend real. O frontend não deve inventar se comissão nasce em pedido enviado, faturado ou pago.

## 14. Sistema Online e login integrado

### Quando painel e App usam a mesma origem

Recomendado para a primeira versão:
- o botão Sistema Online abre a rota administrativa/online do próprio projeto;
- reaproveita a sessão atual;
- nenhuma senha é digitada novamente;
- backend valida papel e empresa ativa.

### Quando Sistema Online está em outro domínio

Exigir endpoint de SSO:
1. App autenticado solicita código SSO curto e de uso único;
2. backend gera código com expiração curta, usuário e empresa;
3. navegador abre Sistema Online com o código;
4. Sistema Online troca o código por sua própria sessão;
5. código não pode ser reutilizado.

Não colocar access token persistente em query string.

## 15. IA no WhatsApp

A tela deixa de ser placeholder e vira área de integração/configuração.

### O que o painel precisa administrar

- status da conexão;
- número conectado;
- identidade da empresa;
- ativar/desativar IA;
- horário de atendimento;
- mensagem de fallback;
- quais capacidades a IA pode usar.

### Integrações externas necessárias

Para produção são necessários:

WhatsApp Business Platform ou provedor BSP:
- conta Meta Business;
- WhatsApp Business Account (WABA);
- Phone Number ID;
- credencial/token de servidor;
- App Secret;
- webhook público HTTPS;
- verify token de webhook;
- assinatura/validação das notificações.

Provedor de IA:
- API key do provedor escolhido;
- modelo/configuração;
- política de custo/limite.

Segredos ficam somente no backend/deploy, nunca no navegador.

### Ferramentas da IA

A IA pode receber ferramentas server-side com permissões explícitas:
- consultar produto/preço/estoque;
- localizar cliente;
- consultar status de pedido;
- criar lead;
- preparar orçamento;
- encaminhar para humano.

Ações de alto impacto devem exigir confirmação/política do backend.

## 16. Mapa da Equipe

Painel mostra última localização operacional conhecida de vendedores autorizados.

Backend recebe:
- sellerId;
- companyId;
- latitude/longitude;
- capturedAt;
- accuracy opcional.

Regras:
- consentimento/permissão do dispositivo;
- online;
- retenção definida pela empresa;
- nenhum rastreamento offline em tempo real;
- limitações de background da PWA permanecem.

## 17. Gateway da plataforma

O OrisGateway atual é estreito demais para o novo escopo.

A evolução recomendada é um façade composto:

OrisPlatformGateway
- auth
- mobileSales
- admin
- missions
- reporting
- integrations

Interfaces independentes evitam um arquivo monolítico.

AuthGateway:
- authenticate
- createAccount
- refresh/logout
- list memberships
- create SSO exchange

MobileSalesGateway:
- upsertCustomer
- fetchCommercialSnapshot
- sendDocument

AdminGateway:
- users/sellers CRUD
- product CRUD
- stock/price update
- customers CRUD
- customer assignments
- company settings

MissionGateway:
- mission CRUD
- assignments
- fetch seller missions
- return evidence
- push subscriptions

ReportingGateway:
- seller report
- company report
- commissions

IntegrationGateway:
- WhatsApp connection status/configuration
- help contacts
- external catalog lookup when configured

## 18. Backend DEMO vs backend real

DEMO continua existindo para testes, desenvolvimento e demonstração ponta a ponta. Ele será ampliado para representar empresa, vendedores, produtos, atribuições, missões e relatórios no mesmo navegador.

Backend real é obrigatório para:
- sincronização entre dispositivos;
- vendedores diferentes;
- dados compartilhados da empresa;
- Web Push real;
- WhatsApp webhook;
- SSO entre domínios;
- segredos;
- relatórios centrais.

## 19. Onde conectar a API real

Ponto de composição:
src/infrastructure/gatewayFactory.ts

Implementação prevista:
src/infrastructure/http/httpClient.ts
src/infrastructure/http/httpAuthGateway.ts
src/infrastructure/http/httpMobileSalesGateway.ts
src/infrastructure/http/httpAdminGateway.ts
src/infrastructure/http/httpMissionGateway.ts
src/infrastructure/http/httpReportingGateway.ts
src/infrastructure/http/httpIntegrationGateway.ts

Configuração pública:
VITE_ORIS_API_BASE_URL=https://api.seudominio.com

Essa URL pode ficar no bundle.

Nunca colocar em VITE_*:
- database password;
- service-role key;
- WhatsApp access token;
- Meta App Secret;
- AI provider secret key;
- JWT signing key.

## 20. Dados necessários para conectar uma API existente

Para integrar uma API que você já possui, fornecer:
1. URL base HTTPS;
2. documentação OpenAPI/Swagger ou coleção Postman;
3. fluxo de autenticação;
4. exemplo de login bem-sucedido;
5. exemplo de usuário com duas empresas;
6. endpoint/shape de produtos, preço e estoque;
7. endpoint/shape de clientes;
8. endpoints de vendedores/roles;
9. endpoint de atribuição cliente-vendedor;
10. endpoints de Missões/atribuições/evidências;
11. endpoint idempotente de Pedido/Orçamento;
12. endpoint de relatório/comissão;
13. mecanismo de SSO;
14. códigos de erro;
15. ambiente sandbox/teste.

Não enviar segredo no chat. Segredos devem ser cadastrados no provedor de deploy/backend.

## 21. Se ainda não existe API

Opção recomendada para chegar rápido:
Postgres/Supabase para dados/auth/storage + funções server-side para regras sensíveis e webhooks.

Opção de maior controle:
API TypeScript própria + Postgres.

A decisão deve ser tomada antes de implementar persistência central real.

## 22. Segurança multi-tenant

Toda consulta central deve validar:
- usuário autenticado;
- membership na empresa;
- papel/permissão;
- companyId derivado/validado server-side.

Nunca confiar apenas em companyId enviado pelo frontend.

Documentos:
- idempotency key com constraint central;
- auditoria de criação/envio;
- vendedor não acessa documento de outro vendedor sem permissão.

## 23. Testes de aceite novos

A1. Admin cria vendedor e vendedor aparece somente na empresa correta.
A2. Admin cria produto/SKU e vendedor recebe produto após sincronização manual.
A3. Produto alterado no painel só muda no vendedor após sync comercial.
A4. Admin atribui cliente a vendedor e snapshot respeita carteira.
A5. Admin cria Missão para vendedor e somente ele recebe.
A6. Missão recebida permanece executável offline.
A7. Retorno offline sobe ao reconectar.
A8. Relatório do vendedor não inclui outro vendedor.
A9. Comissão usa percentual vigente/configuração central.
A10. Seller não acessa CRUD administrativo.
A11. Admin pode abrir Sistema Online na mesma sessão.
A12. API real pode substituir demo sem alterar domínio/UI.
A13. Busca interna por SKU funciona sem provedor externo.
A14. Busca externa por SKU fica indisponível de forma explícita sem provedor configurado.
A15. Sync comercial nunca envia Pedido/Orçamento.
A16. Push de Missão não atualiza catálogo/preço/estoque.
A17. WhatsApp/IA não expõe segredo no bundle.
A18. Company A nunca acessa dados da Company B.

## 24. Fases de implementação

1. Foundation/RBAC e novo gateway composto
2. Sistema Online shell + Vendedores
3. Produtos/Estoque + Clientes/Carteiras
4. Missões/admin + fluxo seller
5. Relatórios/Comissões
6. Sistema Online integrado/SSO
7. WhatsApp AI configuration + backend contracts
8. Web Push + Mapa da Equipe
9. Real API adapter
10. E2E/segurança/QA/deploy

## 25. Limites explícitos

Sem backend/API central:
- não existe sincronização real entre dois aparelhos;
- não existe push server-side real;
- não existe WhatsApp webhook real;
- não existe relatório central multiusuário real;
- não existe SSO cross-domain real.

Esses limites não serão mascarados com dados falsos em produção.


## 26. Sistema Online oficial: Saboriza

O Sistema Online a ser integrado foi identificado pelo usuário como:

https://saboriza-catalogo.vercel.app/

A fonte pública correspondente foi confirmada em:

Ruanzinn01/Saboriza-Catalogo

O HTML desse repositório declara exatamente o domínio acima como URL pública do site, portanto ele é tratado como a referência de integração atual.

### Arquitetura existente que deve ser reaproveitada

O Saboriza já possui:

- catálogo público;
- painel administrativo em /admin;
- autenticação administrativa via Supabase Auth;
- produtos;
- categorias;
- clientes;
- fornecedores;
- pedidos e itens;
- cupons;
- indicadores;
- configurações empresariais/fiscais;
- funções de banco para criar pedido e atualizar itens.

O backend real usado pelo site é Supabase. O Vercel hospeda a interface.

### Regra de integração

Não duplicar no appweb os módulos empresariais que já existem no Saboriza.

O Óris360° será o App do Vendedor e deve compartilhar a mesma fonte central de dados, por uma camada autorizada.

Fluxo desejado:

Saboriza Admin / Supabase
→ produtos, clientes, vendedores, carteiras, missões e regras
→ API/RPC segura do Saboriza
→ Óris360° sincroniza base comercial
→ vendedor trabalha offline
→ vendedor envia cliente/pedido/missão
→ API/RPC segura
→ Supabase
→ painel Saboriza enxerga o resultado

### Dados existentes hoje no schema público versionado do Saboriza

Tabelas conhecidas:
- categories
- coupons
- customers
- ibge_cities
- order_items
- orders
- products
- settings
- suppliers

Funções conhecidas:
- create_order
- update_order_items

O schema versionado no repositório ainda não contém estruturas explícitas para:
- vendedor;
- perfil/papel por vendedor;
- carteira cliente-vendedor;
- missão e atribuição;
- comissão;
- assinatura Web Push;
- localização de equipe;
- idempotência específica do App Óris360°;
- estoque central de produto.

Essas lacunas precisam ser tratadas no backend Saboriza/Supabase antes de prometer sincronização real desses recursos.

### Decisão de fronteira

O appweb continuará sem conhecer tabelas Supabase diretamente nas regras de negócio.

Criar uma implementação específica do gateway para Saboriza/Supabase, preservando os contratos do domínio.

As operações simples de leitura podem usar Supabase com chave pública e RLS quando isso estiver comprovadamente protegido.

Operações sensíveis devem usar RPC/Edge Function/API server-side quando precisarem:
- validar vendedor/empresa;
- garantir idempotência;
- aplicar regra de estoque;
- atribuir carteira;
- criar/atribuir missão;
- calcular comissão;
- gerar SSO;
- enviar Web Push;
- usar segredos do WhatsApp/IA.

### Configuração que será necessária

No deploy do Óris360°:
- URL do projeto Supabase usado pelo Saboriza;
- chave pública/publishable/anon do projeto;
- URL pública do Sistema Online: https://saboriza-catalogo.vercel.app/

Nunca colocar service-role key ou outros segredos no frontend.

Para alterar o banco real serão necessários:
- acesso autorizado ao projeto Supabase;
- migrations/RLS/RPCs revisadas;
- ambiente de teste ou possibilidade de validar sem arriscar dados de produção.
