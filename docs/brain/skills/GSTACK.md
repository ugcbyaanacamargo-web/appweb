# Skill card: gstack

upstream: `vendor/engines/gstack`

Use por intenção, com o menor workflow suficiente:
- `plan-eng-review`: arquitetura, dados, falhas e estratégia de testes;
- `investigate`: investigação;
- `review`: revisão pré-merge;
- `qa` / `qa-only`: fluxo funcional;
- `cso`: segurança;
- `health`: saúde do repositório;
- `ship`: preparação de entrega;
- `land-and-deploy` / `canary`: somente quando o host possuir acesso.

Nunca simule navegador, deploy ou comando nativo que o host não executou.
