# Óris360° — Matriz dos 24 Critérios de Aceite

Data: 2026-09-18

Esta matriz liga cada critério do Prompt Mestre a evidência automatizada no repositório. Integrações que dependem da futura API real são exercitadas pelo `DemoOrisGateway` e permanecem explicitamente identificadas como contrato de integração.

| Teste | Evidência |
|---|---|
| 1 | `src/app/session.test.ts` + `src/acceptance/masterRules.test.ts` — credencial offline só existe após login online; empresa sem base válida não entra offline; base válida entra offline. |
| 2 | `src/infrastructure/db.test.ts` — `scopeKey` diferente por empresa e queries isoladas. |
| 3 | `src/infrastructure/db.test.ts` — `scopeKey` diferente por usuário e nenhuma query vaza dados. |
| 4 | `src/services/sync.test.ts` — sincronização chama clientes/snapshot e `sendDocument` permanece com zero chamadas. |
| 5 | `src/services/transmit.test.ts` — timeout/falha mantém documento local; confirmação é requisito para `sent`. |
| 6 | `src/services/transmit.test.ts` + `src/infrastructure/demoOrisGateway.test.ts` — mesma chave de idempotência retorna o mesmo número. |
| 7 | `src/domain/rules.test.ts` — documento enviado não edita/não exclui. |
| 8 | `src/domain/rules.test.ts` — duplicação nasce Orçamento novo, vendedor/data atuais e complementares vazios. |
| 9 | `src/domain/rules.test.ts` — produto inativo é removido de documento não enviado e catálogo filtra ativos. |
| 10 | `src/acceptance/masterRules.test.ts` — cliente inativo impede transmissão de nova operação. |
| 11 | `src/services/transmit.test.ts` — Pedido 10 recebe quantidade final 6 do servidor quando venda sem estoque = NÃO. |
| 12 | `src/domain/rules.test.ts` — item com estoque zero é removido sem eliminar outro item válido. |
| 13 | `src/infrastructure/demoOrisGateway.test.ts` — Orçamento acima do estoque é aceito integralmente e estoque do servidor não muda. |
| 14 | `src/acceptance/masterRules.test.ts` — Orçamento convertido em Pedido com estoque 6 resulta em 6 no servidor demo. No Sistema Online real, a API deve aplicar o mesmo contrato. |
| 15 | `src/services/sync.test.ts` — falha de snapshot conserva produto/base e timestamp anteriores. |
| 16 | `src/acceptance/masterRules.test.ts` — snapshot não possui documentos; banco de aparelho novo inicia com zero documentos. |
| 17 | `src/acceptance/masterRules.test.ts` + `src/app/session.test.ts` — logout remove sessão e preserva IndexedDB/documentos. |
| 18 | `src/services/sync.test.ts` — servidor bloqueado impede substituição de base; base válida anterior permanece. |
| 19 | `src/services/transmit.test.ts` + demo gateway — conta bloqueada ainda aceita envio explícito de Pedido/Orçamento. |
| 20 | `src/services/missions.test.ts` — missão recebida é concluída offline e fica pendente. |
| 21 | `src/services/missions.test.ts` — retorno pendente permanece offline e é enviado automaticamente quando online. |
| 22 | `src/acceptance/masterRules.test.ts` — Relatórios e Comissões é classificado como online-only; UI exibe gate offline. |
| 23 | `src/acceptance/masterRules.test.ts` — Sistema Online é online-only. SSO real depende do contrato da futura API, documentado em `docs/API_INTEGRATION.md`. |
| 24 | `src/infrastructure/demoOrisGateway.test.ts` — CPF/CNPJ normalizado vincula ao cliente oficial existente, sem duplicar. |

## Regras adicionais verificadas

- menu fixo contém exatamente os 10 itens especificados;
- conta antes bloqueada pode voltar a sincronizar após regularização no servidor;
- conflito de edição de cliente preserva a versão de timestamp mais recente;
- payload remoto de documento usa o ID oficial do cliente, mantendo o ID local no IndexedDB;
- Pedido com `allowSaleWithoutStock = true` preserva a quantidade solicitada;
- Orçamento não é limitado pelo estoque local;
- pendência isolada de cliente não elimina a pendência nem invalida uma base comercial atualizada com sucesso.
