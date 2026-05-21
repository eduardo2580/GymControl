const { test, expect } = require('@playwright/test');
const path = require('path');

const AUTH = role => path.join(__dirname, '..', '..', 'playwright', '.auth', `${role}.json`);

// ─── Tela de login (sem storageState — exercita o formulário de verdade) ──
test.describe('Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('credenciais inválidas mostram erro', async ({ page }) => {
    await page.goto('/');
    await page.locator('#loginEmail').fill('admin@gym.com');
    await page.locator('#loginSenha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.locator('#loginErr')).toContainText(/inválid/i);
  });

  test('admin entra e vê o dashboard', async ({ page }) => {
    await page.goto('/');
    await page.locator('#loginEmail').fill('admin@gym.com');
    await page.locator('#loginSenha').fill('admin123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.locator('#adminDashboard')).toBeVisible();
  });
});

// ─── Admin já autenticado (via storageState) ─────────────────────────────
test.describe('Admin - alunos CRUD', () => {
  test.use({ storageState: AUTH('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#adminDashboard')).toBeVisible();
    await page.locator('[data-tab="alunos"]').click();
    await expect(page.locator('#alunosTable')).toBeVisible();
  });

  test('CPF inválido bloqueia o cadastro com toast de erro', async ({ page }) => {
    await page.getByRole('button', { name: /Novo Aluno/ }).click();
    await page.locator('#m_nome').fill('CPF Ruim');
    await page.locator('#m_cpf').fill('11111111111');
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(page.locator('#toast')).toContainText(/CPF inválido/i);
    await expect(page.getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
  });

  test('cadastrar, editar e remover aluno', async ({ page }) => {
    const nome = 'E2E Aluno ' + Date.now();

    await page.getByRole('button', { name: /Novo Aluno/ }).click();
    await page.locator('#m_nome').fill(nome);
    await page.locator('#m_cpf').fill('52998224725');
    await expect(page.locator('#m_cpf')).toHaveValue('529.982.247-25');
    await page.locator('#m_tel').fill('11912345678');
    await expect(page.locator('#m_tel')).toHaveValue('(11) 91234-5678');
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(page.locator('#alunosTable')).toContainText(nome);

    const row = page.locator('#alunosTable tbody tr', { hasText: nome });
    await row.getByRole('button', { name: '✏️' }).click();
    await page.locator('#e_nome').fill(nome + ' editado');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.locator('#alunosTable')).toContainText(nome + ' editado');

    page.once('dialog', d => d.accept());
    const row2 = page.locator('#alunosTable tbody tr', { hasText: nome + ' editado' });
    await row2.getByRole('button', { name: '🗑️' }).click();
    await expect(page.locator('#alunosTable')).not.toContainText(nome + ' editado');
  });
});

// ─── RBAC visível pro aluno ──────────────────────────────────────────────
test.describe('RBAC - via UI', () => {
  test.use({ storageState: AUTH('aluno') });

  test('aluno vê o dashboard de aluno, não o admin', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#alunoDashboard')).toBeVisible();
    await expect(page.locator('#adminDashboard')).toBeHidden();
    await expect(page.locator('[data-tab="inadimplentes"]:visible')).toHaveCount(0);
  });
});

// ─── Logout invalida a sessão ────────────────────────────────────────────
test.describe('Sessão', () => {
  test.use({ storageState: AUTH('admin') });

  test('logout volta para login e recarregar não retoma a sessão', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#adminDashboard')).toBeVisible();
    await page.getByRole('button', { name: 'Sair' }).first().click();
    await expect(page.locator('#loginScreen')).toBeVisible();
    await page.reload();
    await expect(page.locator('#loginScreen')).toBeVisible();
  });
});
