# Classe — Frequencia

**Status:** ✅ Implementado (tabela `frequencias`)

## Atributos (QUADRO 8)
`id`, `dataEntrada`, `horarioEntrada`

## Mapeamento no schema
Tabela `frequencias` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql):

| Coluna | Tipo |
|---|---|
| id | INT AI PK |
| aluno_id | INT NOT NULL FK→alunos (ON DELETE CASCADE) |
| data_entrada | DATE NOT NULL |
| horario_entrada | TIME NOT NULL |
| horario_saida | TIME NULL |

Índices `(aluno_id, data_entrada)` e `data_entrada`.

## Relacionamentos (QUADRO 9)
- Frequencia → Aluno: **N..1**

## Notas
- `horario_saida` é uma extensão útil (não estava em QUADRO 8) — permite calcular duração da visita.
