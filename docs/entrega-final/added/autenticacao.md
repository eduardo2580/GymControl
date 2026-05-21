# Autenticação

**Adicionado em:** 2026-05-20 (commit `2e536e3`)
**Justificativa:** Reforço de [RNF02](../requirements/rnf/RNF02.md) (controle de acesso) e [RNF07](../requirements/rnf/RNF07.md) (proteção de informações).

## Visão geral
Login por email + senha; senhas em bcrypt; sessão via JWT em cookie httpOnly.

## Componentes
- [`lib/auth.js`](../../../lib/auth.js) — `signToken`, `makeAuthenticate`, `requireAuth`, `requireRole`, `setAuthCookie`, `clearAuthCookie`. 100% coberto por testes.
- [`server.js`](../../../server.js) — endpoints `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Cookie `gym_token` com `httpOnly`, `sameSite: strict`, `secure` apenas em produção, TTL de 8h.
- Schema: tabela `usuarios` ([classe Usuario](../requirements/classes/usuario.md)) com `senha_hash` (bcrypt custo 10) e `tipo_usuario` ENUM.

## Frontend
- Formulário de login em [`public/index.html`](../../../public/index.html) → [`public/js/core.js`](../../../public/js/core.js) (`doLogin`, `enterAsUser`, retoma sessão via `/api/auth/me` ao recarregar a página).

## Contas demo (seed)
| Perfil | Email | Senha |
|---|---|---|
| Admin | admin@gym.com | admin123 |
| Professor | ana@gym.com | prof123 |
| Aluno | joao@aluno.com | aluno123 |

## Testes
- [`tests/auth.test.js`](../../../tests/auth.test.js) — unitários (token round-trip, secret errado, RBAC).
- [`tests/api.test.js`](../../../tests/api.test.js) — bloco AUTH (login válido/inválido, /me, logout, rota protegida).
- [`tests/e2e/app.spec.js`](../../../tests/e2e/app.spec.js) — login real via UI, logout invalida sessão.
