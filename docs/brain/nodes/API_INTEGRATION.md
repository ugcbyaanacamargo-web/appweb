# Node: API_INTEGRATION

requires: [ARCHITECTURE](./ARCHITECTURE.md), [AUTH_SECURITY](./AUTH_SECURITY.md)  
related: [OFFLINE_SYNC](./OFFLINE_SYNC.md), [SALES_DOCUMENTS](./SALES_DOCUMENTS.md)  
next: [TESTING_QA](./TESTING_QA.md)

Contrato atual:
- `src/infrastructure/orisGateway.ts` define a fronteira;
- `src/infrastructure/gatewayFactory.ts` escolhe a implementação;
- `DemoOrisGateway` é DEMO;
- `HttpOrisGateway` permanece útil para diagnóstico/contratos genéricos;
- produção deve evoluir para um gateway específico **Saboriza/Supabase**;
- Sistema Online oficial: `https://saboriza-catalogo.vercel.app/`;
- `docs/API_INTEGRATION.md` registra o contrato real;
- `docs/SABORIZA_ADAPTATION_MATRIX.md` registra as lacunas centrais.

Invariantes:
- não duplicar no App módulos administrativos já existentes no Saboriza;
- não acessar tabela remota diretamente da UI;
- não expor secret/service-role;
- validar RLS/membership no servidor;
- snapshot comercial nunca contém histórico central de Pedidos/Orçamentos;
- idempotência e validação de estoque pertencem ao servidor;
- integração ausente permanece dependência explícita, nunca integração falsa.

Nunca invente endpoint, token, SSO, telefone, e-mail, estoque ou payload oficial.
