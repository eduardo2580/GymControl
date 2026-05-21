const { splitStatements } = require('../lib/migrate');

describe('splitStatements', () => {
  test('split simples por ponto-e-vírgula', () => {
    const out = splitStatements('CREATE TABLE x (id INT); INSERT INTO x VALUES (1);');
    expect(out).toEqual(['CREATE TABLE x (id INT)', 'INSERT INTO x VALUES (1)']);
  });

  test('remove comentários de linha (-- ...)', () => {
    const sql = `
      -- isto é um comentário
      CREATE TABLE x (id INT);
      -- outro
      INSERT INTO x VALUES (1);
    `;
    const out = splitStatements(sql);
    expect(out).toEqual(['CREATE TABLE x (id INT)', 'INSERT INTO x VALUES (1)']);
  });

  test('ignora statements vazios', () => {
    const out = splitStatements(';;;CREATE TABLE x (id INT);;\n;');
    expect(out).toEqual(['CREATE TABLE x (id INT)']);
  });

  test('preserva múltiplas linhas dentro de um statement', () => {
    const sql = `CREATE TABLE alunos (
      id INT,
      nome VARCHAR(120)
    );`;
    const out = splitStatements(sql);
    expect(out.length).toBe(1);
    expect(out[0]).toContain('CREATE TABLE alunos');
    expect(out[0]).toContain('VARCHAR(120)');
  });

  test('arquivo schema do projeto produz pelo menos 8 statements (8 tabelas + use + create db ...)', () => {
    const fs = require('fs');
    const path = require('path');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'sql', '01_schema.sql'), 'utf8');
    const out = splitStatements(schema);
    // 1 CREATE DATABASE + 1 USE + 1 SET FK=0 + 8 DROP TABLE + 1 SET FK=1 + 8 CREATE + 1 ALTER = 21+
    expect(out.length).toBeGreaterThanOrEqual(20);
  });
});
