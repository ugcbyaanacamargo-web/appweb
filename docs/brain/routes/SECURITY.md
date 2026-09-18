# Route: SECURITY

id: `security`  
requires: [AUTH_SECURITY](../nodes/AUTH_SECURITY.md), [TESTING_QA](../nodes/TESTING_QA.md)  
related: [ARCHITECTURE](../nodes/ARCHITECTURE.md), [API_INTEGRATION](../nodes/API_INTEGRATION.md), [DATA_PERSISTENCE](../nodes/DATA_PERSISTENCE.md)  
next: [CI](../CI.md), [Definition of Done](../DEFINITION_OF_DONE.md)

1. Identifique ativo, ameaça, fronteira de confiança e impacto.
2. Use gstack `cso`/review e ECC `security-review` quando pertinentes.
3. Nunca persista segredo no repositório.
4. Preserve isolamento por aparelho + usuário + empresa.
5. Verifique autenticação, autorização, dados locais, sessão, API e headers afetados.
6. Exija evidência de teste para qualquer correção de segurança tecnicamente verificável.
