# Classe — Professor

**Status:** ✅ Implementado (tabela `professores`)

## Atributos (QUADRO 8)
`id`, `nome`, `cref`, `especialidade`

## Mapeamento no schema
Tabela `professores` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql):

| Coluna | Tipo |
|---|---|
| id | INT AI PK |
| nome | VARCHAR(120) NOT NULL |
| cref | VARCHAR(20) NOT NULL UNIQUE |
| especialidade | VARCHAR(80) NULL |
| telefone | VARCHAR(20) NULL |
| email | VARCHAR(160) NULL |

## Relacionamentos (QUADRO 9)
- Professor → Treino: **1..N**
- Professor ↔ Usuario: **1..1**
