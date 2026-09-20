# Óris360° — Auditoria integral de fluxos e painéis

Data da auditoria: 2026-09-20
Base: appweb main aa61e314512d52a3b096a46bb6e1a393dbc88ce6
Sistema Online examinado (código público, somente leitura): Ruanzinn01/Saboriza-Catalogo main 60ff532c1d133a8977e9d6bb0474517ba7b2f93b
Contrato: docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt
Arquitetura vigente: docs/superpowers/specs/2026-09-19-oris360-complete-platform-design.md

## Método e limite da evidência

A auditoria rastreou telas, rotas, ações, modelos, serviços, adaptadores, persistência e testes dos dois repositórios. As URLs públicas não puderam ser carregadas interativamente nesta sessão pelos instrumentos de navegação; portanto NÃO afirmamos ter clicado nos ambientes produtivos, testado RLS do banco real ou acessado o Supabase. O appweb tem evidência anterior de CI/Playwright/Netlify, mas esses testes não provam a ligação produtiva entre os dois projetos.

Marcação utilizada:
- EXISTE NO APP / SABORIZA (código): implementação encontrada no código; não implica que integração cruzada foi verificada.
- DEMO/CONTRATO: interface local ou chamada abstrata testável com simulação, não backend produtivo.
- AUSENTE NO SISTEMA EXAMINADO: nenhum fluxo correspondente identificado na fonte inspecionada.
- NÃO COMPROVADO: depende do Supabase/deploy, permissões ou contrato de servidor fora da evidência.

## Três experiências distintas, sem duplicar administração

1. **App mobile do vendedor**: appweb/Netlify, dez opções fixas, orçamentos/pedidos locais, offline-first.
2. **Painel web separado do vendedor no Sistema Online**: ambiente Saboriza autenticado, com rotas e permissões próprias do vendedor para relatório/comissão, pedidos enviados e tarefas/cliente de sua carteira conforme funções autorizadas. NÃO existe rota `/vendedor` nem área equivalente verificada no Saboriza examinado. Painel web NÃO importa histórico para o App mobile.
3. **Painel da empresa/administrador**: Saboriza `/admin` com produtos, categorias, clientes, fornecedores, pedidos, indicadores e configurações. Falta gestão específica do canal de vendedores e políticas comerciais Óris360°.

O App mobile não deve ganhar CRUD de produtos ou outro menu administrativo. O painel web do vendedor não é uma 11ª opção do App: o item fixo SISTEMA ONLINE abre o acesso apropriado às permissões do usuário.

## Auditoria de um percurso real de ponta a ponta

| Etapa que uma pessoa precisa executar | Evidência atual | Lacuna / resultado ainda impossível de comprovar |
|---|---|---|
| Titular cria conta com trial 7 dias, sem cobrança | appweb `App.tsx` chama gateway; demo cria conta | Provisionamento real de titular + empresa + trial no Supabase, credencial compartilhada e estado de bloqueio não disponíveis como contrato produtivo |
| Empresa entra no sistema | Saboriza `/admin/login`, Supabase Auth | Vínculos multiempresa, owner/admin/seller e separação por permissões não identificados no código examinado |
| Empresa cadastra produto manualmente | Saboriza `/admin/produtos/novo`, `ProductFormPage.tsx`, `catalog-store.ts` | Já existe formulário; não duplicar no appweb. Revisar validação de preço/pack, persistência e autorização no banco antes de chamar fluxo interligado de pronto |
| Empresa adiciona foto de produto | Saboriza `ImageUploader.tsx` envia imagem até 5 MB ao bucket `product-images`; `ProductImageSheet.tsx` altera foto | Modelo atual tem `imageUrl` singular. Galeria de múltiplas fotos não encontrada; bucket e políticas de upload de produção não verificados. Modelo `Product` do appweb não contém imagem |
| Empresa informa embalagem/preço | Saboriza `unit_price`, `pack_quantity`, apresentação e tipo de embalagem | Appweb só tem preço e quantidade genéricos; mapper rejeita `pack_quantity != 1`. Sem regra comum unidade/pack, valores e estoque podem ser calculados incorretamente |
| Empresa cadastra SKU/código/estoque | Não encontrados como recursos completos no schema público de produto inspecionado; mapper appweb exige SKU e stock oficiais | Definir identificador central oficial, saldo calculado e unidades/pack; estoque não pode ser inventado como 0 |
| Empresa cadastra vendedor | Saboriza não possui rota/página de vendedores no `App.tsx` | Criar perfis, convite/vínculo com Supabase Auth, ativação/bloqueio e vínculo à empresa |
| Empresa define comissão do vendedor | Não identificado no Saboriza | Regra central de percentual, base de cálculo/elegibilidade, vínculo aos documentos, consulta e auditoria |
| Empresa associa clientes ao vendedor | Saboriza já possui clientes, sem carteira/atribuição identificada | Atribuir/transferir carteira e filtrar snapshot por empresa/vendedor; CPF + CNPJ por empresa |
| Vendedor entra com mesma conta | appweb autentica via `DemoOrisGateway` ou HTTP genérico; Saboriza via Supabase Auth | Login integrado real, memberships, empresa ativa, primeira sincronização por empresa e recuperação de conta compartilhada |
| Vendedor abre painel web exclusivo | appweb `Reports` contém quatro indicadores via gateway; `Sistema Online` abre link `/admin/login` | Falta rota/painel web do vendedor e acesso por papel; não confundir cards mobile com painel web |
| Vendedor recebe clientes e produtos | appweb Dexie + snapshot manual com transação e teste; mapper isolado Saboriza | Falta endpoint/RPC transacional real do Saboriza; converter foto, embalagem, preço e estoque em snapshot autorizado |
| Vendedor abre catálogo com fotos offline | appweb `Products.tsx` usa inicial do produto; `Product` não tem imageUrl | Imagem/foto, descrição e apresentação no snapshot + cache offline real de imagens, estados sem imagem e espaço no aparelho |
| Vendedor cria Orçamento e Pedido offline | appweb implementa e testa fluxos locais | Verificar com novos dados reais/pack, cliente ativo, estoque e preço vindos do Saboriza; preservar somente duas abas |
| Vendedor envia Orçamento/Pedido | `transmit.ts` exige ação explícita; demo simula resposta oficial | Saboriza `create_order` é pedido do checkout, sem contrato verificado para Orçamento, idempotência Óris, quantidade aceita e número oficial de ambos |
| Empresa enxerga pedido recebido | Saboriza possui `orders`/`order_items` e tela de pedidos | Falta prova de envio entre os sistemas e vínculo a empresa/vendedor. Confirmar visibilidade, status e proteção contra duplicação |
| Vendedor vê seus pedidos no painel web | Saboriza não possui rota/vista seller-scoped | Buscar documentos centrais somente online e somente do próprio vendedor; NUNCA baixar esse histórico para o App |
| Empresa cria/atribui Missão | appweb recebe e executa Missões localmente | Emissor, atribuição, formulários/tipos/evidências, serviço de retorno, visão administrativa e autorização faltam no Saboriza examinado |
| Vendedor recebe notificação | appweb possui assinatura/handlers de Web Push | Backend de subscriptions/push com credenciais privadas, atribuição filtrada e permissão do dispositivo |
| Empresa acompanha equipe/mapa | appweb possui coleta de localização condicionada a consentimento/internet | Armazenamento/retenção, consulta e mapa autorizados no Saboriza faltam |
| Vendedor consulta relatório/comissão | appweb `fetchSellerReport` e quatro cards; Saboriza tem indicadores gerais | Endpoint seller-scoped, tabela/regra de comissão, filtros e página web exclusiva do vendedor |
| Usuário abre Sistema Online sem senha novamente | appweb link Saboriza e contrato `createOnlineSession` | Troca de sessão de uso único, verificação de origem e aplicação de papéis no Saboriza não implementadas |
| Titular configura Ajuda/WhatsApp | appweb espera contatos e status via gateway | Contatos oficiais centrais, painel de configuração e integração WhatsApp/IA server-side não verificados |

## Lacunas por superfície e sua propriedade

### A. App mobile appweb — implementar aqui

- Atualizar o modelo local de produtos para imagem/descrição/categoria/apresentação e unidade de comercialização sem romper documentos anteriores.
- Reutilizar dados/fotos do catálogo existente, mas apresentar e armazenar mídia para uso offline após sincronização válida; controlar tamanho/cota/falhas.
- Adaptar catálogo e seletor do Orçamento aos dados reais, unidade/pack e quantidades válidas.
- Trocar configuração manual de 14 endpoints na jornada comum por integração pré-configurada/diagnóstico avançado.
- Implementar cliente/gateway real autenticado e tradutores de snapshot, clientes, documentos, Missões, relatórios, SSO e status, cada um com testes de payload inválido e falha de rede.
- Manter invariantes: dez itens, duas abas Pedidos, sync comercial manual, envio explícito, histórico local por aparelho, orçamento não movimenta estoque, duplicação sempre orçamento.

### B. Saboriza — trabalho no Sistema Online central, NÃO duplicar no appweb

- **Painel web do vendedor separado** com login/empresa ativa/permissões, relatórios, comissões, próprios pedidos enviados e áreas permitidas pela plataforma.
- Área de vendedores do admin: convite/cadastro, vínculo por empresa, percentual, situação, carteira, acesso e controle de sessão.
- Produto/catálogo existentes: completar campos obrigatórios efetivos para integração (SKU/identificador, estoque oficial, unidade/pack, fotos múltiplas caso adotadas), upload seguro, validação e preview. NÃO afirmar que cadastro manual ou foto única são inexistentes.
- Administração de carteiras/clientes, Missões, atribuições, mapa e relatórios da equipe.
- Documentos centrais com quote/order, vínculo ao vendedor, retorno de número/itens aceitos e confirmação idempotente.
- Trial e bloqueio por conta com operações separadas: sync bloqueado, envio explícito ainda permitido.
- Configuração de contatos oficiais e integrações.

### C. Backend Supabase — contrato obrigatório

- Identidade única, empresas/memberships, perfis e papéis; autorização em cada consulta/operação, não apenas esconder botões.
- RLS por empresa/vendedor; verificar políticas existentes em banco autorizado antes de alteração. `ProtectedRoute` do Saboriza só verifica autenticação e não demonstra role check no cliente; RLS real não foi auditada.
- CPF/CNPJ normalizado e deduplicação por empresa; campos permitidos, cliente inativo, timestamps de conflito.
- Snapshot consistente sem orders; bloqueio sem destruir base; estoque oficial e arredondamento/embalagem.
- Upsert de cliente antes do documento; criação idempotente de orçamento/pedido, reserva/movimentação só onde permitido e resposta final.
- Missões, evidências, subscriptions/push, localização e relatórios filtrados.
- Código SSO de uso único. Secrets sempre server-side.

## Ordem de implementação por percursos completos

1. **Fundação de contas e papéis**: titular → empresa → vínculo vendedor → login separado app/web → autorização multiempresa.
2. **Cadastro comercial central**: produto manual existente → foto(s) → código/unidade/pack/preço/estoque → cliente → carteira atribuída.
3. **Primeira sincronização real**: vendedor entra → escolhe empresa → snapshot autorizado → imagens offline → confirma base sem misturar empresas.
4. **Venda completa**: cliente → catálogo offline → orçamento → salvar/gerar pedido → envio manual → deduplicação/número/estoque → empresa vê documento.
5. **Painel web separado do vendedor**: entrar com mesma conta → ver próprios documentos, vendas e comissões, sem importar histórico central para App.
6. **Gestão de Missões e equipe**: admin atribui → push → execução offline → retorno → empresa acompanha.
7. **Conta, suporte e integrações**: trial/bloqueio, Help, SSO, WhatsApp/IA no escopo previsto.
8. **QA de ponta a ponta**: persona owner/admin/seller, dois vendedores, duas empresas, dois aparelhos, offline/online, reconexão, falha, duplicação e permissão negada.

## Testes humanos indispensáveis para não confundir UI e fluxo completo

- Admin salva produto + foto; novo login e refresh confirmam persistência; vendedor ainda não vê antes de SINCRONIZAR; depois vê foto e preço offline.
- Produto `pack_quantity=12` possui preço e quantidade consistentes no app, orçamento, envio e pedido aceito no servidor.
- Administrador cria vendedor A e B: A não vê carteira/pedidos/comissão de B, mesmo tentando URL/API direta.
- Um mesmo usuário com empresas X/Y não cruza documento, foto/cache comercial, carteira ou relatório.
- Pedido enviado A aparece no painel central/área web do A e admin, mas não entra no histórico local de outro aparelho.
- Timeout após commit server-side + reenvio da mesma chave não duplica pedido.
- Missão criada pela empresa chega só ao destinatário; funciona offline e retorna conforme política.
- Conta bloqueada mantém base local e envio explícito, mas rejeita nova sync comercial.
- Login DEMO não é aceito como login real no painel do Saboriza.

## Evidência/limitação deste checkpoint

**Comprovado por código:** cadastro manual e upload de UMA imagem já existem no Saboriza; App mobile não possui campo foto nem painel web próprio; Saboriza público não contém rotas de vendedor, comissão ou Missão; appweb ainda usa gateway demo/HTTP genérico.

**Não comprovado:** autenticação integrada, RLS real, operações produtivas entre apps, configuração Supabase real, foto disponível offline e funcionamento das novas capacidades em produção.

Nenhuma nova tela foi considerada funcional nesta auditoria. A entrega é o mapeamento de trabalho para especificações/planos menores e implementação TDD.
