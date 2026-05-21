import { sanitize, sanitizeError, redactString } from '../lib/log-sanitizer.js';

describe('redactString', () => {
  test('redacts CPF in any format', () => {
    expect(redactString('aluno 529.982.247-25 cadastrado')).toBe('aluno [REDACTED_CPF] cadastrado');
    expect(redactString('cpf=52998224725')).toBe('cpf=[REDACTED_CPF]');
  });
  test('redacts email', () => {
    expect(redactString('login para joao@example.com'))
      .toBe('login para [REDACTED_EMAIL]');
  });
  test('redacts bcrypt hash', () => {
    const hash = '$2b$10$8DgQzrxhA5t0lfJc4BMGOO99.OX.qzeNGUt1SwcIOEfhAAXixbD0q';
    expect(redactString(`hash=${hash}`)).toBe('hash=[REDACTED_HASH]');
  });
  test('leaves harmless strings alone', () => {
    expect(redactString('OK')).toBe('OK');
    expect(redactString('')).toBe('');
  });
});

describe('sanitize (objects)', () => {
  test('replaces values of sensitive keys', () => {
    const out = sanitize({
      nome: 'João',
      senha: 'secret123',
      senha_hash: '$2b$10$xxxxxxxxxx',
      email: 'a@b.com',
      cpf: '529.982.247-25',
      token: 'abc.def.ghi',
    });
    expect(out.nome).toBe('João');
    expect(out.senha).toBe('[REDACTED]');
    expect(out.senha_hash).toBe('[REDACTED]');
    expect(out.email).toBe('[REDACTED]');
    expect(out.cpf).toBe('[REDACTED]');
    expect(out.token).toBe('[REDACTED]');
  });

  test('recursa em sub-objetos', () => {
    const out = sanitize({ body: { senha: 'x', nome: 'João' } });
    expect(out.body.senha).toBe('[REDACTED]');
    expect(out.body.nome).toBe('João');
  });

  test('redacts patterns within free-form strings', () => {
    const out = sanitize({ message: 'erro com 111.222.333-44' });
    expect(out.message).toBe('erro com [REDACTED_CPF]');
  });

  test('handles arrays and primitives', () => {
    expect(sanitize([1, 'a@b.com', null])).toEqual([1, '[REDACTED_EMAIL]', null]);
    expect(sanitize(null)).toBe(null);
    expect(sanitize(42)).toBe(42);
  });

  test('survives circular references', () => {
    const a = { nome: 'x' };
    a.self = a;
    const out = sanitize(a);
    expect(out.nome).toBe('x');
    expect(out.self).toBe('[circular]');
  });
});

describe('sanitizeError', () => {
  test('Error objects keep name/message/code but scrub the message body', () => {
    const e = new Error('Duplicate entry for cpf 529.982.247-25');
    e.code = 'ER_DUP_ENTRY';
    const out = sanitizeError(e);
    expect(out.name).toBe('Error');
    expect(out.code).toBe('ER_DUP_ENTRY');
    expect(out.message).toContain('[REDACTED_CPF]');
    expect(out.message).not.toContain('529.982.247-25');
  });

  test('mysql2-style error with sql field is scrubbed', () => {
    const e = new Error('insert failed');
    e.sql = "INSERT INTO usuarios VALUES ('admin@gym.com', '$2b$10$abc.................................................xyz')";
    const out = sanitizeError(e);
    expect(out.sql).toContain('[REDACTED_EMAIL]');
    expect(out.sql).toContain('[REDACTED_HASH]');
  });

  test('null and undefined pass through', () => {
    expect(sanitizeError(null)).toBe(null);
    expect(sanitizeError(undefined)).toBe(undefined);
  });
});
