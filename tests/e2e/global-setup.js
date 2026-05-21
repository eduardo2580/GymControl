// Reseta o DB e gera storageState para cada papel — assim os testes não
// precisam fazer login na UI (e portanto não disparam o rate-limit de 5/min).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { request } from '@playwright/test';
import { resetDb, ACCOUNTS } from '../helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '..', '..', 'playwright', '.auth');

export default async function globalSetup(config) {
  await resetDb();
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const baseURL = config?.projects?.[0]?.use?.baseURL
    || process.env.E2E_BASE_URL
    || 'http://127.0.0.1:3000';

  for (const [role, creds] of Object.entries(ACCOUNTS)) {
    const ctx = await request.newContext({ baseURL });
    const res = await ctx.post('/api/auth/login', { data: creds });
    if (!res.ok()) throw new Error(`Falha ao logar ${role}: ${res.status()}`);
    await ctx.storageState({ path: path.join(AUTH_DIR, `${role}.json`) });
    await ctx.dispose();
  }
}
