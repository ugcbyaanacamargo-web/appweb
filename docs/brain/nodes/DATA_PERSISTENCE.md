# Node: DATA_PERSISTENCE

requires: [ARCHITECTURE](./ARCHITECTURE.md)  
related: [OFFLINE_SYNC](./OFFLINE_SYNC.md), [AUTH_SECURITY](./AUTH_SECURITY.md), [SALES_DOCUMENTS](./SALES_DOCUMENTS.md)  
next: [TESTING_QA](./TESTING_QA.md)

A persistência local usa Dexie/IndexedDB.

Invariantes:
- escopo por dispositivo + usuário + empresa;
- logout não apaga dados locais;
- histórico de Pedido/Orçamento é local ao aparelho;
- dados de empresas/usuários não podem vazar entre escopos;
- última base comercial válida não pode ser substituída parcialmente;
- mudanças de schema exigem migração e teste.
