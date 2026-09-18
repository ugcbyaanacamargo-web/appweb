# Runtime: o que realmente fica ativo

## O que o GitHub fornece

Este repositório guarda versões completas e fixadas dos projetos upstream como submódulos. Isso cria uma base auditável e portátil.

## O que o GitHub não faz

Somente adicionar um repositório em `vendor/` **não concede novas permissões nem carrega automaticamente código dentro do ChatGPT Web**.

Para o ChatGPT executar uma capacidade, ela precisa existir no runtime atual como plugin, skill, conector ou ferramenta disponível.

## Neste fluxo do ChatGPT

- O workflow gstack é usado através do plugin `gstack-workflows` quando disponível.
- Superpowers é usado através do plugin/skills correspondente quando disponível.
- GitHub é acessado pelo conector GitHub autorizado.
- Os submódulos servem como fonte upstream persistente, referência de implementação e base para ambientes externos compatíveis.

## Em outros ambientes

Os projetos upstream possuem seus próprios requisitos. Exemplos:

- gstack nativo requer ambiente compatível com sua instalação upstream.
- Superpowers instala de forma diferente conforme o agente.
- `vercel-labs/skills` oferece a CLI `npx skills`.
- Mem0 precisa ser integrado à aplicação que usará memória.
- MCP precisa de um cliente MCP e configuração explícita.
- Bolt.diy é uma aplicação separada e possui dependências próprias.

Consulte sempre o README do submódulo antes de executar.
