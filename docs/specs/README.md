# Especificações canônicas

A especificação funcional primária do App de Vendas é:

- [ORIS360_SALES_APP_MASTER_SPEC.txt](./ORIS360_SALES_APP_MASTER_SPEC.txt)

O arquivo acima preserva o Prompt Mestre fornecido pelo usuário, inclusive a expressão histórica "Você, Base44". Essa expressão identifica o executor citado na origem do prompt; ela **não altera** as regras funcionais e não obriga o projeto a usar Base44.

Para este repositório, o executor deve seguir `AGENTS.md`, o cérebro em `docs/brain/INDEX.md` e as capacidades realmente disponíveis no runtime atual.

Em caso de conflito:
1. regras funcionais explícitas e imutáveis do Prompt Mestre prevalecem sobre conveniências de implementação;
2. decisões técnicas duráveis registradas em `DECISIONS.md` devem respeitar a especificação;
3. nenhuma integração externa pode ser inventada;
4. lacunas de API devem permanecer claramente identificadas como dependência externa.
