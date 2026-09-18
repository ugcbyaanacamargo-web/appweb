# Node: ARCHITECTURE

requires: [Prompt Mestre](../../specs/ORIS360_SALES_APP_MASTER_SPEC.txt)  
related: [API_INTEGRATION](./API_INTEGRATION.md), [DATA_PERSISTENCE](./DATA_PERSISTENCE.md), [OFFLINE_SYNC](./OFFLINE_SYNC.md), [AUTH_SECURITY](./AUTH_SECURITY.md)  
next: [TESTING_QA](./TESTING_QA.md)

Arquitetura atual: React + TypeScript + Vite PWA; Dexie/IndexedDB para operação local; `OrisGateway` como fronteira externa; Netlify como host alvo.

Antes de mudar limites entre módulos:
- trace entrada, estado, persistência, saída e falhas;
- preserve contratos já usados por testes;
- mantenha DEMO e API real separados;
- evite arquivos multifunção quando a responsabilidade puder ser isolada;
- não altere regra funcional para simplificar arquitetura.
