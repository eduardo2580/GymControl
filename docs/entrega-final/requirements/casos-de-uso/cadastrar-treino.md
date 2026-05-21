# Caso de uso — Cadastrar Treino (QUADRO 6)

**Status:** ✅ Implementado
**Ator principal:** Professor

## Objetivo
Criar um treino personalizado para o aluno.

## Pré-condição
O professor e o aluno devem estar cadastrados.

## Fluxo principal
O professor seleciona o aluno, informa os exercícios, séries, repetições e observações.

## Pós-condição
O treino fica vinculado ao aluno.

## Mapeamento no código
- UI: [`public/js/professor.js`](../../../../public/js/professor.js) — `openModalNovoTreino`, `salvarNovoTreino`, `salvarEditTreino`.
- API: `POST/PUT /api/treinos` em [`server.js`](../../../../server.js); middleware `adminOrProf`.
- Persistência: tabela `treinos` + `exercicios` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql). Lista de exercícios é substituída atomicamente (`replaceExercicios`).

## Requisitos relacionados
- [RF07](../rf/RF07.md), [RF08](../rf/RF08.md).
