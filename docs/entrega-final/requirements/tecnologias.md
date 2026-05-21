# Tecnologias (QUADRO 11)

**Status:** ✅ Implementado

## Definidas no planejamento

| Tecnologia | Onde se usa | Status |
|---|---|---|
| JavaScript (Node.js + ES2022) | Backend [`server.js`](../../../server.js) + frontend `public/js/*` | ✅ |
| HTML + CSS (Tailwind via CDN) | [`public/index.html`](../../../public/index.html), [`public/styles.css`](../../../public/styles.css) | ✅ |
| Node.js (Express) | API REST em [`server.js`](../../../server.js) | ✅ |
| MySQL 8.4 | Banco de dados ([`sql/01_schema.sql`](../../../sql/01_schema.sql)) via Docker em dev | ✅ |
| Lucidchart / Visual Paradigm / Astah | Diagramas UML do docx | (fora do código) |

## Adicionadas durante o desenvolvimento

| Tecnologia | Função | Detalhes |
|---|---|---|
| **mysql2** | Driver MySQL com promises e pool | [`server.js`](../../../server.js) |
| **bcrypt** | Hash de senha (custo 10) | [RNF07](rnf/RNF07.md) |
| **jsonwebtoken** | JWT em cookie httpOnly | [`lib/auth.js`](../../../lib/auth.js) |
| **cookie-parser** | Leitura de cookies | [`server.js`](../../../server.js) |
| **helmet** | Headers de segurança | [added/seguranca.md](../added/seguranca.md) |
| **express-rate-limit** | Limite de requisições | 120/min API, 5/min login |
| **Jest + Supertest** | Testes de API e unitários | [added/testes-automatizados.md](../added/testes-automatizados.md) |
| **Playwright** | Testes E2E (Chromium) | + vídeo "human-paced" via ffmpeg-static |
| **ffmpeg-static** | Concat de vídeos do Playwright em um MP4 único | [`scripts/concat-e2e-video.js`](../../../scripts/concat-e2e-video.js) |
| **ESLint v9 (flat config)** | Lint | [`eslint.config.js`](../../../eslint.config.js) |
| **Docker / docker-compose** | MySQL local | [added/docker-dev.md](../added/docker-dev.md) |
| **GitHub Actions** | CI (lint + SQL + Jest + Playwright) | [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) |
| **Vercel** | Deploy do frontend estático | [`vercel.json`](../../../vercel.json) |
