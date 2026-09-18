# Óris360° — Checklist de Integrações Externas

Este arquivo é o mapa prático para substituir o modo DEMO pelas integrações reais.

## 1. API Óris360°

### Onde conectar

src/infrastructure/gatewayFactory.ts

O App não deve chamar fetch() diretamente de componentes React. A API entra através dos adapters de infraestrutura.

### O que você precisa me fornecer

- URL base HTTPS;
- Swagger/OpenAPI ou Postman;
- método de login/autenticação;
- conta sandbox;
- exemplos de payloads;
- lista de erros/status;
- definição de papéis/permissões.

Não envie tokens/chaves secretas no chat.

## 2. Dados centrais mínimos

A API/base precisa possuir entidades equivalentes a:

- users;
- companies;
- company_memberships;
- seller_profiles;
- products;
- inventory;
- customers;
- seller_customer_assignments;
- missions;
- mission_assignments;
- mission_evidence;
- sales_documents;
- sales_document_items;
- push_subscriptions;
- seller_locations;
- integration_settings.

## 3. Endpoints funcionais mínimos

Não é obrigatório usar exatamente estes paths; são contratos necessários.

### Auth
- login;
- register company;
- current user;
- memberships;
- SSO one-time exchange.

### Admin
- sellers/users CRUD;
- product CRUD;
- price/stock;
- customers CRUD;
- customer assignment;
- company settings.

### Seller mobile
- customer upsert;
- commercial snapshot;
- explicit document send with idempotency.

### Missions
- create/update/cancel mission;
- assign sellers;
- list seller missions;
- upload/return evidence;
- push subscription.

### Reporting
- seller own report;
- company report;
- commission report.

### Location
- receive operational location;
- admin team map query.

## 4. Sistema Online / SSO

Se o painel ficar dentro do mesmo domínio/app, não precisamos de SSO externo: reutilizamos a sessão e o backend valida permissão.

Se for outro domínio, preciso de:
- URL destino;
- endpoint para gerar código SSO de uso único;
- endpoint no destino para trocar o código;
- TTL do código;
- redirect URIs permitidas.

Nunca colocar bearer token persistente na URL.

## 5. Produtos / SKU

### Funciona sem API externa
- cadastro manual;
- SKU interno;
- pesquisa por SKU da própria empresa.

### Para preencher produto automaticamente a partir de EAN/SKU externo
É necessário escolher um provedor de catálogo e fornecer sua documentação/chave pelo ambiente do backend.

Sem provedor, a UI deve mostrar busca externa não configurada, mas cadastro manual continua funcionando.

## 6. Web Push para Missões

Necessário:
- HTTPS;
- service worker;
- permissão do usuário;
- PushSubscription;
- backend que armazene subscription por usuário/dispositivo;
- chaves/serviço de envio conforme implementação escolhida.

O frontend registra a inscrição; o envio precisa partir do servidor.

## 7. IA no WhatsApp

Para funcionar em produção, preciso que você conecte uma conta/provedor de WhatsApp Business.

### Dados/configurações

- Meta Business ou BSP escolhido;
- WABA ID;
- Phone Number ID;
- credencial server-side;
- webhook HTTPS;
- verify token;
- App Secret quando aplicável;
- templates aprovados quando necessários.

### IA

Também é necessário:
- provedor/modelo de IA;
- API key server-side;
- limites/custos;
- quais ações a IA pode realizar.

### Backend

WhatsApp não deve ser conectado direto pelo React porque segredos e webhooks precisam ficar server-side.

O backend recebe a mensagem, valida o webhook, identifica empresa/cliente, chama IA + ferramentas autorizadas e envia a resposta pelo provedor do WhatsApp.

## 8. Relatórios e Comissões

Precisamos definir no backend qual venda gera comissão:
- Pedido enviado?
- Pedido concluído?
- Faturado?
- Pago?

O frontend não decide isso.

Necessário:
- percentual por vendedor;
- base elegível;
- período;
- estornos/cancelamentos;
- status do pagamento de comissão se desejado.

## 9. Mapa da Equipe

Necessário:
- endpoint para receber localização;
- endpoint administrativo para últimas posições;
- política de retenção;
- autorização por empresa/papel.

PWA possui limitações de background do sistema operacional/navegador. Para rastreamento contínuo garantido em background pode ser necessário shell nativo.

## 10. Variáveis

Pode ser pública no frontend:
VITE_ORIS_API_BASE_URL

Devem ficar apenas no servidor/deploy:
DATABASE_URL
JWT_SIGNING_SECRET
WHATSAPP_ACCESS_TOKEN
META_APP_SECRET
AI_PROVIDER_API_KEY
SUPABASE_SERVICE_ROLE_KEY

## 11. Sincronizar

O botão do vendedor significa:

pending customers up
→ commercial snapshot down
→ validate staging
→ atomic activate
→ last-success timestamp

Nunca:
- envia Pedido/Orçamento;
- baixa histórico central;
- envia automaticamente porque a internet voltou.

## 12. O que consigo conectar quando você trouxer a API

Com URL + documentação + sandbox, o adapter HTTP fica sob:

src/infrastructure/http/

e o factory muda de DEMO para HTTP, mantendo regras e UI.
