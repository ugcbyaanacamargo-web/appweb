# appweb Brain — índice principal

Este é o ponto de entrada navegável do repositório depois de `AGENTS.md`.

## Bootstrap obrigatório

Leia nesta ordem:

1. [Prompt Mestre](../specs/ORIS360_SALES_APP_MASTER_SPEC.txt)
2. [PROJECT_STATE.md](../../PROJECT_STATE.md)
3. [DECISIONS.md](../../DECISIONS.md)
4. escolha **uma rota** abaixo;
5. siga os links `requires`, `related` e `next` da rota;
6. consulte [SKILL_ROUTER.md](../SKILL_ROUTER.md);
7. leia apenas as skills realmente necessárias;
8. localize código, contratos e testes da funcionalidade;
9. finalize usando [CI](./CI.md) e [Definition of Done](./DEFINITION_OF_DONE.md).

A representação compacta do grafo está em [GRAPH.json](./GRAPH.json).

## Rotas por intenção

| Intenção | Rota |
|---|---|
| Nova funcionalidade ou mudança de comportamento | [NEW_FEATURE](./routes/NEW_FEATURE.md) |
| Bug, regressão ou comportamento inesperado | [BUG_FIX](./routes/BUG_FIX.md) |
| API, serviço ou integração externa | [INTEGRATION](./routes/INTEGRATION.md) |
| Tela, UX, componente ou fluxo visual | [UI_CHANGE](./routes/UI_CHANGE.md) |
| Autenticação, autorização, dados sensíveis ou ameaça | [SECURITY](./routes/SECURITY.md) |
| Preparar PR, release, deploy ou pós-deploy | [RELEASE](./routes/RELEASE.md) |

## Nós principais

- [ARCHITECTURE](./nodes/ARCHITECTURE.md)
- [FRONTEND](./nodes/FRONTEND.md)
- [DATA_PERSISTENCE](./nodes/DATA_PERSISTENCE.md)
- [AUTH_SECURITY](./nodes/AUTH_SECURITY.md)
- [OFFLINE_SYNC](./nodes/OFFLINE_SYNC.md)
- [SALES_DOCUMENTS](./nodes/SALES_DOCUMENTS.md)
- [API_INTEGRATION](./nodes/API_INTEGRATION.md)
- [TESTING_QA](./nodes/TESTING_QA.md)
- [DEPLOY_RELEASE](./nodes/DEPLOY_RELEASE.md)

## Motores

- [Superpowers](./skills/SUPERPOWERS.md)
- [gstack](./skills/GSTACK.md)
- [ECC](./skills/ECC.md)

## Regra de navegação

Não leia o catálogo inteiro de `vendor/`. A rota atual indica os nós necessários; os nós apontam para skills e arquivos relacionados. Expanda o contexto somente quando uma dependência real aparecer.

Nenhum nó substitui a especificação funcional. O grafo organiza a navegação; o Prompt Mestre continua sendo a fonte funcional.
