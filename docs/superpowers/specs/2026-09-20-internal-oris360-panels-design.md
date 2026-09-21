# Óris360° — Sistema Online e painéis no appweb

Data: 2026-09-20
Status: direção corrigida expressamente pelo proprietário do projeto
Fonte funcional: `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`
Repositório ÚNICO sob edição: `ugcbyaanacamargo-web/appweb`
Hospedagem única do produto: `https://oris360-site.netlify.app/`

## Mudança obrigatória de arquitetura

A referência anterior que destinava painel da empresa, painel web do vendedor, cadastros e APIs ao Saboriza está **revogada**. O usuário não autoriza acesso, mudanças ou dependências do Saboriza.

Todas as superfícies Óris360° — mobile, vendedor web, administração da empresa — pertencem ao repositório `appweb`, compartilham sua identidade visual e são publicadas sob o domínio Netlify do projeto.

O Saboriza não é backend, portal, requisito de provisionamento, sistema de autenticação nem fonte central de verdade do Óris360°.

## Superfícies, sem violar o menu mobile

- **App de Vendas mobile:** as dez opções fixas do Prompt Mestre; offline-first após primeiro login e snapshot válidos. Pedidos é home; duas abas Todos/Não enviados.
- **Painel Web do Vendedor:** área separada do App, acessada por Sistema Online quando autorizado; dados centrais somente online, relatório/comissão, documentos enviados do próprio vendedor, clientes e Missões permitidos.
- **Painel da Empresa:** área administrativa própria para titulares/administradores, produtos/fotos/categorias, clientes, vendedores/convites, carteira por vendedor, comissões, documentos recebidos, Missões, equipe/mapa e configurações comerciais.

Os painéis NÃO serão uma décima primeira opção do menu mobile e NÃO acrescentam/retiram páginas do padrão global do App de Vendas. A navegação `Sistema Online` abre a superfície interna apropriada à identidade e papel do usuário.

## Arquitetura de dados e segurança

O Netlify continua hospedando o frontend/PWA. Um **backend autenticado com persistência central**, políticas multiempresa e storage de imagens permanece necessário para operação real entre aparelhos, e deve integrar o mesmo repositório (funções/endpoints e migrations versionadas), sem fingir que `localStorage` de um navegador cria uma API pública sincronizada. A escolha do provedor de armazenamento/identidade depende de ambiente e credenciais autorizadas do Óris360°, nunca do Saboriza.

O domínio central terá:
- contas e usuários;
- empresas e memberships por usuário;
- papéis owner/admin/seller validados server-side;
- perfil de vendedor/comissão;
- carteira de clientes por empresa/vendedor;
- produtos, categorias, mídia, preço/unidade/pack, ativo e estoque oficial;
- clientes, CPF/CNPJ, regras de conflitos;
- documentos centrais quote/order, idempotency key, vendedor e número oficial;
- Missões e atribuições/evidências;
- configurações, bloqueio/trial, ajuda, push e localização;
- dados filtrados para relatórios e comissões.

Nenhum dado de outra empresa/vendedor será liberado por alterar URL, companyId ou sellerId no navegador.

## Primeira fatia de implementação no appweb

1. Remover a dependência de navegação para o Saboriza: Sistema Online deve abrir somente área Óris360° ou explicitar indisponibilidade segura se backend de produção não estiver pronto.
2. Criar identidade/navegação de painel web separado, mantendo o App e menu mobile intactos.
3. Reutilizar a infraestrutura DEMO do próprio appweb para demonstrar **fluxos realmente persistidos no mesmo navegador**, com etiqueta DEMO em todas as operações; incluir produto manual com preço/SKU/estoque/ativo e foto de origem local, e relatório do vendedor baseado nos documentos centrais DEMO.
4. Permitir que o vendedor obtenha produtos modificados pelo administrador DEMO somente após SINCRONIZAR, nunca automaticamente, e nunca enviar documentos pelo sync.
5. Testar criar produto → recarregar painel → voltar ao App → sincronizar manualmente → consultar/vender, incluindo status inativo, preço e isolamento de empresa.

Em produção, sem backend central real, **não** anunciar painel DEMO como administração compartilhada, SSO real, backup em nuvem ou integração entre aparelhos.

## Fases seguintes

1. Backend central próprio do Óris360° em `appweb`: Auth, RBAC/membership e empresas.
2. CRUD de produto/categoria e imagem autenticada com storage, validação, versão e unidade/pack.
3. Gestão de vendedores, carteiras, clientes e comissões.
4. Snapshot transacional, estoque, clientes e envio de documento idempotente.
5. Painel vendedor central com relatórios, Missões e própria carteira; painel empresa com acompanhamento.
6. Push, mapa de equipe, ajuda e IA/WhatsApp nos limites da especificação.
7. E2E com 2 vendedores, 2 empresas, 2 aparelhos, offline, reenvio, permissões e falhas.

## Não objetivos

- Editar `Ruanzinn01/Saboriza-Catalogo`.
- Redirecionar usuário para `saboriza-catalogo.vercel.app`.
- Expor cadastro de produtos no menu mobile do vendedor.
- Declarar modo DEMO backend compartilhado ou serviço de produção.
- Alterar as 20 regras-mãe e os 24 critérios de aceite.
