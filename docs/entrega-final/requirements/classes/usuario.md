# Classe — Usuario

**Status:** ✅ Implementado (tabela `usuarios`)

## Atributos (QUADRO 8)
`id`, `nome`, `email`, `senha`, `tipoUsuario`

## Mapeamento no schema
Tabela `usuarios` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql):

| Coluna | Tipo | Observação |
|---|---|---|
| id | INT AI PK | |
| nome | VARCHAR(120) NOT NULL | |
| email | VARCHAR(160) NOT NULL UNIQUE | |
| senha_hash | VARCHAR(255) NOT NULL | bcrypt (custo 10) |
| tipo_usuario | ENUM('Admin','Professor','Aluno') NOT NULL | |
| aluno_id | INT NULL FK→alunos | UNIQUE (1..1) |
| professor_id | INT NULL FK→professores | UNIQUE (1..1) |
| criado_em | DATETIME | default CURRENT_TIMESTAMP |

## Relacionamentos (QUADRO 9)
- Usuario ↔ Aluno: **1..1** (via `aluno_id` UNIQUE)
- Usuario ↔ Professor: **1..1** (via `professor_id` UNIQUE)

## Notas
- O campo `senha` do modelo conceitual virou `senha_hash` na tabela (RNF07).
- Um usuário Admin não está vinculado a nenhum dos dois (ambos NULL).
