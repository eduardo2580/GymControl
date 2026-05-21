const {
  BadRequest, normalizeCpf, formatCpf, isValidCpf, requireFields, isValidYearMonth,
} = require('../lib/validators');

describe('normalizeCpf', () => {
  test('strips non-digits', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
    expect(normalizeCpf(' abc 123 def 456 ')).toBe('123456');
    expect(normalizeCpf(null)).toBe('');
    expect(normalizeCpf(undefined)).toBe('');
    expect(normalizeCpf('')).toBe('');
  });
});

describe('formatCpf', () => {
  test('formats 11 digits', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });
});

describe('isValidCpf', () => {
  test.each([
    ['529.982.247-25', true],
    ['52998224725', true],
    ['390.533.447-05', true],
    ['100.456.789-87', true],
    ['111.111.111-11', false], // todos iguais
    ['000.000.000-00', false],
    ['123.456.789-00', false], // dígito errado
    ['', false],
    [null, false],
    [undefined, false],
    ['529.982.247-2', false], // 10 dígitos
    ['529.982.247-256', false], // 12 dígitos
    ['abc.def.ghi-jk', false],
  ])('isValidCpf(%p) → %p', (input, expected) => {
    expect(isValidCpf(input)).toBe(expected);
  });
});

describe('requireFields', () => {
  test('throws BadRequest on missing field', () => {
    expect(() => requireFields({}, ['nome'])).toThrow(BadRequest);
    expect(() => requireFields({ nome: '' }, ['nome'])).toThrow(/nome/);
    expect(() => requireFields({ nome: null }, ['nome'])).toThrow(/nome/);
  });
  test('passes when all fields present', () => {
    expect(() => requireFields({ nome: 'X', cpf: '1' }, ['nome', 'cpf'])).not.toThrow();
  });
  test('BadRequest has 400 status', () => {
    try { requireFields({}, ['x']); }
    catch (e) { expect(e.status).toBe(400); return; }
    throw new Error('should have thrown');
  });
});

describe('isValidYearMonth', () => {
  test.each([
    ['2026-05', true],
    ['2026-12', true],
    ['2026-01', true],
    ['2026-00', false],
    ['2026-13', false],
    ['26-05', false],
    ['2026/05', false],
    ['', false],
    [null, false],
    ['2026-5', false],
  ])('isValidYearMonth(%p) → %p', (input, expected) => {
    expect(isValidYearMonth(input)).toBe(expected);
  });
});
