# Ambiente de desenvolvimento com Docker

**Adicionado em:** commit `4b382dc`.

## Por que
O docx prevê MySQL como banco (QUADRO 10), mas instalar e configurar MySQL localmente em 6 máquinas diferentes é fricção. Docker resolve isso em um comando.

## Como funciona
[`docker-compose.yml`](../../../docker-compose.yml) sobe `gymcontrol-mysql`:
- Imagem `mysql:8.4`
- `command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci`
- Porta `3306` mapeada para `localhost:3306`
- Volume `gymcontrol_mysql_data` persiste os dados entre `start`/`stop`
- Healthcheck via `mysqladmin ping`
- **Auto-seed**: `sql/01_schema.sql` e `sql/02_seed.sql` montados em `/docker-entrypoint-initdb.d` — rodam automaticamente na primeira vez que o volume é criado.

## Comandos
```bash
docker compose up -d      # primeira vez (baixa imagem, cria volume, popula)
docker compose stop       # pausar (mantém dados)
docker compose start      # religar
docker compose down       # remove container (mantém volume)
docker compose down -v    # apaga tudo, inclusive dados
```

## Gotcha resolvido: UTF-8 duplo-encoded
Sem os flags `--character-set-server=utf8mb4`, a primeira carga do seed gravava "João" como `4A6F C3 83 C2 A3 6F` (duplo-encoded). Fix: flags no `command` + `charset: 'utf8mb4'` no pool do `mysql2` em [`server.js`](../../../server.js).
