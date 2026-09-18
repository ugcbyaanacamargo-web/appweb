# Node: TESTING_QA

requires: [Matriz de aceite](../../ACCEPTANCE_MATRIX.md)  
related: [CI](../CI.md), [Definition of Done](../DEFINITION_OF_DONE.md)  
next: [DEPLOY_RELEASE](./DEPLOY_RELEASE.md)

Camadas de prova:
1. testes unitários/domínio com Vitest;
2. testes de integração de serviços/IndexedDB;
3. matriz de 24 critérios;
4. lint;
5. TypeScript/build;
6. Playwright E2E para fluxos reais de usuário;
7. GitHub Actions como evidência automática após push/PR.

Para bug ou comportamento novo, prefira teste que falha antes da correção quando tecnicamente aplicável. Nenhum teste isolado prova sozinho que todos os requisitos foram atendidos.
