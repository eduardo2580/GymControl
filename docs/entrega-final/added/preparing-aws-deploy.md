# Preparando o deploy na AWS

**Status:** 🚧 em andamento

Documento de planejamento e checklist do endurecimento de segurança feito **antes** de subir o sistema na AWS. O alvo é manter o frontend na Vercel (estático) e o backend + banco na AWS, com o sistema acessível publicamente, mesmo que sem uso real (showcase acadêmico).

## Arquitetura alvo

```
   Browser  ──HTTPS──►  Vercel (estático, public/)
                            │
                            └─ chama /api/* (rewrite)
                                       │
                                       ▼
                            AWS App Runner (Node + Express)
                                       │
                                       ▼
                            AWS RDS MySQL 8 (VPC privada)
```

- **Vercel** (frontend já no ar em <https://gym-control-pearl.vercel.app>): deploy automático via GitHub. Configurado em [`vercel.json`](../../../vercel.json).
- **AWS App Runner**: serviço gerenciado, escala automaticamente, fácil de configurar via console.
- **RDS MySQL 8** (instance `db.t4g.micro`, free tier 12 meses).
- **VPC connector** entre App Runner e RDS — banco **sem** `publicly_accessible`.

## Por que endurecer antes de subir

O `RNF07` ("proteger informações básicas dos usuários") foi cumprido com o suficiente para o trabalho da disciplina, mas expor o sistema na internet pública amplia o vetor de ataque. Antes do deploy reforçamos:

| # | Item | Tipo | Status |
|---|---|---|---|
| 1 | Usuário MySQL dedicado (não `root`) com privilégio mínimo | Script SQL | 🟡 |
| 2 | `JWT_SECRET` em AWS Secrets Manager (ou Parameter Store) | Infra | 🔴 |
| 3 | HTTPS obrigatório com termination correta (App Runner já dá) | Infra | 🔴 |
| 4 | CORS restrito por allowlist via env var | Código | 🟡 |
| 5 | CSP (`Content-Security-Policy`) explícita no helmet | Código | 🟡 |
| 6 | Logs sem PII (CPF, email, hash, token) | Código | 🟡 |
| 7 | RDS em VPC privada | Infra | 🔴 |
| 8 | Backup automático do RDS — TTL mínimo (1 dia), já que é projeto temporário | Infra | 🔴 |
| 9 | HSTS habilitado em produção, TTL mínimo (não é projeto duradouro pra justificar preload de 1 ano) | Código | 🟡 |
| 10 | Cookie cross-subdomain (api.x.com ↔ x.com) ou Bearer token | Código | 🔴 |

Status: 🟢 feito · 🟡 em código (pendente confirmar) · 🔴 só quando subir a infra

## Decisões em aberto

### Cookie ou Bearer token?
O cookie `httpOnly` + `SameSite=Strict` funciona bem same-origin. No deploy split (Vercel + AWS), só funciona se ambos compartilharem domínio raiz:

- ✅ **Plano A — domínio comum**: `gymcontrol.com` (Vercel) + `api.gymcontrol.com` (App Runner). Cookie com `Domain=.gymcontrol.com`. Mantém XSS-resistência.
- ⚠️ **Plano B — sem domínio próprio**: trocar para `Authorization: Bearer <token>` em localStorage. Mais simples no deploy, mas perde resistência a XSS.

Para um showcase universitário sem uso real, Plano B é defensável. Decisão será tomada quando soubermos se vamos comprar/usar um domínio.

### Onde os segredos vivem?
Em produção, **nunca** colocar `JWT_SECRET` ou `DB_PASSWORD` em `App Runner Configuration > Environment Variables` em texto. Usar:
- **AWS Secrets Manager** (ideal) ou
- **AWS Systems Manager Parameter Store** com SecureString (mais barato).

App Runner consegue ler ambos via service role.

## Checklist de ações de código (feitas neste branch)

- [x] [`sql/05_app_user.sql`](../../../sql/05_app_user.sql) — script para criar o usuário `gymcontrol_app` com `SELECT/INSERT/UPDATE/DELETE` apenas (sem DDL).
- [x] CORS env-driven em [`server.js`](../../../server.js) — `CORS_ORIGINS=https://x.com,https://y.com`.
- [x] Helmet com CSP explícita liberando apenas o necessário (Tailwind CDN).
- [x] HSTS com TTL de 1 ano + `includeSubDomains` em produção.
- [x] `sanitizeError()` em [`lib/log-sanitizer.js`](../../../lib/log-sanitizer.js) — remove `senha`, `senha_hash`, `cpf`, `email`, `token` antes do `console.error`.

## Checklist de ações de infra (não feitas — esperam o deploy real)

- [ ] Criar RDS MySQL t4g.micro em VPC privada, security group restritivo.
- [ ] Rodar `sql/01_schema.sql` + `sql/02_seed.sql` + `sql/05_app_user.sql` no RDS via bastion temporário (ou Query Editor do RDS).
- [ ] Criar JWT_SECRET aleatório (32+ bytes), salvar em Secrets Manager.
- [ ] Criar service no App Runner conectado ao RDS via VPC connector, lendo secrets do Secrets Manager.
- [ ] Configurar `CORS_ORIGINS` no App Runner com o domínio do Vercel.
- [ ] Adicionar `rewrites` ao `vercel.json` apontando `/api/*` para o App Runner.
- [ ] Decidir cookie vs Bearer (ver acima).
- [ ] Testar smoke no ar.

## Plano de rollback

Em caso de problema no ar:
- Vercel: voltar deploy anterior (1 clique).
- App Runner: voltar tag da imagem (1 clique).
- RDS: backup automático restaura.

## Custo estimado (12 meses)

- **Vercel hobby**: $0 (hobby tier).
- **App Runner**: ~$5/mês idle (0.25 vCPU, 0.5 GB).
- **RDS t4g.micro**: $0 nos primeiros 12 meses (free tier), depois ~$13/mês.
- **Secrets Manager**: $0.40/segredo/mês.

Total nos primeiros 12 meses: ~$5,40/mês. Compatível com um projeto de demonstração temporário.
