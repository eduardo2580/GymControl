# Classe — Plano

**Status:** ✅ Implementado (tabela `planos`)

## Atributos (QUADRO 8)
`id`, `nome`, `valor`, `duracaoMeses`

## Mapeamento no schema
Tabela `planos` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql):

| Coluna | Tipo | Observação |
|---|---|---|
| id | INT AI PK | |
| nome | VARCHAR(80) NOT NULL | |
| valor | DECIMAL(10,2) NOT NULL | CHECK ≥ 0 |
| duracao_meses | INT NOT NULL | CHECK > 0 |
| descricao | VARCHAR(255) NULL | |

## Relacionamentos (QUADRO 9)
- Plano ← Aluno: **1..N**
