# Óris360° Aurora — Sistema visual mobile

Data: 2026-09-20
Escopo: apenas apresentação, microinterações e experiência visual do App de Vendas Óris360°.

## Direção aplicada

- Base noturna azul-marinho com aurora em verde-menta e azul.
- Cartões claros com contraste alto para leitura em campo.
- Área de autenticação e entrada com profundidade/glass e brilho discreto.
- Cabeçalho escuro e indicação Online/Offline contrastante.
- Drawer com realce da aba ativa, entrada suave e cartões do usuário.
- Botões de ação com resposta visual em hover/touch; indicadores e FAB com luz de destaque.
- Cards de documento, produto, Missão, formulário, métricas e estados vazios com alinhamento coerente.
- Entrada curta e consistente das páginas; feedback de notificações.
- Atender `prefers-reduced-motion: reduce` e foco de teclado visível.

## Intocável

O visual não altera:
- exatamente 10 itens no menu;
- início em Pedidos;
- duas abas Todos / Não enviados;
- Orçamento começa sem cliente;
- Adicionar Produtos continua desabilitado sem cliente;
- Salvar, Gerar Pedido e Enviar permanecem ações distintas;
- sincronização comercial manual e offline-first;
- dados e documentos locais;
- fluxo real/DEMO e destino Saboriza.

## Prova

- E2E testa atmosfera visual, animação de página, navegação, menu fixo, acessibilidade de movimento reduzido, cliente obrigatório e ausência de rolagem horizontal.
- CI valida lint, testes, build e PWA.
- `production-smoke.yml` passa a exigir a variável CSS `--iris-night` no arquivo CSS realmente publicado, além do botão Saboriza no JS.

## Limitações honestas

Sem inspeção humana de screenshot nesta sessão: a CI prova comportamentos e estilos calculados, não julga estética subjetiva. A integração real Saboriza/Supabase continua pendente.
