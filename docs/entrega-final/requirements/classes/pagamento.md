# Classe — Pagamento

**Status:** ✅ Implementado (tabela `pagamentos`)

## Atributos (QUADRO 8)
`id`, `dataPagamento`, `valor`, `status`

## Mapeamento no schema
Tabela `pagamentos` em [`sql/01_schema.sql`](../../../../sql/01_schema.sql):

| Coluna | Tipo | Observação |
|---|---|---|
| id | INT AI PK | |
| aluno_id | INT NOT NULL FK→alunos | ON DELETE CASCADE |
| data_pagamento | DATE NULL | |
| data_vencimento | DATE NOT NULL | adicionado para RF06 |
| valor | DECIMAL(10,2) | CHECK ≥ 0 |
| status | ENUM('Pago','Pendente','Atrasado') | default 'Pendente' |
| referencia_mensal | CHAR(7) | formato YYYY-MM |
| metodo_pagamento | ENUM('Dinheiro','Pix','Cartao','Boleto') | |
| observacoes | VARCHAR(255) NULL | |

`UNIQUE (aluno_id, referencia_mensal)` impede duplicar mensalidade.

## Relacionamentos (QUADRO 9)
- Pagamento → Aluno: **N..1**
