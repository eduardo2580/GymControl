// RF10 — Relatórios (via UI).
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({ storageState: path.join(__dirname, '..', '..', 'playwright', '.auth', 'admin.json') });

test('Dashboard mostra cards com totais', async ({ page }) => {
  await page.goto('/');
  // O dashboard é o primeiro tab e abre automaticamente
  await expect(page.locator('#adminDashboard')).toBeVisible();
  await page.locator('[data-tab="dashboard"]').click();
  await expect(page.locator('#adminContent')).toContainText(/Alunos|alunos/i);
});

test('Tela de Relatórios abre e mostra arrecadação por mês', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-tab="relatorios"]').click();
  // A view de relatórios sempre menciona "Receita" no título do painel
  await expect(page.locator('#adminContent')).toContainText(/Receita|Arrecada|R\$/);
});
