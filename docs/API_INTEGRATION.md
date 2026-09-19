# Óris360° — Contrato para conectar a API real

A PWA não inventa URLs de produção. Toda integração externa passa pela interface TypeScript `OrisGateway`.

## Como conectar sem alterar o código

Na tela inicial do App:

`CONFIGURAR INTEGRAÇÃO → API REAL`

Informe:
1. a **URL base HTTPS** do backend Óris360°;
2. as rotas correspondentes aos contratos abaixo;
3. toque **TESTAR CONEXÃO E SALVAR**.

O App primeiro executa a rota de saúde. A configuração só é ativada se a API responder com sucesso. Depois disso, login e demais operações usam automaticamente o adaptador HTTP.

### Onde obter esses valores

Use uma destas fontes:
- documentação OpenAPI/Swagger do backend Óris360°;
- documentação técnica da API existente;
- equipe responsável pelo backend/Sistema Online.

Não copie URLs de tela do navegador supondo que sejam endpoints.

### Segurança de chaves/API secrets

**Não existe campo para chave privada no App de propósito.**

Qualquer segredo que permita acesso de servidor deve ficar:
- no backend Óris360°; ou
- em variável protegida de um backend/proxy autorizado (por exemplo, função server-side da hospedagem).

Variáveis `VITE_*`, localStorage e código JavaScript entregue ao navegador são públicos para o usuário e não devem conter segredo de servidor.

O App pode enviar o token de sessão do próprio usuário no header `Authorization: Bearer ...` depois do login.

## Convenção HTTP esperada pelo adaptador

A URL final é `URL base + rota configurada`.

Respostas podem ser:
- o objeto JSON diretamente; ou
- `{ "data": <objeto> }`.

Erros devem usar status HTTP coerente. Quando houver corpo:
```json
{
  "error": {
    "code": "auth_failed",
    "message": "Mensagem segura para o usuário"
  }
}
```

O adaptador envia, quando houver contexto autenticado:
- `Authorization: Bearer <token-da-sessão>`;
- `X-Oris-Company-Id`;
- `X-Oris-User-Id`.

Tokens nunca são enviados em query string.

## Rotas configuráveis

| Campo da tela | Método | Finalidade |
|---|---|---|
| Saúde / teste da API | GET | Confirmar que o backend está disponível |
| Login | POST | Autenticar e devolver usuário, empresas e token de sessão |
| Criar conta | POST | Criar nova conta/ambiente com teste de 7 dias |
| Recuperar senha | POST | Iniciar recuperação sem revelar se o e-mail existe |
| Base comercial | GET | Snapshot de clientes/produtos/preços/estoque/configuração |
| Enviar cliente | POST | Criar/vincular/atualizar cliente |
| Enviar Pedido/Orçamento | POST | Transmitir explicitamente com idempotência |
| Receber Missões | GET | Missões atribuídas ao vendedor |
| Retorno de Missão | POST | Conclusão/evidências |
| Localização operacional | POST | Localização autorizada |
| Relatórios e Comissões | GET | Dados somente do vendedor autenticado |
| Login integrado / SSO | POST | Criar URL temporária segura para Sistema Online |
| IA no WhatsApp | GET | Estado da integração e URL de gerenciamento quando permitida |
| Push de Missões | POST | Registrar assinatura Web Push do aparelho |

## Contratos de dados obrigatórios

### Login

Entrada:
```json
{ "email": "usuario@empresa.com", "password": "..." }
```

Saída:
```json
{
  "data": {
    "user": { "id": "u1", "name": "Nome", "email": "usuario@empresa.com" },
    "companies": [{ "id": "c1", "name": "Empresa" }],
    "token": "token-de-sessao-do-usuario"
  }
}
```

### Base comercial

Deve retornar:
- clientes necessários à operação;
- produtos e estado ativo/inativo;
- preço atual;
- estoque atual;
- `allowSaleWithoutStock`;
- `accountBlocked`;
- contatos centrais de Ajuda;
- `onlineBaseUrl` quando aplicável;
- `missionPushPublicKey` (VAPID pública) quando houver Web Push.

**Nunca incluir histórico central de Pedidos/Orçamentos.**

A PWA só ativa o snapshot depois de recebê-lo e validá-lo integralmente.

### Cliente

A rota deve:
- operar no escopo da empresa ativa;
- usar CPF/CNPJ normalizado para evitar duplicidade;
- retornar ID oficial;
- respeitar timestamp mais recente;
- não permitir que o App inative/exclua cliente.

O formato atual do cliente contém nome/CPF-CNPJ porque estes são os campos cujo contrato está disponível neste repositório. Campos adicionais oficiais devem ser adicionados quando o schema real do backend for fornecido; o App não inventa nomes/campos comerciais.

### Pedido / Orçamento

A rota deve:
- aceitar a chave de idempotência estável;
- devolver o mesmo registro oficial para repetição da mesma chave;
- preservar Orçamento como Orçamento;
- não movimentar estoque em Orçamento;
- validar estoque em Pedido quando venda sem estoque = NÃO;
- devolver quantidades finais aceitas;
- devolver número oficial e confirmação inequívoca.

O App só marca `sent` depois dessa confirmação.

### Relatórios e Comissões

Resposta:
```json
{
  "data": {
    "periodLabel": "Mês atual",
    "ordersCount": 10,
    "quotesCount": 3,
    "grossSales": 12500,
    "commissionPercent": 5,
    "commissionValue": 625
  }
}
```

O servidor é responsável por limitar os dados ao usuário autenticado.

### Sistema Online / SSO

Resposta:
```json
{
  "data": {
    "available": true,
    "url": "https://sistema.example.com/sso/one-time-token"
  }
}
```

A URL deve ser HTTPS e temporária. Não coloque senha ou token reutilizável em query string.

### IA no WhatsApp

Resposta:
```json
{
  "data": {
    "available": true,
    "connected": true,
    "managementUrl": "https://sistema.example.com/integracoes/whatsapp",
    "message": "Integração ativa"
  }
}
```

### Push de Missões

A chave **pública** VAPID vem no snapshot como `missionPushPublicKey`.

O App registra uma assinatura contendo:
```json
{
  "subscription": {
    "endpoint": "https://push-service/...",
    "expirationTime": null,
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

A chave VAPID **privada** permanece exclusivamente no servidor. O backend usa a assinatura para enviar notificações de novas Missões.

## Erros esperados

O adaptador converte respostas externas para:
- `OFFLINE`
- `ACCOUNT_BLOCKED`
- `AUTH_FAILED`
- `NETWORK`
- `SERVER`
- `INVALID_DATA`

## Dependências externas ainda necessárias

O lado cliente está preparado para os contratos acima. Para funcionamento de produção ainda são externos:
- URL/rotas oficiais da API Óris360°;
- implementação server-side correspondente;
- mecanismo SSO real;
- provedor/integração real de WhatsApp/IA;
- VAPID privada e envio Web Push server-side;
- schema completo de campos adicionais de Cliente, se existir;
- fonte do módulo Delivery caso o catálogo existente deva ser reutilizado literalmente.

Nenhum desses valores deve ser inventado pelo App.
