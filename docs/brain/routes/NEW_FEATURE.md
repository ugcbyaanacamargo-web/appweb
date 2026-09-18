# Route: NEW_FEATURE

id: `new_feature`  
requires: [ARCHITECTURE](../nodes/ARCHITECTURE.md), [TESTING_QA](../nodes/TESTING_QA.md)  
related: [FRONTEND](../nodes/FRONTEND.md), [DATA_PERSISTENCE](../nodes/DATA_PERSISTENCE.md), [AUTH_SECURITY](../nodes/AUTH_SECURITY.md), [OFFLINE_SYNC](../nodes/OFFLINE_SYNC.md), [SALES_DOCUMENTS](../nodes/SALES_DOCUMENTS.md), [API_INTEGRATION](../nodes/API_INTEGRATION.md)  
next: [CI](../CI.md), [Definition of Done](../DEFINITION_OF_DONE.md)

1. Leia a seção correspondente do Prompt Mestre.
2. Mapeie entidades, ações, estados, persistência, integrações e falhas.
3. Use Superpowers para design/plano quando a mudança não for trivial.
4. Use gstack para arquitetura, fluxo de dados, QA e revisão.
5. Use ECC somente nas especialidades necessárias.
6. Defina o teste que prova o comportamento antes da implementação quando tecnicamente aplicável.
7. Implemente todas as camadas necessárias; UI isolada não é conclusão.
8. Passe pelos gates de CI e conclusão.
