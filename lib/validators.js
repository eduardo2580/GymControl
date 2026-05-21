class BadRequest extends Error {
  constructor(msg) { super(msg); this.status = 400; }
}

function normalizeCpf(s) { return String(s || '').replace(/\D/g, ''); }
function formatCpf(d) { return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`; }

function isValidCpf(raw) {
  const d = normalizeCpf(raw);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (slice) => {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) sum += parseInt(slice[i]) * (slice.length + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(d.slice(0, 9)) === parseInt(d[9]) && calc(d.slice(0, 10)) === parseInt(d[10]);
}

function requireFields(body, fields) {
  for (const f of fields) {
    if (body[f] == null || body[f] === '') throw new BadRequest(`Campo "${f}" é obrigatório`);
  }
}

const YEAR_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
function isValidYearMonth(s) { return YEAR_MONTH_RE.test(String(s || '')); }

module.exports = {
  BadRequest,
  normalizeCpf,
  formatCpf,
  isValidCpf,
  requireFields,
  isValidYearMonth,
};
