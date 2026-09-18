# Route: UI_CHANGE

id: `ui_change`  
requires: [FRONTEND](../nodes/FRONTEND.md), [TESTING_QA](../nodes/TESTING_QA.md)  
related: [SALES_DOCUMENTS](../nodes/SALES_DOCUMENTS.md), [OFFLINE_SYNC](../nodes/OFFLINE_SYNC.md), [AUTH_SECURITY](../nodes/AUTH_SECURITY.md)  
next: [CI](../CI.md), [Definition of Done](../DEFINITION_OF_DONE.md)

1. Identifique a regra de negócio que a tela representa.
2. Verifique loading, vazio, erro, sucesso, disabled, offline e acessibilidade.
3. Não considere um botão funcional apenas porque possui handler.
4. Se a ação exige persistência, API ou regra de domínio, implemente e teste essas camadas.
5. Para interação de usuário, adicione/ajuste Playwright quando o fluxo for tecnicamente testável.
6. Faça revisão visual e funcional antes de concluir.
