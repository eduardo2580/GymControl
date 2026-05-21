# RNF01 — Interface simples e intuitiva

**Tipo:** Requisito não funcional
**Status:** ✅ Implementado

## Descrição
O sistema deve possuir interface simples e intuitiva.

## Implementação
- Front-end em HTML + Tailwind CSS (via CDN) com 3 dashboards distintos (admin, professor, aluno) navegados por abas laterais.
- Modais consistentes para todas as ações de cadastro/edição.
- Botões com estado de carregamento (`Salvando...`) via helper `submitting()` em [`public/js/core.js`](../../../../public/js/core.js).
- Máscaras automáticas de CPF e telefone melhoram a usabilidade (ver RF01).
- Toasts unificados para sucesso/erro/info.
