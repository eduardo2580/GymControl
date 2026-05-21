# Endurecimento de segurança

**Adicionado em:** commit `2e536e3`
**Justificativa:** Reforço de [RNF07](../requirements/rnf/RNF07.md).

## Medidas aplicadas

| Medida | Onde |
|---|---|
| **bcrypt** para senhas (custo 10) | [`lib/auth.js`](../../../lib/auth.js), [`server.js`](../../../server.js) |
| **JWT em cookie httpOnly + SameSite=Strict** | [`lib/auth.js`](../../../lib/auth.js) |
| **`secure: true` em produção** | [`lib/auth.js`](../../../lib/auth.js) |
| **helmet** (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.) | [`server.js`](../../../server.js) |
| **express-rate-limit**: 120/min em `/api`, 5/min em `/api/auth/login` | [`server.js`](../../../server.js) |
| **`JWT_SECRET` obrigatório em produção** (servidor recusa subir com o default) | [`server.js`](../../../server.js) |
| **Validação de CPF** (formato + dígito verificador) | [`lib/validators.js`](../../../lib/validators.js) |
| **`requireFields`** para campos obrigatórios | [`lib/validators.js`](../../../lib/validators.js) |
| **Erros amigáveis** em vez de 500 (CPF duplicado, pagamento duplicado → 400) | [`server.js`](../../../server.js) |
| **Headers extra no Vercel** (X-Frame-Options DENY, Referrer-Policy) | [`vercel.json`](../../../vercel.json) |

## CORS
- `cors({ origin: true, credentials: true })`. Suficiente enquanto frontend e backend estão na mesma origem. Para o deploy frontend-only no Vercel + backend AWS, ajustar `origin` para a URL do Vercel e configurar domínios em subdomínio compartilhado (cookie SameSite=Strict).

## Não implementado (fora do escopo do trabalho)
- Reset de senha por email
- Verificação de email
- 2FA
- CSRF token explícito (mitigado por SameSite=Strict + cookie httpOnly)
