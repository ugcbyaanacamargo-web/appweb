# Óris360° — Auditoria de uso humano antes da expansão

Data: 2026-09-19
Base analisada: main `37f51126db61c045f26df9960db995a92fe3c96e`

## Evidência realmente usada

O host atual não conseguiu carregar diretamente `https://oris360-site.netlify.app/` pelo navegador web nem resolver o domínio pelo shell. Portanto, esta auditoria não afirma cliques no site publicado.

A experiência foi reconstruída por evidência executável e código atual:

- Playwright E2E do repositório;
- CI atual do main;
- telas React;
- gateways DEMO/HTTP;
- Prompt Mestre;
- regras offline/persistência;
- fluxo de integração já implementado.

Os E2E atuais exercitam login, seleção de empresa, menu, orçamento, persistência, envio, duplicação, integração HTTP, recuperação de senha, relatórios, Sistema Online, WhatsApp e campos dinâmicos de cliente.

## O que um vendedor consegue fazer hoje

- entrar no DEMO ou configurar API real;
- selecionar empresa;
- vender offline após ativação;
- criar cliente;
- pesquisar cliente;
- consultar produtos recebidos;
- criar Orçamento;
- gerar/enviar documento;
- manter histórico local;
- executar Missões recebidas;
- registrar evidências/localização;
- consultar relatório do próprio vendedor;
- solicitar abertura do Sistema Online;
- consultar estado da integração WhatsApp;
- registrar push quando o backend fornece a chave pública.

## Onde a experiência quebra para uma empresa real

### 1. Não existe o lado de quem administra a operação

Uma empresa precisa entrar em algum lugar para:

- cadastrar/convidar vendedores;
- bloquear vendedor;
- definir comissão;
- criar/editar produtos;
- alterar estoque/preço;
- administrar clientes;
- entregar uma carteira para cada vendedor;
- criar/atribuir Missões;
- acompanhar pedidos recebidos;
- acompanhar resultado da equipe;
- consultar posições enviadas;
- configurar integrações.

Hoje esse lugar não existe no produto.

### 2. Produtos são somente leitura no App do Vendedor

Isso está correto para o vendedor, mas falta a outra metade: o painel da empresa que cria e mantém o catálogo.

O fluxo humano correto é:

`empresa cadastra/altera produto → vendedor continua com base anterior → vendedor toca SINCRONIZAR → nova base entra de forma completa`.

### 3. Missões só têm o receptor

O vendedor já consegue receber/executar. Falta o emissor:

`empresa cria missão → escolhe vendedor → missão chega → vendedor executa offline → retorno sobe → empresa acompanha`.

### 4. Cliente existe no vendedor, mas não existe carteira central

O vendedor cria/edita cliente localmente e envia no sync/documento. Falta a empresa poder:

- ver todos os clientes;
- atribuir responsabilidade;
- mover carteira;
- limitar snapshot do vendedor aos clientes autorizados.

### 5. Relatório existe apenas do ponto de vista do vendedor

O vendedor já consulta um resumo via gateway. Falta:

- visão consolidada da empresa;
- comparação por vendedor;
- regra central de comissão;
- rastreabilidade do que compõe a comissão.

### 6. Sistema Online ainda aponta para algo externo

O App já sabe pedir uma sessão online. Porém, para o ecossistema ser utilizável sozinho, o próprio `appweb` precisa fornecer uma superfície online interna com permissões.

Se depois existir outro Sistema Online em outro domínio, o gateway troca para SSO externo.

### 7. A configuração de API atual é uma ferramenta técnica

Pedir a uma pessoa comum que preencha URL + muitas rotas é adequado para desenvolvimento/implantação, não para uso diário.

Direção:
- manter a tela técnica como configuração avançada;
- usuário comum vê somente estado da integração;
- owner/admin controla integrações;
- quando a API oficial estiver definida, os caminhos deixam de ser digitados manualmente.

### 8. WhatsApp está corretamente sem integração falsa, mas falta painel de gerenciamento

Hoje o App consulta status. O painel empresarial deverá permitir ver:

- conectado/não conectado;
- número;
- IA ligada/desligada;
- horário;
- fallback humano;
- capacidades liberadas.

Token, App Secret e chave de IA nunca entram no navegador.

### 9. Push está preparado no cliente, mas falta o emissor

A PWA já registra `PushSubscription`. Para notificar de verdade, um servidor precisa salvar a assinatura e enviar a mensagem. A Push API exige service worker e um application server para o envio. Isso fica como integração server-side real.

### 10. DEMO deve demonstrar o ecossistema inteiro

O DEMO atual prova o App do Vendedor. Ele será ampliado para provar também:

- owner/admin;
- vendedores;
- catálogo;
- carteiras;
- criação e atribuição de Missão;
- documentos centrais enviados;
- relatório da empresa;
- última localização;
- estados de integração.

O DEMO continuará explicitamente identificado como DEMO.

## Fluxos humanos que passam a ser obrigatórios

1. Criar conta → entrar como owner → configurar empresa.
2. Owner cria vendedor → vendedor consegue entrar no DEMO.
3. Owner cria produto → vendedor só recebe depois do sync manual.
4. Owner cadastra/atribui cliente → vendedor recebe somente carteira permitida.
5. Vendedor cria cliente offline → sync sobe cliente → painel passa a enxergar.
6. Owner cria Missão → vendedor recebe → conclui offline → retorno aparece no painel.
7. Vendedor envia Pedido → documento passa a existir no painel central → não volta como histórico para outro aparelho.
8. Owner consulta vendas/comissão por vendedor.
9. Vendedor abre Sistema Online → recebe somente o que sua permissão permite.
10. Owner administra integrações; vendedor apenas usa o que estiver disponível.

## Regras que não serão quebradas

- menu do vendedor continua com exatamente 10 itens;
- histórico central de Pedido/Orçamento nunca é baixado para o App;
- SINCRONIZAR nunca envia Pedido/Orçamento;
- envio de documento continua explícito;
- logout não apaga base local;
- primeira ativação exige internet;
- vendedor continua trabalhando offline;
- DEMO nunca é apresentado como backend real.
