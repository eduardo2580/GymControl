# RNF07 — Proteger informações dos usuários

**Tipo:** Requisito não funcional
**Status:** ✅ Implementado

## Descrição
O sistema deve proteger informações básicas dos usuários.

## Implementação
- Senhas armazenadas como **hash bcrypt** (custo 10), nunca em claro — coluna `usuarios.senha_hash` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql).
- Tokens JWT em cookie **httpOnly** + **SameSite=Strict** (resistente a XSS e CSRF de leitura) — ver [`lib/auth.js`](../../../../lib/auth.js).
- **helmet** define headers de segurança (X-Frame-Options, X-Content-Type-Options, Referrer-Policy etc.) — [`server.js`](../../../../server.js).
- **express-rate-limit**: 120/min na API, 5/min em `/api/auth/login` (defesa contra brute-force).
- Validação de entrada (CPF, campos obrigatórios) em [`lib/validators.js`](../../../../lib/validators.js).
- `JWT_SECRET` obrigatório em produção (servidor recusa subir com o default).

Detalhes em [`added/seguranca.md`](../../added/seguranca.md).

## Testes
- [`tests/auth.test.js`](../../../../tests/auth.test.js) — token round-trip, secret errado rejeitado.
