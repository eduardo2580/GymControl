// Remove PII e segredos antes de mandar ao console.error.
// Usado para evitar vazamento de CPF, email, senha e tokens nos logs do servidor.

const SENSITIVE_KEYS = new Set([
  'senha', 'senha_hash', 'senhaHash', 'password', 'passwd',
  'cpf', 'email', 'token', 'jwt', 'authorization',
  'cookie', 'set-cookie', 'gym_token',
]);

// Padrões que aparecem em SQL/strings literais (ex.: VALUES ('111.222.333-44')).
// Substitui o conteúdo entre aspas por [REDACTED].
const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const BCRYPT_RE = /\$2[aby]?\$\d{1,2}\$[./A-Za-z0-9]{50,}/g;

function redactString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(CPF_RE, '[REDACTED_CPF]')
    .replace(EMAIL_RE, '[REDACTED_EMAIL]')
    .replace(BCRYPT_RE, '[REDACTED_HASH]');
}

function sanitize(value, seen = new WeakSet()) {
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return '[circular]';
  seen.add(value);

  if (Array.isArray(value)) return value.map(v => sanitize(v, seen));

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = sanitize(v, seen);
    }
  }
  return out;
}

function sanitizeError(err) {
  if (!err) return err;
  if (err instanceof Error) {
    const out = {
      name: err.name,
      message: redactString(err.message),
      code: err.code,
    };
    if (err.sql) out.sql = redactString(err.sql);
    if (err.stack) out.stack = redactString(err.stack);
    return out;
  }
  return sanitize(err);
}

module.exports = { sanitize, sanitizeError, redactString };
