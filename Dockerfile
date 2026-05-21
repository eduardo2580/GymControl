# GymControl - imagem de produção para AWS App Runner / ECS / qualquer runtime de container.
# Multi-stage para deixar a imagem final pequena e sem ferramentas de build.

# ─── Stage 1: dependências ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Apenas o manifesto primeiro — melhor cache de layer
COPY package.json package-lock.json ./

# bcrypt precisa compilar native binding na primeira instalação; alpine traz ausências
RUN apk add --no-cache --virtual .build python3 make g++ \
 && npm ci --omit=dev --no-audit --no-fund \
 && apk del .build

# ─── Stage 2: imagem final ────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Usuário não-root + curl pro HEALTHCHECK + tini como PID 1.
# Em seguida REMOVE o npm (e o corepack) — não rodamos npm em produção e o
# npm bundled trazia CVE-2024-21538 (cross-spawn ReDoS). Imagem fica menor
# e com menos superfície de ataque.
RUN apk add --no-cache curl tini \
 && addgroup -S app && adduser -S app -G app \
 && rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn-v* \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg

WORKDIR /app

# Copia node_modules da stage 1 e o código do projeto
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app server.js package.json ./
COPY --chown=app:app lib ./lib
COPY --chown=app:app sql ./sql
COPY --chown=app:app public ./public

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000
USER app

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/healthz || exit 1

# tini = init mínimo, encaminha sinais corretamente e colhe zombies
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
