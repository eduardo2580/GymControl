# Backup / Restore

**Status:** ✅ Implementado

## Endpoints
Ambos em [`server.js`](../../../server.js), restritos a Admin:

- `GET  /api/backup` — devolve um JSON com todas as tabelas (alunos, professores, planos, pagamentos, treinos+exercicios, frequencias). O header `Content-Disposition` força o navegador a baixar.
- `POST /api/restore` — recebe um JSON nesse mesmo formato, faz `TRUNCATE` em todas as tabelas (com `FOREIGN_KEY_CHECKS=0`) e reinsere os registros dentro de uma única transação.

## Frontend
Aba **Backup** do dashboard admin — [`public/js/backup.js`](../../../public/js/backup.js).

## Notas
- Versão do payload: `2.0` (a versão 1.0 da prototipagem usava SQLite e tinha `exercicios` como JSON inline). Restore aceita ambas.
- Restore é atômico: rollback completo em qualquer erro.

## Testes
- API: [`tests/api.extra.test.js`](../../../tests/api.extra.test.js) — bloco "BACKUP / RESTORE round trip" baixa, restaura, e verifica que `alunos.length` se manteve. RBAC validado (aluno → 403).
