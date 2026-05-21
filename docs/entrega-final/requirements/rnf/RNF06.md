# RNF06 — Consultas rápidas

**Tipo:** Requisito não funcional
**Status:** ✅ Implementado

## Descrição
O sistema deve permitir consultas rápidas.

## Implementação
- Índices em **toda** FK e nos campos usados em filtros — [`sql/01_schema.sql`](../../../../sql/01_schema.sql):
  - `alunos`: `idx_aluno_status`, `idx_aluno_plano`
  - `pagamentos`: `uk_pag_aluno_ref`, `idx_pag_status`, `idx_pag_venc`
  - `treinos`: `idx_treino_aluno`, `idx_treino_professor`
  - `exercicios`: `idx_ex_treino (treino_id, ordem)`
  - `frequencias`: `idx_freq_aluno_data (aluno_id, data_entrada)`, `idx_freq_data`
- Pool de conexões MySQL (10 conexões) em [`server.js`](../../../../server.js).
- Backend Node assíncrono (event loop) — sem bloqueio durante I/O.
- Front-end aplica filtros no cliente para evitar round-trips desnecessários (busca por nome, filtro por mês).
