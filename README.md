# appweb

Repositório-orquestrador para desenvolvimento de aplicações web assistido por agentes de IA.

A regra central é: **usar primeiro capacidades maduras que já existem, manter o contexto no próprio repositório e provar mudanças antes de integrar**.

## Como o motor trabalha

Para todo trabalho futuro no site:

1. ler `AGENTS.md`;
2. restaurar `PROJECT_STATE.md` e `DECISIONS.md`;
3. escolher as skills em `docs/SKILL_ROUTER.md`;
4. pesquisar semanticamente o código e padrões existentes;
5. trabalhar em branch isolada;
6. revisar/testar/validar;
7. persistir o novo estado do projeto.

Isso dá continuidade entre sessões sem depender apenas do histórico da conversa.

## Estrutura do motor

- `vendor/engines/gstack` — produto, engenharia, review, QA, segurança, contexto e release.
- `vendor/engines/superpowers` — metodologia, planejamento, TDD, debugging e verificação.
- `vendor/skills/anthropic` — coleção pública de Agent Skills e exemplos de especificação.
- `vendor/skills/engineering` — UI, contexto, API, revisão, segurança, performance e engenharia.
- `vendor/skills/skills-cli` — CLI aberta para descobrir/instalar/usar Agent Skills.
- `vendor/skills/vercel-agent-skills` — React/Next.js, performance, UI e web design guidelines.
- `vendor/memory/mem0` — memória persistente para futura integração na aplicação.
- `vendor/mcp/reference-servers` — servidores MCP de referência.
- `vendor/app-builder/bolt-diy` — construtor full-stack multi-LLM.
- `vendor/app-builder/dyad` — construtor local de apps por IA.

## Arquivos de continuidade

- `PROJECT_STATE.md` — onde o projeto está agora.
- `DECISIONS.md` — decisões que não devem ser esquecidas/contraditas.
- `docs/SKILL_ROUTER.md` — quais capacidades usar para cada tipo de trabalho.
- `AGENTS.md` — contrato obrigatório para agentes.
- `ENGINE_MANIFEST.md` — versões/SHAs dos projetos upstream.

## Clonar corretamente

```bash
git clone --recurse-submodules https://github.com/ugcbyaanacamargo-web/appweb.git
cd appweb
git submodule update --init --recursive
```

## Validação do motor

```bash
python scripts/validate_engine.py
```

O GitHub Actions executa essa validação automaticamente em pushes e pull requests.

## Importante sobre ChatGPT

Guardar projetos dentro do GitHub **não instala automaticamente essas capacidades no runtime do ChatGPT**.

O repositório é a fonte persistente. A execução depende das ferramentas/skills realmente disponíveis no host. `docs/RUNTIME.md` explica essa separação.

## Segurança e licenças

- MCP reference servers não são considerados produção sem revisão de segurança.
- Repositórios com licença mista/indefinida exigem leitura do aviso upstream antes de copiar código.
- Submódulos ficam fixados por commit e não avançam automaticamente.
- Segredos nunca entram em `PROJECT_STATE.md`, `DECISIONS.md` ou commits.
