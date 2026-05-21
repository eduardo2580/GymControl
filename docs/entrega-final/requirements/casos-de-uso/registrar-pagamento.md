# Caso de uso — Registrar Pagamento (QUADRO 5)

**Status:** ✅ Implementado
**Ator principal:** Administrador

## Objetivo
Registrar o pagamento da mensalidade de um aluno.

## Pré-condição
O aluno deve estar cadastrado.

## Fluxo principal
O administrador pesquisa o aluno, informa o valor pago, a data de pagamento e confirma o registro.

## Pós-condição
O pagamento fica registrado no sistema.

## Diagrama de sequência (QUADRO 7)
1. Admin → Sistema: acessa tela de pagamentos
2. Sistema → BD: lista alunos
3. BD → Sistema: retorna alunos
4. Admin → Sistema: seleciona aluno
5. Sistema → BD: consulta mensalidades
6. BD → Sistema: situação financeira
7. Admin → Sistema: informa dados do pagamento
8. Sistema → BD: registra pagamento
9. BD → Sistema: confirma
10. Sistema → Admin: mensagem de sucesso

## Mapeamento no código
- UI: [`public/js/pagamentos.js`](../../../../public/js/pagamentos.js) — `openModalPag`, `salvarPagamento`.
- API: `POST /api/pagamentos` em [`server.js`](../../../../server.js) (com handling de duplicata).
- Persistência: tabela `pagamentos` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql).

## Requisitos relacionados
- [RF05](../rf/RF05.md), [RF06](../rf/RF06.md).
