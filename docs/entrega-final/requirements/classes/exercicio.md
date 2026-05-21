# Classe — Exercicio

**Status:** ✅ Implementado (tabela `exercicios`)

## Atributos (QUADRO 8)
`id`, `nome`, `grupoMuscular`, `series`, `repeticoes`

## Mapeamento no schema
Tabela `exercicios` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql):

| Coluna | Tipo |
|---|---|
| id | INT AI PK |
| treino_id | INT NOT NULL FK→treinos (ON DELETE CASCADE) |
| nome | VARCHAR(80) NOT NULL |
| grupo_muscular | VARCHAR(40) NOT NULL |
| series | TINYINT UNSIGNED NOT NULL (CHECK > 0) |
| repeticoes | VARCHAR(20) NOT NULL — ex.: `"12"`, `"8-10"`, `"até falha"` |
| descanso_seg | SMALLINT UNSIGNED NULL |
| ordem | TINYINT UNSIGNED NOT NULL DEFAULT 1 |

## Relacionamentos (QUADRO 9)
- Exercicio → Treino: **N..1**

## Notas
- Decisão de design: na primeira versão prototipada, exercícios eram um array JSON dentro do treino. Promovida a tabela própria para cumprir literalmente a cardinalidade 1..N de QUADRO 9 e permitir queries diretas (ex.: "todos os treinos com supino").
- `repeticoes` é VARCHAR para aceitar faixas (`8-10`) e textos como `"até falha"`.
