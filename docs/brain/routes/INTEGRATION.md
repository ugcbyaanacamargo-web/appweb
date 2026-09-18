# Route: INTEGRATION

id: `integration`  
requires: [API_INTEGRATION](../nodes/API_INTEGRATION.md), [AUTH_SECURITY](../nodes/AUTH_SECURITY.md), [TESTING_QA](../nodes/TESTING_QA.md)  
related: [ARCHITECTURE](../nodes/ARCHITECTURE.md), [DATA_PERSISTENCE](../nodes/DATA_PERSISTENCE.md), [OFFLINE_SYNC](../nodes/OFFLINE_SYNC.md)  
next: [CI](../CI.md), [Definition of Done](../DEFINITION_OF_DONE.md)

1. Confirme documentação e contrato oficiais; não invente URL, token, campo ou comportamento.
2. Preserve o `OrisGateway` como fronteira da API Óris360°.
3. Separe claramente DEMO de integração real.
4. Modele autenticação, erros, timeout, idempotência e autorização.
5. Teste sucesso, falha, repetição e ausência de conexão quando aplicável.
6. Não enfraqueça regras offline ou de envio explícito para facilitar a integração.
