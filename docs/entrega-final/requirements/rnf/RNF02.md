# RNF02 — Controle de acesso por tipo de usuário

**Tipo:** Requisito não funcional
**Status:** ✅ Implementado

## Descrição
O sistema deve ter controle de acesso por tipo de usuário.

## Implementação
- Autenticação: email + senha → bcrypt + JWT em cookie httpOnly (8h). Detalhes em [`added/autenticacao.md`](../../added/autenticacao.md).
- Middleware `requireRole(...roles)` em [`lib/auth.js`](../../../../lib/auth.js).
- Aliases no [`server.js`](../../../../server.js): `adminOnly` (Admin), `adminOrProf` (Admin ou Professor).
- Aplicado conforme QUADRO 3:
  - **Admin**: tudo (CRUD de alunos/professores/planos/pagamentos, inadimplentes, relatórios, backup).
  - **Professor**: leitura geral + CRUD de treinos.
  - **Aluno**: leitura das próprias informações.

## Testes
- [`tests/api.test.js`](../../../../tests/api.test.js) bloco "RBAC - QUADRO 3" e [`tests/auth.test.js`](../../../../tests/auth.test.js).
- E2E: [`tests/e2e/app.spec.js`](../../../../tests/e2e/app.spec.js) — aluno não vê o menu Inadimplentes.
