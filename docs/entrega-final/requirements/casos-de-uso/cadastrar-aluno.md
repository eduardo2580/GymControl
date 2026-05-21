# Caso de uso — Cadastrar Aluno (QUADRO 4)

**Status:** ✅ Implementado
**Ator principal:** Administrador

## Objetivo
Registrar um novo aluno no sistema.

## Pré-condição
O administrador deve estar logado.

## Fluxo principal
O administrador acessa a tela de cadastro, informa os dados do aluno, escolhe o plano e salva o cadastro.

## Pós-condição
O aluno fica registrado no sistema.

## Mapeamento no código
- UI: [`public/js/alunos.js`](../../../../public/js/alunos.js) — `openModalCadastrarAluno`, `salvarAluno`.
- API: `POST /api/alunos` em [`server.js`](../../../../server.js).
- Persistência: tabela `alunos` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql).

## Requisitos relacionados
- [RF01](../rf/RF01.md), [RF02](../rf/RF02.md), [RF04](../rf/RF04.md) (escolha do plano).
