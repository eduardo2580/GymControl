# RNF03 — Banco relacional

**Tipo:** Requisito não funcional
**Status:** ✅ Implementado

## Descrição
O sistema deve armazenar os dados em banco de dados relacional.

## Implementação
- **MySQL 8.4** (conforme QUADRO 10/11).
- Schema com 8 tabelas + FKs + ENUMs + índices em todas as FKs — [`sql/01_schema.sql`](../../../../sql/01_schema.sql).
- Dev local via Docker — [`docker-compose.yml`](../../../../docker-compose.yml). Detalhes em [`added/docker-dev.md`](../../added/docker-dev.md).
- Driver: `mysql2/promise` em [`server.js`](../../../../server.js) com pool de 10 conexões e `dateStrings: true` para datas como string.

## Testes
- Constraints validados via [`sql/04_tests.sql`](../../../../sql/04_tests.sql) (UNIQUE, ENUM, FK, CHECK, CASCADE).
