# Classe — Aluno

**Status:** ✅ Implementado (tabela `alunos`)

## Atributos (QUADRO 8)
`id`, `nome`, `cpf`, `telefone`, `dataNascimento`, `status`

## Mapeamento no schema
Tabela `alunos` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql):

| Coluna | Tipo |
|---|---|
| id | INT AI PK |
| nome | VARCHAR(120) NOT NULL |
| cpf | CHAR(14) NOT NULL UNIQUE |
| telefone | VARCHAR(20) NULL |
| data_nascimento | DATE NULL |
| status | ENUM('Ativo','Inativo','Suspenso') DEFAULT 'Ativo' |
| plano_id | INT NULL FK→planos |
| data_inicio_plano | DATE NULL |
| observacoes | TEXT NULL |
| criado_em | DATETIME |

## Relacionamentos (QUADRO 9)
- Aluno → Plano: **N..1**
- Aluno → Pagamento: **1..N**
- Aluno → Treino: **1..N**
- Aluno → Frequencia: **1..N**
- Aluno ↔ Usuario: **1..1**

## Notas
- Atributos extras (`plano_id`, `data_inicio_plano`, `observacoes`) foram adicionados para suportar RF04/RF05/RF09.
