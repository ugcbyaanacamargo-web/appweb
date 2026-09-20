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
  if (await close.isVisible()) {
    await page.keyboard.press('Escape');
    await expect(close).toBeHidden();
  }
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
  await expect(page.getByText('API real configurada')).toBeVisible();

  await page.getByRole('button', { name: 'JÁ TENHO CONTA' }).click();
  await expect(page.getByText('MODO DEMONSTRAÇÃO')).toHaveCount(0);
  await expect(page.getByLabel('E-mail')).toHaveValue('');
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
  await page.getByRole('button', { name: 'ABRIR PAINEL DO VENDEDOR' }).click();
  await expect(page).toHaveURL(/\/vendedor$/);
  await expect(page.getByRole('heading', { name: 'Painel do vendedor Óris360°' })).toBeVisible();
  await page.getByRole('button', { name: 'VOLTAR AO APP' }).click();

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('dialog', { name: 'Menu principal' }).getByRole('button', { name: 'IA no WhatsApp', exact: true }).click();
  await expect(page.getByText('Integração pendente')).toBeVisible();
  await expect(page.getByRole('button', { name: 'CONFIGURAR API' })).toBeVisible();
});


test('campos de cliente definidos pelo backend funcionam offline e persistem', async ({ page }) => {
  await enterDemoCompany(page);
  const menu = page.getByRole('dialog', { name: 'Menu principal' });
  await menu.getByRole('button', { name: 'Clientes', exact: true }).click();

  await page.getByRole('button', { name: 'Novo cliente' }).click();
  await expect(page.getByLabel('Telefone')).toBeVisible();
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Endereço')).toBeVisible();

  await page.getByLabel('Nome').fill('Cliente Campos Dinâmicos');
  await page.getByLabel('CPF/CNPJ').fill('12345678909');
  await page.getByLabel('Telefone').fill('62988887777');
  await page.getByLabel('E-mail', { exact: true }).fill('cliente@example.com');
  await page.getByLabel('Endereço').fill('Rua de teste, 100');
  await page.getByRole('button', { name: 'SALVAR CLIENTE' }).click();
  await expect(page.getByText('Cliente salvo neste aparelho.')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Menu principal' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('dialog', { name: 'Menu principal' }).getByRole('button', { name: 'Clientes', exact: true }).click();
  await page.getByLabel('Buscar cliente').fill('Cliente Campos Dinâmicos');
  await page.getByText('Cliente Campos Dinâmicos', { exact: true }).click();

  await expect(page.getByLabel('Telefone')).toHaveValue('62988887777');
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('cliente@example.com');
  await expect(page.getByLabel('Endereço')).toHaveValue('Rua de teste, 100');
});

test('Sistema Online usa apenas Óris360° e informa limitação do DEMO', async ({ page }) => {
  await enterDemoCompany(page);
  await page.getByRole('dialog', { name: 'Menu principal' })
    .getByRole('button', { name: 'Sistema Online', exact: true }).click();
  await expect(page.getByText('Seu App e seus painéis pertencem ao mesmo Óris360°')).toBeVisible();
  await expect(page.getByRole('link', { name: /Saboriza/i })).toHaveCount(0);
});

test('redesign mantém navegação funcional e aplica atmosfera visual com interação acessível', async ({ page }) => {
  await page.goto('/');
  const landingBackground = await page.locator('.landing-screen').evaluate(element => getComputedStyle(element).backgroundImage);
  expect(landingBackground).toContain('gradient');
  await page.getByRole('button', { name: 'JÁ TENHO CONTA' }).click();
  await page.getByRole('button', { name: 'ENTRAR' }).click();
  await page.locator('.company-option').first().click();

  const shell = page.locator('.app-shell');
  await expect(shell).toBeVisible();
  const accent = await shell.evaluate(element => getComputedStyle(element, '::before').backgroundImage);
  expect(accent).toContain('radial-gradient');
  const mainAnimation = await page.locator('.page-section').first().evaluate(element => getComputedStyle(element).animationName);
  expect(mainAnimation).toContain('pageReveal');

  const menu = page.getByRole('dialog', { name: 'Menu principal' });
  await expect(menu.locator('.drawer-item')).toHaveCount(10);
  const active = menu.getByRole('button', { name: 'Pedidos', exact: true });
  await expect(active).toHaveClass(/active/);
  await menu.getByRole('button', { name: 'Clientes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Clientes', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu principal' }).getByRole('button', { name: 'Clientes', exact: true })).toHaveClass(/active/);
});

test('redesign respeita movimento reduzido e mantém botões críticos utilizáveis em tela móvel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enterDemoCompany(page);
  await closeMenu(page);

  const section = page.locator('.page-section').first();
  const animationDuration = await section.evaluate(element => getComputedStyle(element).animationDuration);
  expect(animationDuration.split(',').every(value => parseFloat(value) <= 0.01)).toBe(true);

  await page.getByRole('button', { name: 'Novo orçamento' }).click();
  await expect(page.getByRole('button', { name: 'ADICIONAR PRODUTOS' })).toBeDisabled();
  await page.locator('.selection-card').click();
  await page.locator('.list-card-main:not([disabled])').first().click();
  await expect(page.getByRole('button', { name: 'ADICIONAR PRODUTOS' })).toBeEnabled();
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
});


test('Aurora mostra resumo local verdadeiro em celular e preserva duas abas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemoCompany(page);
  await page.keyboard.press('Escape');

  const overview = page.getByRole('region', { name: 'Resumo da operação local' });
  await expect(overview).toBeVisible();
  await expect(overview.getByText('Neste aparelho', { exact: true })).toBeVisible();
  await expect(overview.getByText('Pendentes', { exact: true })).toBeVisible();
  await expect(overview.getByText('Enviados', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(2);

  await page.getByRole('button', { name: 'Novo orçamento' }).click();
  await expect(page.getByRole('button', { name: 'ADICIONAR PRODUTOS' })).toBeDisabled();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(overview.locator('.overview-metrics > div').nth(0)).toContainText('1');
  await expect(overview.locator('.overview-metrics > div').nth(1)).toContainText('1');
  await expect(overview.locator('.overview-metrics > div').nth(2)).toContainText('0');
});

test('Aurora identifica a página ativa no menu para leitores de tela', async ({ page }) => {
  await enterDemoCompany(page);
  const menu = page.getByRole('dialog', { name: 'Menu principal' });
  await expect(menu.getByRole('button', { name: 'Pedidos', exact: true })).toHaveAttribute('aria-current', 'page');
  await menu.getByRole('button', { name: 'Produtos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Produtos', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(menu.getByRole('button', { name: 'Produtos', exact: true })).toHaveAttribute('aria-current', 'page');
});


test('Sistema Online abre painel do vendedor Óris360° no mesmo site, nunca Saboriza', async ({ page }) => {
  await enterDemoCompany(page);
  await page.getByRole('dialog', { name: 'Menu principal' }).getByRole('button', { name: 'Sistema Online', exact: true }).click();
  await expect(page.getByRole('link', { name: 'ACESSAR PAINEL SABORIZA' })).toHaveCount(0);
  await page.getByRole('button', { name: 'ABRIR PAINEL DO VENDEDOR' }).click();
  await expect(page).toHaveURL(/\/vendedor$/);
  await expect(page.getByRole('heading', { name: 'Painel do vendedor Óris360°' })).toBeVisible();
  await expect(page.getByText('Ambiente DEMO')).toBeVisible();
  await expect(page.getByRole('button', { name: 'NOVO PRODUTO' })).toHaveCount(0);
  await page.getByRole('button', { name: 'VOLTAR AO APP' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible();
});

test('empresa Óris360° cadastra produto DEMO e vendedor só recebe ao sincronizar', async ({ page }) => {
  await page.goto('/empresa');
  await page.getByRole('button', { name: 'JÁ TENHO CONTA' }).click();
  await page.getByLabel('E-mail').fill('administrador@demo.oris360.local');
  await page.getByLabel('Senha').fill('demo1234');
  await page.getByRole('button', { name: 'ENTRAR' }).click();
  await expect(page.getByRole('heading', { name: 'Painel da empresa Óris360°' })).toBeVisible();

  await page.getByRole('button', { name: 'NOVO PRODUTO' }).click();
  await page.getByLabel('Nome do produto').fill('Produto do Painel');
  await page.getByLabel('SKU do produto').fill('PAINEL-1');
  await page.getByLabel('Preço unitário').fill('13.99');
  await page.getByLabel('Estoque conhecido').fill('7');
  await page.getByRole('button', { name: 'SALVAR PRODUTO' }).click();
  await expect(page.getByText('Produto do Painel')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Produto do Painel')).toBeVisible();

  await page.getByRole('button', { name: 'VOLTAR AO APP' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('dialog', { name: 'Menu principal' }).getByRole('button', { name: 'Produtos', exact: true }).click();
  await expect(page.getByText('Produto do Painel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('dialog', { name: 'Menu principal' }).getByRole('button', { name: 'Sincronizar', exact: true }).click();
  await expect(page.getByText('SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO.', { exact: true })).toBeVisible();
  await expect(page.getByText('Produto do Painel')).toBeVisible();
});

test('vendedor DEMO não ganha acesso ao painel da empresa pela URL', async ({ page }) => {
  await page.goto('/empresa');
  await page.getByRole('button', { name: 'JÁ TENHO CONTA' }).click();
  await page.getByRole('button', { name: 'ENTRAR' }).click();
  await expect(page.getByText('Acesso administrativo não autorizado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'NOVO PRODUTO' })).toHaveCount(0);
});
