# Testes automatizados

**Adicionado em:** commits `2e536e3` (Jest) e `d7efa08` (Playwright).
**Cobertura atual:** 91% das linhas (`lib/` a 100%).

## Camadas

### 1. SQL — constraints do schema
[`sql/04_tests.sql`](../../../sql/04_tests.sql) — testes manuais via `expect_fail` para:
- UNIQUE em `cpf`, `cref`, `email`
- ENUM em `alunos.status` e `pagamentos.status`
- FK orfãs em pagamentos e treinos
- UNIQUE `(aluno, referencia_mensal)`
- CHECK `valor ≥ 0`
- 1..1 usuario↔aluno
- CASCADE de exercícios ao deletar treino
- Queries RF06/RF10 retornam linhas

### 2. Unitários — bibliotecas puras
- [`tests/validators.test.js`](../../../tests/validators.test.js) — CPF (table-driven), requireFields, isValidYearMonth.
- [`tests/auth.test.js`](../../../tests/auth.test.js) — signToken/authenticate round-trip, secret errado, RBAC.

### 3. API — Jest + Supertest
- [`tests/api.test.js`](../../../tests/api.test.js) — login, RBAC matrix QUADRO 3, CRUD alunos com validações.
- [`tests/api.extra.test.js`](../../../tests/api.extra.test.js) — planos/professores/treinos/frequência CRUD, restore round-trip, dashboard.
- 22 + 67 = 89 testes Jest.

### 4. E2E — Playwright (Chromium)
- [`tests/e2e/app.spec.js`](../../../tests/e2e/app.spec.js): login válido/inválido, alunos CRUD com máscara de CPF, RBAC visual, logout.
- 6 testes; rodam em ~8 segundos no modo fast.

## Como rodar

```bash
npm test                # API + unitários (~3s)
npm run test:e2e        # E2E rápido (~8s)
npm run test:e2e:human  # E2E com vídeo gravado: gera test-results/human-e2e.mp4
```

## Pipeline "human-paced"
- [`playwright.config.human.js`](../../../playwright.config.human.js) — headed + slowMo 1s + video on.
- [`scripts/concat-e2e-video.js`](../../../scripts/concat-e2e-video.js) — usa `ffmpeg-static` (bundled, sem dependência do sistema) para juntar todos os clipes num único `test-results/human-e2e.mp4` (~1.3 MB, ~78s).
- O script chama primeiro o `test:e2e` rápido — se a versão fast falhar, a versão human não roda.
