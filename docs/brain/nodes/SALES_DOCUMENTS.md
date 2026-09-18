# Node: SALES_DOCUMENTS

requires: [OFFLINE_SYNC](./OFFLINE_SYNC.md), [DATA_PERSISTENCE](./DATA_PERSISTENCE.md)  
related: [FRONTEND](./FRONTEND.md), [API_INTEGRATION](./API_INTEGRATION.md)  
next: [TESTING_QA](./TESTING_QA.md)

Invariantes de Orçamento/Pedido:
- toda nova operação nasce Orçamento;
- salvar, gerar Pedido e enviar são ações distintas;
- envio é sempre explícito;
- idempotência é obrigatória;
- confirmação do servidor é necessária antes de marcar enviado;
- documento enviado fica bloqueado;
- duplicação de enviado sempre cria novo Orçamento;
- preço é recalculado pela base offline mais atual aplicável;
- histórico central nunca é baixado para o App.
