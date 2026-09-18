# Engine Manifest

Snapshot: **2026-09-18**

As contagens de estrelas abaixo foram lidas diretamente da API do GitHub nesta data. Elas são apenas um retrato e mudam com o tempo.

| Papel | Repositório | Estrelas observadas | Licença reportada/observada | Commit fixado |
|---|---|---:|---|---|
| Motor de workflow | garrytan/gstack | 133,485 | MIT | `a6b3a57512ca6d5c6aa5b68f74f736195021f96e` |
| Metodologia/skills | obra/superpowers | 288,183 | MIT | `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` |
| Biblioteca de Agent Skills | anthropics/skills | 176,917 | mista / sem licença única no nível do repo | `34040c9c568585f6929bedeaad110ad08f079624` |
| Skills de engenharia | addyosmani/agent-skills | 95,933 | MIT | `a120596f6d7ff9b967a3f5e0331ea911376ee5ef` |
| CLI/registry de skills | vercel-labs/skills | 31,895 | MIT | `7407f3893ad4dceab546ac002c3ef806e4000c73` |
| Skills web oficiais Vercel | vercel-labs/agent-skills | 31,292 | sem licença única reportada pela API | `063bee94c3f4df8453406c830b0a7df0f2860278` |
| Memória persistente | mem0ai/mem0 | 65,533 | Apache-2.0 | `84bf468176f0c5e82493bb95aec5484eb2d92bc1` |
| MCP de referência | modelcontextprotocol/servers | 90,424 | NOASSERTION no nível do repo | `d73f99efbfd40c3aa1b61e88728b3d49fb52608f` |
| Criador de app web multi-LLM | stackblitz-labs/bolt.diy | 19,882 | MIT | `2e254ac19a696394030601bc602f54945b12bfc4` |
| Criador de app web ativo/local | dyad-sh/dyad | 21,576 | Apache-2.0 fora de `src/pro`; FSL 1.1 em `src/pro` | `ff91757b419e42345f5bc033127c7bc391dd8f57` |

## Função de cada camada

### Engines
`gstack` e `superpowers` organizam o processo de desenvolvimento: especificação, planejamento, implementação, testes, review, QA, segurança e entrega.

### Skills
`anthropics/skills` fornece padrões amplos; `addyosmani/agent-skills` concentra práticas de engenharia; `vercel-labs/skills` fornece o mecanismo aberto para instalar/usar skills; `vercel-labs/agent-skills` adiciona regras específicas de React/Next.js, performance e interface web.

### Memory
`mem0` é uma camada real de memória para aplicações/agentes. Ele não substitui a memória nativa do ChatGPT; é infraestrutura que um app pode integrar.

### MCP
`modelcontextprotocol/servers` oferece implementações de referência para conectar agentes a arquivos, Git, memória, web e outras ferramentas.

### App builders
`bolt.diy` oferece desenvolvimento full-stack multi-LLM e integração de deploy. `dyad` é uma alternativa local ativa, com foco em privacidade e controle. Os dois ficam disponíveis para comparação e reaproveitamento de padrões, sem misturar seus códigos no root.

## Política

1. Não substituir estes projetos por versões caseiras sem motivo técnico documentado.
2. Não atualizar gitlinks automaticamente.
3. Toda atualização deve registrar o novo SHA e revisar breaking changes/licença.
4. Componentes de referência não viram dependência de produção automaticamente.
