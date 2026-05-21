// RF03 — Cadastro de professores (via UI).
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({ storageState: path.join(__dirname, '..', '..', 'playwright', '.auth', 'admin.json') });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-tab="professores"]').click();
});

test('Admin cadastra, edita e remove professor pela UI', async ({ page }) => {
  const nome = 'Prof E2E ' + Date.now();
  const cref = 'E2E-' + Date.now();

  await page.getByRole('button', { name: /Novo Professor|Cadastrar Professor|＋/ }).click();
  await page.locator('#p_nome').fill(nome);
  await page.locator('#p_cref').fill(cref);
  await page.locator('#p_esp').fill('Funcional');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('body')).toContainText(nome);

  // editar
  const row = page.locator('tr', { hasText: nome });
  await row.getByRole('button', { name: '✏️' }).click();
  await page.locator('#p_esp').fill('Musculação');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('tr', { hasText: nome })).toContainText('Musculação');

  // deletar
  page.once('dialog', d => d.accept());
  await page.locator('tr', { hasText: nome }).getByRole('button', { name: '🗑️' }).click();
  await expect(page.locator('body')).not.toContainText(nome);
});
