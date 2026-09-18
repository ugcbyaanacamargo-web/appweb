# Óris360° App de Vendas Mobile — Especificação Funcional e Arquitetural

Data: 2026-09-18
Status: **APROVADA PARA IMPLEMENTAÇÃO**
Origem: Prompt Mestre fornecido pelo usuário.
Natureza: contrato funcional fechado. Regras marcadas como obrigatórias/imutáveis não podem ser simplificadas para acomodar a implementação.

## 1. Objetivo

Entregar um App de Vendas Mobile Óris360° profissional, mobile-first e **offline-first**. Após o primeiro login online e a primeira sincronização válida para uma combinação usuário/empresa/aparelho, o vendedor deve continuar vendendo sem internet.

O App possui estrutura global fixa. Empresas mudam dados e contexto; não mudam páginas, menu ou funcionalidades disponíveis no App.

## 2. Navegação global

Menu fixo, nesta ordem:

1. Pedidos
2. Clientes
3. Produtos
4. Tarefas / Missões
5. IA no WhatsApp
6. Relatórios e Comissões
7. Sistema Online
8. Ajuda
9. Sincronizar
10. Sair da minha conta

No topo: usuário autenticado e empresa ativa.
Na área de sincronização: data/hora da última sincronização **concluída com sucesso**.

Não incluir nesta versão: Novidades, Preferências do aplicativo, Excluir esta conta.

Após login/inicialização, abrir **Pedidos**. O drawer pode iniciar aberto e fecha ao tocar fora.

## 3. Autenticação e primeira ativação

Tela inicial Óris360°:
- CRIAR UMA CONTA
- JÁ TENHO CONTA

Login:
- e-mail
- senha
- visualizar/ocultar senha
- ENTRAR
- VOLTAR
- Esqueci a senha
- aviso de privacidade quando aplicável

Primeiro login naquele aparelho exige internet:

LOGIN ONLINE → autenticar → identificar usuário/empresas → selecionar empresa quando aplicável → primeira sincronização → persistir base local válida → liberar offline.

Criar uma conta cria **nova conta Óris360° e novo ambiente/loja**, não um vendedor dentro de empresa existente. Mesmas credenciais devem servir ao Sistema Online. Prever 7 dias grátis, sem cobrança automática. Não inventar campos comerciais não especificados.

## 4. Multiempresa, multiusuário e dispositivo

Um usuário pode pertencer a várias empresas e trocar a empresa ativa.

Todo dado local é isolado pela combinação efetiva de:
- dispositivo;
- usuário;
- empresa.

Nunca misturar clientes, produtos, preços, estoque, configurações, documentos, pendências ou metadados de sincronização entre contextos.

Primeiro acesso de uma empresa naquele aparelho exige internet e sincronização inicial válida.

Usuários diferentes no mesmo aparelho não podem ver dados locais uns dos outros. Logout encerra sessão, mas **não apaga** a base local.

## 5. Persistência offline

Após sincronização válida, persistir localmente o necessário à venda:
- clientes;
- produtos ativos;
- preços;
- estoque conhecido;
- catálogo;
- configurações comerciais;
- regra de venda sem estoque;
- demais dados exigidos pela operação.

A base comercial ativa sempre deve ser uma versão integral validada. Uma tentativa de sincronização incompleta não pode substituir nem corromper a última base válida.

## 6. Histórico de documentos

Pedidos e Orçamentos históricos do Sistema Online **NUNCA** são baixados para o App.

O histórico no aparelho contém somente documentos originados no armazenamento local daquele aparelho/contexto.

Mesmo login em aparelhos A e B:
- A vê documentos locais A;
- B vê documentos locais B;
- documentos enviados ficam centrais no servidor, mas não voltam ao outro aparelho como histórico local.

Aparelho novo/reinstalado:
- zero histórico local;
- baixa base comercial;
- não baixa Pedidos/Orçamentos históricos.

Documento não enviado perdido junto com o aparelho não é recuperável do servidor.

## 7. Pedidos

Tela principal com **exatamente duas abas**:
- TODOS
- NÃO ENVIADOS, com contador

Não criar aba “Enviados”.

A listagem pode mostrar estados do sistema como:
- Em orçamento
- Concluído
- Faturado
- Parcialmente faturado

Pode agrupar por data. Botão flutuante “+” inicia operação.

## 8. Novo orçamento e catálogo

Toda nova operação nasce como **ORÇAMENTO**.

Fluxo:
Pedidos → + → Novo Orçamento → selecionar cliente → adicionar produtos → catálogo → carrinho → retornar ao orçamento.

Cliente é obrigatório antes de habilitar ADICIONAR PRODUTOS.

Quando habilitado, o botão deve ser largo, retangular, escuro/preto, texto branco centralizado em caixa alta.

O catálogo/Loja Virtual existente do Delivery deve ser reutilizado por integração quando a API/módulo oficial estiver disponível. O App terá uma interface de catálogo offline baseada na base local, preservando o cliente selecionado.

## 9. Ações distintas do documento

SALVAR:
- persiste localmente;
- nunca transmite.

GERAR PEDIDO:
- converte o mesmo documento de Orçamento para Pedido;
- conversão definitiva;
- não cria segundo documento;
- não transmite.

ENVIAR PARA O SISTEMA ONLINE:
- ação explícita do vendedor;
- transmite o tipo atual do documento;
- exige internet;
- só marca enviado após confirmação do servidor.

SALVAR ≠ GERAR PEDIDO ≠ ENVIAR.

Sincronização geral jamais transmite Pedidos/Orçamentos.

Pedido ainda não enviado pode ser editado e excluído localmente. Pedido não volta a Orçamento.

## 10. Ordem de ações no orçamento

Ordem vertical obrigatória:
1. Gerar pedido
2. Enviar para o sistema online
3. Enviar por e-mail
4. Compartilhar orçamento

## 11. Transmissão, falha e idempotência

Ao enviar:
- Orçamento → servidor recebe Orçamento;
- Pedido → servidor recebe Pedido.

Offline:
- informar ausência de conexão;
- não enviar;
- manter salvo;
- manter em NÃO ENVIADOS.

Sem envio automático quando a internet retorna.

Timeout, queda, erro ou resposta incompleta:
- não marcar enviado;
- permanecer NÃO ENVIADO;
- permitir nova tentativa manual.

Cada documento possui:
- ID local globalmente único;
- chave de idempotência estável por intenção de envio.

Se servidor processar e resposta se perder, o retry com a mesma chave deve retornar o registro oficial já criado, nunca duplicar.

Após aceite:
- servidor fornece ID/número oficial;
- App grava o número;
- documento é bloqueado permanentemente para edição/exclusão no App.

Exibir aviso equivalente a “Documento bloqueado porque já está no Sistema Online.” e ação VER NO SISTEMA ONLINE.

## 12. Exclusão e duplicação

Não enviado:
- pode excluir localmente, com confirmação.

Enviado:
- não pode editar;
- não pode excluir;
- pode consultar.

DUPLICAR PEDIDO:
- só aparece após envio bem-sucedido;
- usar esse nome mesmo se o original enviado era Orçamento;
- sempre cria **novo Orçamento local**;
- novo ID, data atual e vendedor atualmente autenticado;
- original permanece bloqueado.

Duplicação copia somente:
1. cliente original se ainda ativo/existente;
2. produtos ativos/válidos;
3. quantidades válidas recalculadas conforme base offline atual.

Não copiar:
- forma de pagamento;
- condição;
- descontos;
- acréscimos;
- frete;
- transportadora;
- observações;
- informações adicionais;
- demais complementares.

Se cliente original inativo: novo orçamento sem cliente.
Se produto inativo: não copiar.

## 13. Regra de preço

Sempre usar o preço da **base offline mais atual disponível no aparelho** sempre que houver reabertura, recálculo, divergência ou duplicação de documento não enviado.

Aplica-se a duplicação, Orçamento não enviado, Pedido não enviado e qualquer recálculo pertinente.

Não existe preço por cliente nesta especificação.

## 14. Produtos

Somente produtos ativos podem ser usados em nova venda.

Se produto for inativado no servidor, próxima sincronização:
- atualiza estado;
- impede nova utilização;
- remove o item de documento ainda não enviado;
- recalcula totais.

No App pode consultar, pesquisar, visualizar informações, preço/estoque conhecido e adicionar à venda.

Não permitir no App: cadastrar produto, editar, inativar, alterar preço ou administrar estoque.

## 15. Estoque

Estoque local = valor da última sincronização comercial válida.

Configuração empresarial: **PERMITIR VENDA SEM ESTOQUE = SIM/NÃO**.

SIM: produto ativo pode ser vendido acima do estoque, com zero e potencialmente negativo no servidor.

NÃO:
- limitar quantidade à disponibilidade;
- documento passa a conter somente a quantidade aceita;
- não mostrar “solicitado/atendido”;
- recalcular totais;
- estoque zero remove item;
- não rejeitar demais itens.

Para Pedido enviado ao servidor com venda sem estoque = NÃO:
- servidor valida estoque atual;
- servidor pode reduzir quantidade item a item;
- App aplica a quantidade final aceita e recalcula.

Orçamento não baixa, não reserva e não compromete estoque. Pode ser enviado integralmente mesmo acima do estoque. Se depois virar Pedido no Sistema Online, aplicar regra de estoque naquele momento.

## 16. Clientes

Tela Clientes serve ao menu e ao seletor no orçamento. Selecionar cliente no contexto de orçamento retorna ao documento.

No App, inclusive offline: consultar, cadastrar e editar todos os campos permitidos. Não permitir excluir ou inativar.

Cliente novo offline pode ser usado imediatamente. Ao enviar documento relacionado:
1. criar ou vincular cliente no servidor;
2. receber ID oficial;
3. vincular local;
4. transmitir documento.

Cliente editado offline: ao enviar documento, transmitir alterações do cliente, confirmar/vincular e depois transmitir documento.

Cliente pendente sem documento é transmitido na sincronização geral.

CPF/CNPJ é chave de prevenção de duplicidade **dentro da mesma empresa**. Se já existe no servidor, vincular ao oficial.

Conflito no mesmo campo offline/online: vence alteração mais recente por timestamp controlado pelo sistema. Sem tela manual nesta versão.

Cliente inativo/excluído não pode ser usado em nova operação.

## 17. Sincronização geral manual

Um único comando: SINCRONIZAR.

Não sincronizar base comercial automaticamente quando internet retorna.

Ordem:
1. transmitir novos clientes e alterações pendentes, processando itens válidos de forma independente;
2. baixar/atualizar base comercial integral necessária.

Nunca transmitir Pedidos/Orçamentos.

Falha isolada em cliente não impede os demais. Se a base comercial foi atualizada corretamente, a sincronização pode ser considerada concluída com sucesso.

Transação da base:
- baixar para staging;
- validar;
- só então ativar;
- em falha, manter base anterior;
- última sincronização só muda após sucesso integral da base.

## 18. Campos complementares

Opcionais: forma de pagamento, condição, frete, transportadora, desconto, acréscimo, observações e informações adicionais.

Quando preenchidos, persistir local e transmitir com documento. Não tornar obrigatórios.

## 19. Conta bloqueada / inadimplente / teste expirado

Se já existe base válida:
- continuar trabalhando offline com a última base;
- não invalidar por expiração periódica.

Conta bloqueada:
- não pode executar nova sincronização comercial;
- tentativa deve informar bloqueio sem substituir base;
- **ainda pode transmitir explicitamente Pedidos/Orçamentos**.

## 20. Tarefas / Missões

Mesmo App. Não exigir segundo aplicativo. Vendedor vê somente tarefas destinadas a ele.

Exceção à sincronização comercial manual:
- nova missão pode chegar automaticamente quando online;
- push/notificação;
- som conforme permissão;
- persistir para uso offline.

Missão já recebida pode ser executada offline e guardar conclusão, observações, ocorrências, fotos, localização, evidências e dados previstos pelo módulo.

Retorno de missão offline fica pendente; online pode ser transmitido automaticamente quando conectividade retornar.

## 21. Localização operacional

Enquanto autenticado + online + permissões concedidas, o App pode transmitir localização operacional para o Mapa da Equipe.

Respeitar Android/iOS/navegador e limitações de segundo plano.

Offline não há rastreamento em tempo real. Evidência de localização de missão pode ser persistida e enviada depois.

## 22. Relatórios e Comissões

Área exclusivamente online. Mostrar somente dados do vendedor autenticado, conforme servidor: próprias vendas, resultados e comissões.

Sistema Online deve possuir página “RELATÓRIOS E COMISSÕES DO VENDEDOR” quando o backend correspondente estiver disponível.

Sem internet: informar necessidade de conexão.

## 23. Sistema Online

Abre plataforma Óris360° com usuário e empresa ativos.

Usar login integrado/SSO quando a API oficial permitir. Sessão válida no App deve evitar nova digitação de senha.

Permissões web continuam as permissões normais do Sistema Online.

Sem internet: bloquear com mensagem clara.

## 24. IA no WhatsApp

Menu obrigatório. Nesta etapa é integração prevista. Não inventar arquitetura de agentes, autenticação ou marca alheia.

## 25. Ajuda

Mostrar WhatsApp/telefone oficial e e-mail oficial. Valores são configuração central remota/cacheada.

**Não inventar valores.** Alterações futuras não devem exigir republicar o App.

## 26. Reuso do ecossistema

Preferir adaptadores para integrar capacidades existentes: Pedidos, Clientes, cadastro, Orçamento, Loja Virtual/Catálogo Delivery, Tarefas/Missões e componentes compatíveis.

Como nenhum repositório/API oficial Óris360° está acessível nesta sessão, a implementação terá contrato OrisGateway e DemoOrisGateway para operação demonstrável. Um gateway HTTP real substitui o demo sem alterar regras de domínio.

## 27. Matriz online/offline

| Operação | Offline | Online |
|---|---|---|
| Criar/editar cliente | Sim | Sim |
| Consultar produtos/catálogo | Sim | Sim |
| Criar Orçamento/Pedido | Sim | Sim |
| Salvar | Sim | Sim |
| Gerar Pedido | Sim | Sim |
| Enviar Pedido/Orçamento | Não | Sim, ação explícita |
| Sincronizar base comercial | Não | Sim, manual |
| Receber missão em tempo real | Não | Sim |
| Executar missão recebida | Sim | Sim |
| Transmitir retorno de missão | pendente | pode ser automático |
| Relatórios/Comissões | Não | Sim |
| Sistema Online | Não | Sim |
| Rastreamento em tempo real | Não | Sim, com permissões |

## 28. As 20 regras-mãe

- **R1** Offline vende depois da primeira base válida.
- **R2** Sincronização comercial é manual.
- **R3** SINCRONIZAR nunca envia Pedido/Orçamento.
- **R4** Documento só é enviado por ação explícita.
- **R5** Missões são exceção de comunicação automática.
- **R6** Documento enviado fica bloqueado.
- **R7** Duplicação sempre nasce Orçamento.
- **R8** Preço = base offline mais atual.
- **R9** Produto inativo não pode ser usado.
- **R10** Cliente inativo não pode ser usado.
- **R11** Sem venda sem estoque, limitar item sem rejeitar os demais.
- **R12** Orçamento não movimenta/reserva estoque.
- **R13** Histórico central de documentos nunca é baixado.
- **R14** Contextos usuário/empresa/dispositivo nunca se misturam.
- **R15** Logout não apaga dados locais.
- **R16** Conta bloqueada impede sync, preserva offline.
- **R17** Conta bloqueada ainda pode transmitir documento.
- **R18** CPF/CNPJ evita duplicidade intraempresa.
- **R19** Toda transmissão tem idempotência.
- **R20** Sync interrompida nunca inutiliza última base válida.

## 29. Critérios de aceite obrigatórios

1. Primeiro login offline falha; após primeira sync, venda offline funciona.
2. Troca de empresa não mistura dados.
3. Usuários no mesmo aparelho não veem pendências uns dos outros.
4. SINCRONIZAR não envia Pedido/Orçamento.
5. Documento só vira enviado após confirmação.
6. Retry após resposta perdida não duplica.
7. Documento enviado é somente leitura.
8. Duplicação cria novo Orçamento, data/vendedor atuais, complementares vazios.
9. Produto inativo não pode permanecer utilizável.
10. Cliente inativo não pode permanecer utilizável.
11. Pedido 10, servidor 6, sem venda sem estoque → 6.
12. Estoque zero em um item não rejeita os demais.
13. Orçamento não movimenta estoque.
14. Orçamento 10 convertido online com 6 disponíveis e regra NÃO → Pedido 6.
15. Queda durante sync preserva última base.
16. Aparelho novo não baixa histórico central.
17. Logout preserva documentos locais.
18. Conta bloqueada impede sync e mantém offline.
19. Conta bloqueada permite envio explícito.
20. Missão recebida executa offline.
21. Retorno de missão pendente pode enviar automaticamente ao reconectar.
22. Relatórios/Comissões exigem internet.
23. Sistema Online exige internet e usa login/contexto integrado quando possível.
24. CPF/CNPJ existente não cria cliente duplicado.

## 30. Arquitetura aprovada

- React + TypeScript + Vite.
- PWA com service worker e manifest.
- IndexedDB via Dexie.
- Mobile-first.
- Componentes e domínio independentes de API.
- Todo registro operacional inclui deviceId, userId, companyId ou scopeKey derivado.
- Camadas: domain, infrastructure, services, ui e tests.
- Sincronização por staging + validação + commit atômico.
- Transmissão explícita prepara/vincula cliente, recalcula preço, valida estoque de Pedido no servidor, usa idempotência e bloqueia somente após confirmação.

## 31. Limites externos conhecidos

Sem APIs oficiais Óris360° disponíveis, não é tecnicamente possível afirmar integração de produção com autenticação, Delivery, Missões, SSO, relatórios, ajuda central ou número oficial real.

A entrega deve:
- funcionar integralmente em modo demo/local para validação das regras;
- possuir interface de gateway pronta para backend real;
- nunca inventar endpoint/credencial/telefone/e-mail;
- documentar exatamente quais contratos o backend real precisa cumprir.

## 32. Definition of Done

Só considerar o projeto concluído quando:
- build de produção passa;
- testes unitários/de domínio passam;
- 24 testes de aceite estão cobertos;
- PWA gera manifest/service worker;
- Netlify config está presente;
- review de código não encontra defeito crítico/importante aberto;
- regras-mãe são revisadas contra implementação;
- limitações externas estão explicitadas sem mascarar funcionalidades inexistentes.
