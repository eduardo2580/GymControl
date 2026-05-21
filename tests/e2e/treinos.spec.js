// RF07 — Cadastro de treinos · RF08 — Vincular treinos a alunos (via UI).
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({ storageState: path.join(__dirname, '..', '..', 'playwright', '.auth', 'professor.json') });

test('Professor cadastra treino com exercícios pela UI', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#professorDashboard')).toBeVisible();

  // Navega para a aba "Treinos" do professor
  await page.locator('[data-ptab="treinos"]').click();
  await page.getByRole('button', { name: /Novo Treino/ }).click();

  const objetivo = 'Hipertrofia E2E ' + Date.now();
  await page.locator('#tr_obj').fill(objetivo);
  await page.locator('#tr_nivel').selectOption('Iniciante');

  // Adiciona um exercício
  await page.getByRole('button', { name: /＋ Exercício/ }).click();
  await page.locator('[data-ex-nome]').first().fill('Supino Reto');

  await page.getByRole('button', { name: 'Salvar Treino' }).click();
  // Após salvar, o cartão aparece na lista
  await expect(page.locator('body')).toContainText(objetivo);
});

test('Professor não tem acesso à aba de Inadimplentes (RBAC)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#professorDashboard')).toBeVisible();
  // Item de Inadimplentes só existe no nav do admin
  await expect(page.locator('[data-tab="inadimplentes"]:visible')).toHaveCount(0);
});
