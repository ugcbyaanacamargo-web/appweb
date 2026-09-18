# Óris360° — Contrato para conectar a API real

A PWA não inventa URLs de produção. Toda integração externa é abstraída pela interface TypeScript `OrisGateway` em `src/infrastructure/orisGateway.ts`.

O ponto único de composição é `src/infrastructure/gatewayFactory.ts`. Quando a API estiver pronta, implemente um adaptador HTTP que satisfaça `OrisGateway` e troque a fábrica. As regras de domínio, IndexedDB, sincronização e telas não precisam ser reescritas.

## Contratos obrigatórios

### Autenticação
- autenticar e-mail/senha somente online na primeira ativação;
- retornar usuário e todas as empresas vinculadas;
- emitir sessão/token adequado à plataforma;
- criar nova conta Óris360° e ambiente/loja no fluxo **Criar uma conta**;
- teste gratuito de 7 dias sem cobrança automática.

### Snapshot comercial
Deve retornar, para a empresa ativa:
- clientes necessários à operação;
- produtos e tombstones/estado inativo suficiente para retirar produto recém-inativado de documentos locais;
- preço atual;
- estoque atual;
- `allowSaleWithoutStock`;
- estado de bloqueio;
- contatos centrais de Ajuda;
- URL/metadata necessária ao Sistema Online/SSO.

**Nunca incluir histórico central de Pedidos ou Orçamentos.**

A PWA só ativa o snapshot depois de recebê-lo e validá-lo integralmente. Falha de rede não pode alterar a base válida anterior.

### Cliente
`upsertCustomer` deve:
- operar no escopo da empresa ativa;
- usar CPF/CNPJ normalizado como prevenção de duplicidade intraempresa;
- retornar ID oficial;
- respeitar a regra de conflito pelo timestamp mais recente;
- nunca permitir que o App inative/exclua cliente.

Ao enviar documento com cliente novo/editado, o cliente é resolvido primeiro e o documento usa o ID oficial no payload remoto.

### Pedido / Orçamento
`sendDocument` deve:
- aceitar a chave de idempotência estável do documento;
- retornar sempre o mesmo registro oficial quando a mesma chave reaparecer;
- preservar Orçamento como Orçamento;
- não movimentar/reservar estoque para Orçamento;
- para Pedido com venda sem estoque = NÃO, validar estoque atual item a item e devolver quantidades finais aceitas;
- não rejeitar itens válidos só porque outro item ficou sem estoque;
- retornar número oficial e confirmação inequívoca.

O App só marca `sent` depois desta confirmação.

### Missões
A API deve fornecer:
- missões destinadas ao vendedor;
- endpoint de retorno/evidências;
- canal de push/Web Push para entrega em segundo plano.

A PWA já persiste missões e retornos localmente. Enquanto aberta e online também realiza atualização automática. Push real em segundo plano depende do backend de push e da inscrição do service worker.

### Localização
Receber localização operacional apenas quando:
- usuário autenticado;
- conexão disponível;
- permissão do dispositivo concedida.

PWA/navegadores podem limitar rastreamento em segundo plano. Aplicativos nativos podem exigir integração complementar para rastreamento contínuo.

### Relatórios, Sistema Online e IA no WhatsApp
A API/plataforma deve fornecer:
- relatório restrito ao vendedor autenticado;
- dados de comissão;
- mecanismo SSO/login integrado para Sistema Online;
- URL do Sistema Online;
- configuração/contrato da IA no WhatsApp.

### Ajuda
Telefone/WhatsApp e e-mail devem vir da configuração central. Não devem ser hardcoded no bundle.

## Erros esperados

O adaptador deve mapear respostas externas para `GatewayError`:
- `OFFLINE`
- `ACCOUNT_BLOCKED`
- `AUTH_FAILED`
- `NETWORK`
- `SERVER`
- `INVALID_DATA`

## Segurança

- somente HTTPS;
- tokens nunca em query string;
- nenhum segredo de servidor em variáveis `VITE_*` (essas variáveis ficam públicas no bundle);
- autenticação/autorização validadas no servidor;
- escopo empresa/usuário validado no servidor, independentemente do que o cliente enviar;
- idempotência garantida por constraint/registro transacional no backend;
- CPF/CNPJ e demais dados pessoais tratados conforme política/legislação aplicável.
