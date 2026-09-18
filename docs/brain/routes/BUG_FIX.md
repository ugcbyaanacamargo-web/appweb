# Route: BUG_FIX

id: `bug_fix`  
requires: [TESTING_QA](../nodes/TESTING_QA.md)  
related: [ARCHITECTURE](../nodes/ARCHITECTURE.md), [FRONTEND](../nodes/FRONTEND.md), [DATA_PERSISTENCE](../nodes/DATA_PERSISTENCE.md), [AUTH_SECURITY](../nodes/AUTH_SECURITY.md), [OFFLINE_SYNC](../nodes/OFFLINE_SYNC.md), [SALES_DOCUMENTS](../nodes/SALES_DOCUMENTS.md), [API_INTEGRATION](../nodes/API_INTEGRATION.md)  
next: [CI](../CI.md), [Definition of Done](../DEFINITION_OF_DONE.md)

1. Reproduza o problema e registre a evidência.
2. Use Superpowers `systematic-debugging` antes de alterar o código quando a causa não estiver comprovada.
3. Trace o fluxo até a causa, não apenas o sintoma.
4. Crie um teste de regressão que falhe pela razão correta quando tecnicamente possível.
5. Corrija a causa com a menor mudança coerente.
6. Reexecute o teste original e regressão relacionada.
7. Passe pelos gates de CI e conclusão.
