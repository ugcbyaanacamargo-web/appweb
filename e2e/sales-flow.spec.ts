import { expect, test, type Page } from '@playwright/test';

async function enterDemoCompany(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'JÁ TENHO CONTA' }).click();
  await expect(page.getByRole('heading', { name: 'Entrar na operação' })).toBeVisible();
  await page.getByRole('button', { name: 'ENTRAR' }).click();
  await expect(page.getByRole('heading', { name: 'Qual empresa está ativa?' })).toBeVisible();
  await page.locator('.company-option').first().click();
  await expect(page.getByRole('dialog', { name: 'Menu principal' })).toBeVisible();
}

async function closeMenu(page: Page) {
  const close = page.getByRole('button', { name: 'Fechar menu' });
  if (await close.isVisible()) await close.click();
}

async function createQuoteWithOneItem(page: Page) {
  await closeMenu(page);
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Novo orçamento' }).click();

  const addProducts = page.getByRole('button', { name: 'ADICIONAR PRODUTOS' });
  await expect(addProducts).toBeDisabled();

  await page.locator('.selection-card').click();
  const activeCustomer = page.locator('.list-card-main:not([disabled])').first();
  await expect(activeCustomer).toBeVisible();
  await activeCustomer.click();

  await expect(addProducts).toBeEnabled();
  await addProducts.click();

  const quantity = page.locator('.quantity-control').first();
  await expect(quantity).toBeVisible();
  await quantity.getByRole('button', { name: '+' }).click();
  await page.getByRole('button', { name: 'VOLTAR AO ORÇAMENTO' }).click();

  await expect(page.getByText('1 produto(s)')).toBeVisible();
}

test('menu global contém exatamente as dez entradas funcionais previstas', async ({ page }) => {
  await enterDemoCompany(page);
  const menu = page.getByRole('dialog', { name: 'Menu principal' });
  const labels = [
    'Pedidos',
    'Clientes',
    'Produtos',
    'Tarefas / Missões',
    'IA no WhatsApp',
    'Relatórios e Comissões',
    'Sistema Online',
    'Ajuda',
    'Sincronizar',
    'Sair da minha conta'
  ];

  for (const label of labels) {
    await expect(menu.getByRole('button', { name: label, exact: true })).toBeVisible();
  }
  await expect(menu.locator('.drawer-item')).toHaveCount(10);
});

test('orçamento exige cliente antes de produtos e persiste após recarregar', async ({ page }) => {
  await enterDemoCompany(page);
  await createQuoteWithOneItem(page);

  await page.getByRole('button', { name: 'SALVAR' }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();

  const unsent = page.getByRole('tab', { name: /NÃO ENVIADOS/ });
  await expect(unsent).toContainText('1');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible({ timeout: 15_000 });
  await closeMenu(page);
  await expect(page.getByRole('tab', { name: /NÃO ENVIADOS/ })).toContainText('1');
  await expect(page.getByText('Documento local')).toBeVisible();
});

test('envio explícito bloqueia documento e duplicação cria novo orçamento', async ({ page }) => {
  await enterDemoCompany(page);
  await createQuoteWithOneItem(page);

  await page.getByRole('button', { name: 'ENVIAR PARA O SISTEMA ONLINE' }).click();

  const lock = page.locator('.lock-banner');
  await expect(lock).toContainText('Documento bloqueado porque já está no Sistema Online.');
  await expect(page.getByRole('button', { name: 'DUPLICAR PEDIDO' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Excluir documento local' })).toHaveCount(0);

  await page.getByRole('button', { name: 'DUPLICAR PEDIDO' }).click();
  await expect(page.getByText('ORÇAMENTO', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'GERAR PEDIDO' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'DUPLICAR PEDIDO' })).toHaveCount(0);

  await page.getByText('Campos complementares', { exact: false }).click();
  await expect(page.getByLabel('Forma de pagamento')).toHaveValue('');
  await expect(page.getByLabel('Condição de pagamento')).toHaveValue('');
});


test('configuração técnica valida a API antes de ativar o modo real', async ({ page }) => {
  await page.route('https://api.example.test/health', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true })
  }));

  await page.goto('/');
  await page.getByRole('button', { name: 'CONFIGURAR INTEGRAÇÃO' }).click();
  await expect(page.getByRole('heading', { name: 'Conectar Óris360°' })).toBeVisible();
  await page.getByRole('button', { name: 'API REAL' }).click();
  await page.getByLabel('URL base da API').fill('https://api.example.test');

  const endpoints: Record<string, string> = {
    'Saúde / teste da API': '/health',
    'Login': '/login',
    'Criar conta': '/accounts',
    'Recuperar senha': '/password-reset',
    'Base comercial': '/snapshot',
    'Enviar cliente': '/customers/upsert',
    'Enviar Pedido/Orçamento': '/documents/send',
    'Receber Missões': '/missions',
    'Retorno de Missão': '/missions/return',
    'Localização operacional': '/location',
    'Relatórios e Comissões': '/reports/seller',
    'Login integrado / SSO': '/online/session',
    'IA no WhatsApp': '/whatsapp/status',
    'Push de Missões': '/push/subscription'
  };
  for (const [label, value] of Object.entries(endpoints)) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }

  await page.getByRole('button', { name: 'TESTAR CONEXÃO E SALVAR' }).click();
  await expect(page.getByText(/API real validada e ativada/)).toBeVisible();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('oris360.integration.v1') || '{}'));
  expect(saved.mode).toBe('http');
  expect(saved.baseUrl).toBe('https://api.example.test');
});

test('recuperação de senha executa o gateway em vez de exibir placeholder', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'JÁ TENHO CONTA' }).click();
  await page.getByRole('button', { name: 'Esqueci a senha' }).click();
  await expect(page.getByRole('heading', { name: 'Esqueci a senha' })).toBeVisible();
  await page.getByRole('button', { name: 'SOLICITAR RECUPERAÇÃO' }).click();
  await expect(page.getByText(/Solicitação recebida/)).toBeVisible();
});

test('relatórios, sistema online e WhatsApp consultam o gateway', async ({ page }) => {
  await enterDemoCompany(page);

  const menu = page.getByRole('dialog', { name: 'Menu principal' });
  await menu.getByRole('button', { name: 'Relatórios e Comissões', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Relatórios e Comissões' })).toBeVisible();
  await expect(page.getByText('Dados do ambiente DEMO')).toBeVisible();

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('dialog', { name: 'Menu principal' }).getByRole('button', { name: 'Sistema Online', exact: true }).click();
  await page.getByRole('button', { name: 'ABRIR SISTEMA ONLINE' }).click();
  await expect(page.getByText('Integração ainda não disponível')).toBeVisible();
  await expect(page.getByRole('button', { name: 'CONFIGURAR API' })).toBeVisible();

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('dialog', { name: 'Menu principal' }).getByRole('button', { name: 'IA no WhatsApp', exact: true }).click();
  await expect(page.getByText('Integração pendente')).toBeVisible();
  await expect(page.getByRole('button', { name: 'CONFIGURAR API' })).toBeVisible();
});
