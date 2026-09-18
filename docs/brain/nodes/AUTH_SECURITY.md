# Node: AUTH_SECURITY

requires: [ARCHITECTURE](./ARCHITECTURE.md)  
related: [DATA_PERSISTENCE](./DATA_PERSISTENCE.md), [API_INTEGRATION](./API_INTEGRATION.md)  
next: [TESTING_QA](./TESTING_QA.md)

Invariantes:
- primeiro login/primeira ativação de empresa exige internet;
- acesso offline só ocorre após base válida;
- sessão e credenciais locais permanecem separadas das credenciais externas;
- permissões do Sistema Online não devem ser inventadas;
- segredos e tokens nunca entram no Git;
- conta bloqueada impede sincronização comercial, mas não destrói operação offline e não bloqueia envio explícito permitido pela especificação.
