# RNF04 — Acessível por navegador

**Tipo:** Requisito não funcional
**Status:** ✅ Implementado

## Descrição
O sistema deve ser acessível por navegador web.

## Implementação
- Aplicação web SPA-like servida em `/`. Backend Express serve arquivos estáticos da pasta `public/` ([`server.js`](../../../../server.js)).
- Testado em Chromium via Playwright (ver [`added/testes-automatizados.md`](../../added/testes-automatizados.md)).
- Configurado para deploy estático no Vercel ([`vercel.json`](../../../../vercel.json)) — frontend separado preparado para apontar para a API quando o backend for hospedado.
