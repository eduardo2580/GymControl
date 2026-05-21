// RF09 — Registrar frequência (via UI).
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({ storageState: path.join(__dirname, '..', '..', 'playwright', '.auth', 'admin.json') });

test('Admin registra check-in pela UI', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-tab="frequencia"]').click();
  await page.getByRole('button', { name: /Registrar Check-in/i }).click();

  // Aluno: seleciona o primeiro
  await page.locator('#fq_aluno').selectOption({ index: 1 }).catch(() => {});
  // Data default = hoje. Vamos forçar um horário único.
  const hora = String(new Date().getSeconds()).padStart(2, '0');
  await page.locator('#fq_hora').fill(`08:${hora}`);
  await page.locator('#modalOverlay').getByRole('button', { name: 'Registrar', exact: true }).click();

  await expect(page.locator('#toast')).toContainText(/registrado|check-in/i);
});
