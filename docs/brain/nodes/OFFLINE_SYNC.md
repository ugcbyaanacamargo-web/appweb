# Node: OFFLINE_SYNC

requires: [DATA_PERSISTENCE](./DATA_PERSISTENCE.md)  
related: [SALES_DOCUMENTS](./SALES_DOCUMENTS.md), [API_INTEGRATION](./API_INTEGRATION.md)  
next: [TESTING_QA](./TESTING_QA.md)

Regras centrais:
- offline-first após primeira base válida;
- sincronização comercial é manual;
- sincronização nunca envia Pedido/Orçamento;
- clientes pendentes são processados antes da nova base;
- snapshot novo só substitui o anterior após validação completa;
- falha parcial de cliente não deve destruir uma atualização comercial válida;
- retorno de Missão pode ter comportamento automático separado.
