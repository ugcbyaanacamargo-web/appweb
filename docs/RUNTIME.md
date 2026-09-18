# Runtime: o que realmente fica ativo

## Ponto de entrada

Qualquer sessão que trabalhe no appweb deve iniciar em:

`AGENTS.md` → `docs/brain/INDEX.md`

O cérebro roteia a tarefa para a especificação, estado, decisões, nós e skills necessários sem carregar todo o repositório.

## O que o GitHub fornece

Este repositório guarda:

- o código do Óris360°;
- a especificação funcional canônica;
- `AGENTS.md`;
- `docs/brain/`;
- `docs/SKILL_ROUTER.md`;
- `PROJECT_STATE.md`;
- `DECISIONS.md`;
- versões completas e fixadas dos projetos upstream como submódulos;
- testes e workflows do GitHub Actions.

## O que o GitHub não faz

Adicionar um projeto em `vendor/` não concede novas permissões e não executa automaticamente aquela ferramenta dentro do ChatGPT Web.

Para executar uma capacidade, ela precisa existir no runtime atual como plugin, skill, conector, ferramenta ou ambiente compatível.

Quando não existir execução nativa, o agente pode ler a versão fixada da skill e aplicar suas instruções usando as ferramentas que realmente possui.

## Fluxo do ChatGPT Web + GitHub

1. restaurar contexto pelo cérebro;
2. classificar a intenção;
3. resolver skills;
4. ler código/testes/contratos relacionados;
5. implementar em branch isolada;
6. push/PR;
7. consultar GitHub Actions;
8. corrigir qualquer gate obrigatório;
9. atualizar estado/decisões;
10. só então relatar conclusão com evidência.

## Testes automáticos

O repositório usa:
- Vitest para domínio/serviços/integração local;
- ESLint para análise estática;
- TypeScript + Vite para build;
- Playwright em Chromium para jornadas E2E;
- `scripts/validate_engine.py` para integridade do motor/cérebro.

## Memória

`PROJECT_STATE.md` + `DECISIONS.md` são a memória portátil e auditável do trabalho do repositório.

`vendor/memory/mem0` é infraestrutura opcional para memória da aplicação/agentes do produto e só deve ser integrada quando houver requisito real.
