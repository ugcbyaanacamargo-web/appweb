# Node: DEPLOY_RELEASE

requires: [TESTING_QA](./TESTING_QA.md)  
related: [CI](../CI.md), [AUTH_SECURITY](./AUTH_SECURITY.md)  
next: [Definition of Done](../DEFINITION_OF_DONE.md)

O alvo de hospedagem é Netlify e o build publica `dist/`.

Antes de release:
- todos os gates obrigatórios do commit/PR devem estar verdes;
- PWA e `netlify.toml` devem ser validados;
- nenhuma dependência externa pendente pode ser apresentada como integrada;
- após deploy, verificar a URL publicada e os fluxos essenciais quando o runtime permitir.
