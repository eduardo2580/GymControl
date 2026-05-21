# RNF05 — Boa organização visual

**Tipo:** Requisito não funcional
**Status:** ✅ Implementado

## Descrição
O sistema deve ter boa organização visual.

## Implementação
- Layout consistente: header fixo, nav lateral (colapsa em mobile), área de conteúdo com cards/panel padronizados.
- Paleta com variáveis CSS (`--bg`, `--surface`, `--accent`, etc.) em [`public/styles.css`](../../../../public/styles.css).
- Helpers de componentes (`panel`, `panelPlain`, `statCard`, `badge`) compartilhados via [`public/js/core.js`](../../../../public/js/core.js).
- Tabelas com filtros visuais (busca por texto, filtro por mês em pagamentos).
