# Classe — Treino

**Status:** ✅ Implementado (tabela `treinos`)

## Atributos (QUADRO 8)
`id`, `objetivo`, `dataInicio`, `dataFim`, `observacoes`

## Mapeamento no schema
Tabela `treinos` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql):

| Coluna | Tipo |
|---|---|
| id | INT AI PK |
| aluno_id | INT NOT NULL FK→alunos (ON DELETE CASCADE) |
| professor_id | INT NOT NULL FK→professores (ON DELETE RESTRICT) |
| objetivo | VARCHAR(120) NOT NULL |
| data_inicio | DATE NOT NULL |
| data_fim | DATE NULL |
| nivel | ENUM('Iniciante','Intermediario','Avancado') |
| observacoes | TEXT NULL |

## Relacionamentos (QUADRO 9)
- Treino → Aluno: **N..1**
- Treino → Professor: **N..1**
- Treino → Exercicio: **1..N**
