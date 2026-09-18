# Node: API_INTEGRATION

requires: [ARCHITECTURE](./ARCHITECTURE.md), [AUTH_SECURITY](./AUTH_SECURITY.md)  
related: [OFFLINE_SYNC](./OFFLINE_SYNC.md), [SALES_DOCUMENTS](./SALES_DOCUMENTS.md)  
next: [TESTING_QA](./TESTING_QA.md)

Contrato atual:
- `src/infrastructure/orisGateway.ts` define a fronteira;
- `src/infrastructure/gatewayFactory.ts` escolhe a implementação;
- `DemoOrisGateway` é DEMO, não API real;
- `docs/API_INTEGRATION.md` registra o contrato pendente.

Nunca invente endpoint, token, SSO, telefone, e-mail ou payload oficial. Quando a API real não existir, preserve a interface e declare a dependência externa.
