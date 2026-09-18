# Runtime: o que realmente fica ativo

## O que o GitHub fornece

Este repositório guarda versões completas e fixadas dos projetos upstream como submódulos e também mantém o contrato operacional do projeto.

A camada persistente inclui:

- `AGENTS.md` — regras obrigatórias;
- `docs/SKILL_ROUTER.md` — roteamento por intenção;
- `PROJECT_STATE.md` — estado atual;
- `DECISIONS.md` — decisões duráveis;
- specs/planos em `docs/superpowers/`.

## O que o GitHub não faz

Somente adicionar um repositório em `vendor/` **não concede novas permissões nem carrega automaticamente código dentro do ChatGPT Web**.

Para executar uma capacidade, ela precisa existir no runtime atual como plugin, skill, conector, ferramenta ou ambiente compatível.

## Como este projeto usa as skills

1. O agente restaura o estado do projeto no GitHub.
2. Identifica semanticamente o tipo de tarefa.
3. Consulta `docs/SKILL_ROUTER.md`.
4. Usa a skill nativa quando ela estiver realmente disponível.
5. Quando não estiver disponível, lê a skill upstream fixada e a usa como orientação aplicável às ferramentas existentes.
6. Implementa em branch isolada.
7. Valida/revisa.
8. Atualiza o estado persistente.

## Neste fluxo do ChatGPT

- gstack Workflows pode ser usado através do plugin `gstack-workflows` quando disponível.
- Superpowers pode ser usado através das skills correspondentes quando disponíveis.
- GitHub é acessado pelo conector autorizado.
- Os submódulos fornecem fonte upstream persistente e auditável.

## Memória

`PROJECT_STATE.md` + `DECISIONS.md` formam a memória portátil do **trabalho do repositório**.

`vendor/memory/mem0` é infraestrutura para **memória da aplicação/agentes do produto**. Ela só será conectada ao site quando o requisito do produto justificar isso.

## Outros ambientes

- gstack nativo tem requisitos próprios.
- Superpowers instala de forma diferente conforme o agente.
- `vercel-labs/skills` oferece a CLI `npx skills`.
- MCP precisa de um cliente MCP/configuração explícita.
- Bolt.diy e Dyad são aplicações/ambientes separados.

Consulte sempre o README/SKILL.md fixado antes de executar capacidades específicas.
