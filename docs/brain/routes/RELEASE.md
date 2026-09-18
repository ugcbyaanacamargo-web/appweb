# Route: RELEASE

id: `release`  
requires: [DEPLOY_RELEASE](../nodes/DEPLOY_RELEASE.md), [TESTING_QA](../nodes/TESTING_QA.md)  
related: [ARCHITECTURE](../nodes/ARCHITECTURE.md), [AUTH_SECURITY](../nodes/AUTH_SECURITY.md)  
next: [CI](../CI.md), [Definition of Done](../DEFINITION_OF_DONE.md)

1. Revise o diff e os requisitos afetados.
2. Consulte todos os workflows associados ao commit/PR.
3. Bloqueie release se houver gate obrigatório falhando.
4. Use gstack `review` e `ship`; use `land-and-deploy` apenas quando o runtime tiver permissão.
5. Após deploy, execute smoke/canary quando possível.
6. Registre no `PROJECT_STATE.md` apenas o que foi realmente verificado.
