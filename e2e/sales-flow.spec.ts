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
