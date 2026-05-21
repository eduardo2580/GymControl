# 1. Docker do zero

## O que é Docker

Docker é um programa que roda outros programas dentro de "caixinhas" chamadas **containers**. Cada container tem tudo que aquele programa precisa pra funcionar (sistema operacional mini, dependências, configurações). Isso resolve o clássico "na minha máquina funciona": se funciona no container, funciona em qualquer máquina que tenha Docker.

No GymControl, a gente usa Docker pra subir o **MySQL** sem precisar instalar nada de banco de dados na sua máquina.

## Instalando o Docker Desktop (Windows)

1. Vá em <https://www.docker.com/products/docker-desktop>
2. Clique em **"Download for Windows"**.
3. Rode o instalador, marcando "Use WSL 2 instead of Hyper-V" quando aparecer (default).
4. **Reinicie o computador**.
5. Abra o Docker Desktop pelo menu Iniciar.
6. Aceite os termos e espere o ícone da baleinha 🐳 ficar **verde/estável** na bandeja do sistema (barra inferior direita).

> 💡 Se aparecer um aviso pedindo pra instalar/atualizar o **WSL 2 Linux kernel**, clique no link, instale, reabra o Docker Desktop. Sem isso, o Docker não roda.

Pra confirmar que tá tudo certo, abra um terminal (PowerShell ou Git Bash) e rode:

```bash
docker --version
docker compose version
```

Deve aparecer algo como `Docker version 27.x.x` e `Docker Compose version v2.x.x`.

## Como o GymControl usa o Docker

O arquivo [`docker-compose.yml`](../../docker-compose.yml) na raiz do projeto diz pro Docker:
- Baixar a imagem oficial do **MySQL 8.4**.
- Subir um container chamado `gymcontrol-mysql`.
- Expor o banco na porta `3306` do `localhost` (acessível como qualquer MySQL local).
- Persistir os dados num volume Docker, pra você não perder nada quando desligar o container.
- **Rodar automaticamente** os arquivos [`sql/01_schema.sql`](../../sql/01_schema.sql) (cria as tabelas) e [`sql/02_seed.sql`](../../sql/02_seed.sql) (insere dados de exemplo) na primeira vez.

## Subindo o banco — primeira vez

Com o Docker Desktop aberto e a baleinha verde, na pasta do projeto:

```bash
docker compose up -d
```

O que isso faz:
- `up` = sobe os serviços do `docker-compose.yml`.
- `-d` = "detached", roda em segundo plano (sem prender seu terminal).

**Primeira vez** baixa a imagem do MySQL (~500 MB) — pode demorar alguns minutos. Próximas vezes, sobe em segundos.

Pra ver se subiu:

```bash
docker ps
```

Deve aparecer o `gymcontrol-mysql` com status `Up X seconds (healthy)`.

## Subindo a aplicação

Banco no ar, agora a aplicação Node:

```bash
npm install   # só na primeira vez
npm start
```

Abra <http://localhost:3000> e use uma conta demo (`admin@gym.com` / `admin123`).

## Comandos do dia a dia

| Quero... | Comando |
|---|---|
| Parar o banco no fim do dia | `docker compose stop` |
| Religar o banco amanhã | `docker compose start` |
| Ver se o banco tá rodando | `docker ps` |
| Ver os logs do banco | `docker logs gymcontrol-mysql` |
| Entrar no MySQL via terminal | `docker exec -it gymcontrol-mysql mysql -uroot -proot gymcontrol` |
| Remover o container (mantém dados) | `docker compose down` |
| Apagar tudo e recomeçar do zero | `docker compose down -v` |

## Problemas comuns

**"docker: command not found"**
→ O Docker Desktop não tá instalado ou não foi adicionado ao PATH. Reinstale.

**"Cannot connect to the Docker daemon"**
→ O Docker Desktop tá fechado. Abra ele e espere o ícone ficar verde.

**"Port 3306 is already in use"**
→ Já tem outro MySQL rodando na sua máquina. Pare-o, ou troque a porta em [`docker-compose.yml`](../../docker-compose.yml) (`"3307:3306"` em vez de `"3306:3306"`) e ajuste `DB_PORT` no `.env`.

**Acentos aparecem como "JoÃ£o"** depois de baixar dados
→ É charset duplo-encoded. Apague o volume e suba de novo: `docker compose down -v && docker compose up -d`.

**Quero ver o banco direto, sem terminal**
→ Veja [04-testando-mysql.md](04-testando-mysql.md) — mostra como conectar com MySQL Workbench ou VSCode.

## Próximo passo
[2. Playwright do zero](02-playwright.md)
