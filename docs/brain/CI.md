# CI — autoridade automática de validação

Workflows obrigatórios do repositório:

- `.github/workflows/app-ci.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/engine-integrity.yml`

Gates esperados:
- instalação;
- auditoria de dependências runtime;
- lint;
- Vitest;
- TypeScript + build;
- artefatos PWA/Netlify;
- Playwright E2E em Chromium;
- integridade do cérebro/motor.

Depois de push/PR, consulte a execução associada ao SHA. Se falhar, abra o job e o log da etapa, corrija a causa e gere uma nova execução. Resultado antigo não prova o estado atual.

Comandos equivalentes:
- `npm run lint`
- `npm run test:run`
- `npm run build`
- `npm run test:e2e`
- `python scripts/validate_engine.py`
