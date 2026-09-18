# appweb

Repositório-orquestrador para desenvolvimento de aplicações web assistido por agentes de IA.

A regra deste projeto é simples: **não recriar do zero aquilo que já existe e é mantido por projetos fortes do ecossistema**. As capacidades principais ficam ligadas como repositórios completos via Git submodule e fixadas em commits específicos.

## Estrutura

- `vendor/engines/gstack` — fluxo de produto, engenharia, review, QA, segurança e release.
- `vendor/engines/superpowers` — metodologia de desenvolvimento e skills compostas.
- `vendor/skills/anthropic` — coleção pública de Agent Skills e exemplos de especificação.
- `vendor/skills/engineering` — skills de engenharia de software para agentes.
- `vendor/skills/skills-cli` — CLI aberta para descobrir/instalar/usar Agent Skills.
- `vendor/skills/vercel-agent-skills` — skills oficiais da Vercel para React/Next.js, performance, UI e documentação.
- `vendor/memory/mem0` — camada de memória persistente para agentes e aplicações.
- `vendor/mcp/reference-servers` — servidores MCP de referência para ferramentas e dados.
- `vendor/app-builder/bolt-diy` — ambiente multi-LLM para gerar, executar e publicar aplicações web full-stack.
- `vendor/app-builder/dyad` — construtor local e ativo de apps por IA, alternativa a v0/Lovable/Replit/Bolt.

Veja `ENGINE_MANIFEST.md` para commits, estrelas observadas e licenças.

## Clonar corretamente

```bash
git clone --recurse-submodules https://github.com/ugcbyaanacamargo-web/appweb.git
cd appweb
git submodule update --init --recursive
```

## Regra de atualização

Os submódulos são deliberadamente **fixados por commit**. Não apontamos cegamente para o último `main`. Uma atualização deve primeiro ser revisada e depois alterar o gitlink correspondente.

## Importante sobre ChatGPT

Guardar esses projetos aqui **não instala automaticamente essas capacidades dentro do runtime do ChatGPT**.

Neste projeto, quando o ChatGPT tiver os plugins/skills correspondentes conectados, ele pode usar essas capacidades diretamente. O conteúdo em `vendor/` funciona como fonte persistente, referência auditável e base portátil para outros agentes/ambientes.

Leia `docs/RUNTIME.md` antes de assumir que um componente está executável.

## Segurança e licenças

- `modelcontextprotocol/servers` declara que seus servidores são implementações de referência; não trate isso como produção sem revisão de segurança.
- `anthropics/skills`, `vercel-labs/agent-skills` e `dyad` exigem atenção aos avisos/licenças presentes no próprio upstream.
- Não copie código de submódulo para o produto final sem conferir a licença correspondente.
