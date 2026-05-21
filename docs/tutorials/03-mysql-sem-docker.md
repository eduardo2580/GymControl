# 3. MySQL sem Docker

> Alternativa pra quem **não pode** usar Docker (máquina muito antiga, política de TI, sem permissão de admin, etc.). Se você conseguir usar Docker, use — é muito mais simples. Veja [01-docker.md](01-docker.md).

## Instalando o MySQL no Windows

1. Vá em <https://dev.mysql.com/downloads/installer/>.
2. Baixe o **"MySQL Installer for Windows"** (a versão "Community", recomenda a opção mais leve `mysql-installer-web-community`).
3. Rode o instalador.
4. Em **"Choosing a Setup Type"**, escolha **"Server only"** (ou "Custom" e marque só `MySQL Server 8.x`).
5. Clique em **Execute** pra baixar e instalar.
6. Na configuração:
   - **Type and Networking**: deixe `Development Computer`, porta `3306`.
   - **Authentication Method**: escolha **"Use Legacy Authentication Method"** (mais simples) — ou a moderna, tanto faz.
   - **Accounts and Roles**: defina uma senha para o usuário `root`. **Anote** essa senha.
   - **Windows Service**: deixe marcado "Start the MySQL Server at System Startup" (sobe junto com o Windows).
   - Pode desmarcar essa opção se preferir subir manualmente quando precisar.
7. Finalize.

Pra testar, abra um terminal:

```bash
mysql -uroot -p
# digite a senha que você definiu
```

Se entrar no prompt `mysql>`, tá funcionando. Saia com `exit`.

## Criando o banco e carregando os dados

Na pasta do projeto, com o MySQL rodando:

```bash
# 1. cria o banco e as tabelas
mysql -uroot -p < sql/01_schema.sql

# 2. carrega os dados de exemplo (usuários, alunos, planos, etc.)
mysql -uroot -p gymcontrol < sql/02_seed.sql
```

**Importante**: rode com a flag `--default-character-set=utf8mb4` se aparecerem acentos estranhos:

```bash
mysql -uroot -p --default-character-set=utf8mb4 < sql/01_schema.sql
mysql -uroot -p --default-character-set=utf8mb4 gymcontrol < sql/02_seed.sql
```

## Configurando a aplicação

Crie um arquivo `.env` na raiz (a partir do [`.env.example`](../../.env.example)) com a sua senha:

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=gymcontrol
JWT_SECRET=qualquer-coisa-pra-dev
```

> O Node lê esse arquivo automaticamente porque o `server.js` usa `process.env.DB_*` com defaults.

Agora rode normal:

```bash
npm install   # uma vez só
npm start
```

Abra <http://localhost:3000>.

## Diferenças vs. Docker

| Aspecto | Docker | MySQL local |
|---|---|---|
| Setup inicial | `docker compose up -d` | Instalador + 2 comandos `mysql < ...` |
| Charset | Já vem certo (configurado no compose) | Você precisa lembrar do `--default-character-set=utf8mb4` |
| Apagar tudo e recomeçar | `docker compose down -v && docker compose up -d` | `DROP DATABASE gymcontrol;` + recarregar os 2 arquivos |
| Roda em segundo plano | Sim, controlado pelo Docker | Sim, como serviço do Windows |
| Ocupa memória parada | ~400 MB | ~250 MB (serviço) |

## Recomeçando do zero

```bash
mysql -uroot -p -e "DROP DATABASE IF EXISTS gymcontrol;"
mysql -uroot -p --default-character-set=utf8mb4 < sql/01_schema.sql
mysql -uroot -p --default-character-set=utf8mb4 gymcontrol < sql/02_seed.sql
```

## Problemas comuns

**"ERROR 1045 (28000): Access denied for user 'root'"**
→ Senha errada. Use a que você definiu no instalador.

**"ERROR 2003: Can't connect to MySQL server on '127.0.0.1'"**
→ O serviço do MySQL não tá rodando. No Windows: `Win + R` → `services.msc` → procure `MySQL80` (ou similar) → clique direito → Iniciar.

**Acentos como "JoÃ£o" após carregar o seed**
→ Esqueceu o `--default-character-set=utf8mb4`. Apague o banco e recarregue (ver "Recomeçando do zero").

**"Port 3306 already in use"** quando você tenta subir o Docker depois
→ É o MySQL nativo que tá rodando. Pare-o em `services.msc` ou troque a porta do Docker.

## Próximo passo
[4. Testando o MySQL](04-testando-mysql.md) — independente de você estar usando Docker ou MySQL local, os comandos pra inspecionar o banco são iguais.
