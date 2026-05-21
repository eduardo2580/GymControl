// RF05 — Registrar pagamentos · RF06 — Consultar inadimplentes (via UI).
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({ storageState: path.join(__dirname, '..', '..', 'playwright', '.auth', 'admin.json') });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#adminDashboard')).toBeVisible();
});

test('Admin registra pagamento pela UI (RF05)', async ({ page }) => {
  await page.locator('[data-tab="pagamentos"]').click();
  await page.getByRole('button', { name: /Registrar Pagamento/ }).click();

  // O modal abre com aluno=primeiro, valor auto-preenchido, ref=mês atual.
  // Usamos uma ref no futuro pra evitar colisão com o seed.
  const futureMonth = '2099-01';
  await page.locator('#pg_ref').fill(futureMonth);
  await page.locator('#pg_valor').fill('120');
  await page.locator('#pg_metodo').selectOption('Pix');
  // O modal abre dentro de #modalOverlay; usamos para escopar o botão "Registrar".
  await page.locator('#modalOverlay').getByRole('button', { name: 'Registrar', exact: true }).click();

  await expect(page.locator('#toast')).toContainText(/registrado/i);
  await expect(page.locator('#pagTable tbody')).toContainText('Pix');
});

test('Admin acessa a tela de Inadimplentes e vê a lista (RF06)', async ({ page }) => {
  await page.locator('[data-tab="inadimplentes"]').click();
  // A aba abre sem erro de JS/CSP — o conteúdo de admin permanece visível e tem alguma
  // referência a "inadimplentes" no título da página.
  await expect(page.locator('#adminContent')).toContainText(/inadimplent/i);
});

test('Filtro de mês na tela de Pagamentos esconde linhas de outras referências', async ({ page }) => {
  await page.locator('[data-tab="pagamentos"]').click();
  await page.locator('#filtroMes').fill('2099-12');
  // Após o filtro, todas as linhas devem estar ocultas (não há pagamento desse mês).
  // Confirmamos que NÃO há linha visível com badge azul (ref) "Dez/2099" — bom proxy.
  const visibleRows = page.locator('#pagTable tbody tr:visible');
  await expect(visibleRows).toHaveCount(0);
});
