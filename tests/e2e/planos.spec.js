// RF04 — Cadastro de planos (via UI).
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({ storageState: path.join(__dirname, '..', '..', 'playwright', '.auth', 'admin.json') });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#adminDashboard')).toBeVisible();
  await page.locator('[data-tab="planos"]').click();
});

test('Admin cadastra, edita e remove plano pela UI', async ({ page }) => {
  const nome = 'Plano E2E ' + Date.now();

  // CADASTRAR
  await page.getByRole('button', { name: /Novo Plano/ }).click();
  await page.locator('#pl_nome').fill(nome);
  await page.locator('#pl_valor').fill('199.90');
  await page.locator('#pl_dur').fill('1');
  await page.locator('#pl_desc').fill('Plano criado via Playwright');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('body')).toContainText(nome);

  // EDITAR (linha do plano novo)
  const row = page.locator('tr', { hasText: nome });
  await row.getByRole('button', { name: '✏️' }).click();
  await page.locator('#pl_nome').fill(nome + ' editado');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('body')).toContainText(nome + ' editado');

  // REMOVER
  page.once('dialog', d => d.accept());
  const row2 = page.locator('tr', { hasText: nome + ' editado' });
  await row2.getByRole('button', { name: '🗑️' }).click();
  await expect(page.locator('body')).not.toContainText(nome + ' editado');
});
