# CI / CD

## Continuous Integration

[`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) — roda em push/PR para `main`.

### Etapas
1. Checkout
2. Setup Node 20 + cache npm
3. `npm ci`
4. `npm run lint` (ESLint v9 flat config)
5. **Serviço MySQL 8.4** levantado paralelamente
6. Aguarda MySQL healthy, carrega [`sql/01_schema.sql`](../../../sql/01_schema.sql) + [`sql/02_seed.sql`](../../../sql/02_seed.sql)
7. [`sql/04_tests.sql`](../../../sql/04_tests.sql) — falha o build se aparecer `FAIL`
8. `npm test` — Jest API + unitários
9. `npx playwright install --with-deps chromium`
10. `npm run test:e2e`
11. Em caso de falha: upload do `playwright-report/` e `test-results/` como artifact (7 dias)

## Continuous Deployment

### Frontend (Vercel)
- [`vercel.json`](../../../vercel.json) — `outputDirectory: public`, sem build.
- Headers de segurança aplicados (DENY iframe, nosniff, no-referrer).
- Deploy automático no push para `main` via integração GitHub ↔ Vercel.

### Backend (planejado — AWS)
- Alvo: AWS App Runner (Node) + RDS MySQL t4g.micro (free tier 12 meses).
- Ainda não configurado. Quando estiver, ajustar [`vercel.json`](../../../vercel.json) para adicionar `rewrites` de `/api/*` → URL da API.

## Variáveis de ambiente
Documentadas em [`.env.example`](../../../.env.example).
