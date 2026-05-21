# 4. Testando o MySQL

Como abrir o banco, fazer consultas, conferir dados e rodar os testes de schema. Vale tanto pra Docker quanto pra instalação local.

## Conectando pelo terminal

### Se você está usando Docker

```bash
docker exec -it gymcontrol-mysql mysql -uroot -proot gymcontrol
```

Quebra:
- `docker exec` = "rode um comando dentro de um container já rodando"
- `-it` = modo interativo (você consegue digitar)
- `gymcontrol-mysql` = nome do container
- `mysql -uroot -proot gymcontrol` = o programa `mysql` com usuário `root`, senha `root`, conectando no banco `gymcontrol`

### Se você está usando MySQL local

```bash
mysql -uroot -p gymcontrol
# digite a senha
```

Em ambos os casos, você vai parar num prompt `mysql>`. Use `\q` ou `exit` pra sair.

## Comandos básicos pro prompt do MySQL

```sql
SHOW TABLES;              -- lista as 8 tabelas
DESCRIBE alunos;          -- mostra colunas, tipos, constraints
SELECT * FROM alunos;     -- todos os alunos
SELECT COUNT(*) FROM pagamentos WHERE status='Pago';
```

> 💡 No MySQL, **todo comando termina com `;`**. Se você esquecer, o prompt vai virar `->` esperando você completar.

## Conectando com uma ferramenta gráfica

Se você não gosta de terminal, dá pra usar:

### MySQL Workbench (oficial, gratuito)
1. Baixe em <https://dev.mysql.com/downloads/workbench/>.
2. Abra, clique no `+` ao lado de "MySQL Connections".
3. Preencha:
   - **Connection Name**: `GymControl Dev`
   - **Hostname**: `127.0.0.1`
   - **Port**: `3306`
   - **Username**: `root`
   - **Password**: clique em **Store in Vault** e digite `root` (Docker) ou a sua senha (local).
4. Teste a conexão, salve, abra.

### VS Code (mais leve)
1. Instale a extensão **"MySQL"** (de Weijan Chen) ou **"SQLTools"**.
2. Abra a aba da extensão na barra lateral.
3. "Add Connection" → preencha host/porta/usuário/senha igual ao Workbench.
4. Pronto, você navega pelas tabelas direto no VSCode.

## Rodando os testes de constraint do schema

O arquivo [`sql/04_tests.sql`](../../sql/04_tests.sql) tem ~10 testes que validam que o schema **rejeita** dados inválidos (CPF duplicado, FK órfã, ENUM inválido etc.).

### Pelo Docker:

```bash
docker exec -i gymcontrol-mysql mysql -uroot -proot --force gymcontrol < sql/04_tests.sql | grep -E "PASS|FAIL"
```

### Pelo MySQL local:

```bash
mysql -uroot -p --force gymcontrol < sql/04_tests.sql | grep -E "PASS|FAIL"
```

A saída deve ser uma série de `PASS - ...`. Se aparecer **`FAIL`**, alguma constraint não está pegando — provavelmente o schema saiu do esperado.

> ℹ️ `--force` faz o `mysql` continuar mesmo quando uma query individual dá erro (que é exatamente o que os testes esperam — eles disparam erros de propósito).

## Consultas de referência

[`sql/03_queries.sql`](../../sql/03_queries.sql) tem as consultas que respondem RFs do documento. Pra rodar tudo de uma vez:

```bash
# Docker
docker exec -i gymcontrol-mysql mysql -uroot -proot --table gymcontrol < sql/03_queries.sql

# Local
mysql -uroot -p --table gymcontrol < sql/03_queries.sql
```

A flag `--table` formata os resultados como tabelas ASCII bonitinhas em vez de TSV. Você vai ver:
- Inadimplentes (RF06)
- Alunos ativos com plano (RF10)
- Arrecadação por mês
- Frequência por aluno num período
- Treino completo de um aluno (com exercícios)

## Recomeçando do zero (limpar dados de teste)

Se você ficou cadastrando alunos de teste e quer voltar pro estado inicial do seed:

### Docker
```bash
docker compose down -v
docker compose up -d
```
Apaga o volume → recria → os arquivos `01_schema.sql` e `02_seed.sql` rodam automaticamente.

### MySQL local
```bash
mysql -uroot -p -e "DROP DATABASE gymcontrol;"
mysql -uroot -p --default-character-set=utf8mb4 < sql/01_schema.sql
mysql -uroot -p --default-character-set=utf8mb4 gymcontrol < sql/02_seed.sql
```

## Inspecionando os dados do seed

Pra ter uma noção rápida do que vem no `02_seed.sql`:

```sql
SELECT id, nome, email, tipo_usuario FROM usuarios;
SELECT id, nome, cpf, status FROM alunos;
SELECT id, nome, valor, duracao_meses FROM planos;
SELECT a.nome, p.referencia_mensal, p.valor, p.status
  FROM pagamentos p JOIN alunos a ON a.id = p.aluno_id;
```

3 alunos, 2 professores, 3 planos, 5 pagamentos (com 1 pendente e 1 atrasado pra exercitar o RF06).

## Problemas comuns

**"Unknown database 'gymcontrol'"**
→ Você não rodou o `01_schema.sql` ainda, ou o Docker está pegando um volume antigo. Faça o `down -v` e suba de novo.

**"ERROR 1045 (28000): Access denied"**
→ Usuário/senha errado. No Docker é sempre `root/root`. Na instalação local é a senha que você definiu.

**Os resultados aparecem todos colados sem coluna**
→ Use a flag `--table` no comando `mysql`. Ou conecte por uma ferramenta gráfica.

**Quero rodar uma query única sem entrar no prompt**
→ Use `-e`:
```bash
mysql -uroot -p gymcontrol -e "SELECT COUNT(*) FROM alunos;"
# Docker:
docker exec -i gymcontrol-mysql mysql -uroot -proot gymcontrol -e "SELECT COUNT(*) FROM alunos;"
```

## Pronto!

Agora você sabe:
- Subir o ambiente (com ou sem Docker)
- Rodar a aplicação
- Rodar os testes da API e os E2E (Playwright)
- Inspecionar o banco e checar consultas

Pra fluxos avançados (CI/CD, deploy, documentação dos requisitos), veja [`entrega-final/`](../entrega-final/).
