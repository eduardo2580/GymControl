// Bootstrap idempotente do schema/seed em um RDS vazio.
// Só roda se AUTO_MIGRATE=1 e a tabela `usuarios` não existir.
// Pensado para o primeiro deploy do GymControl na AWS, sem necessidade
// de bastion ou Lambda extra. Depois do primeiro boot, é no-op.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const SQL_DIR = path.join(__dirname, '..', 'sql');

function readSql(file) {
  return fs.readFileSync(path.join(SQL_DIR, file), 'utf8');
}

// Quebra um arquivo SQL em statements individuais respeitando aspas/comentários simples.
// Não é um parser completo, mas resolve os arquivos do projeto (sem stored procedures
// nem DELIMITER). Para 04_tests.sql não usar isto — esse arquivo tem DELIMITER.
function splitStatements(sql) {
  return sql
    .split('\n')
    .filter(line => !/^\s*--/.test(line))    // remove comentários de linha
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

async function alreadyMigrated(conn, dbName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = 'usuarios' LIMIT 1`,
    [dbName]
  );
  return rows.length > 0;
}

async function runFile(conn, file) {
  const stmts = splitStatements(readSql(file));
  for (const s of stmts) {
    await conn.query(s);
  }
}

/**
 * Roda schema + seed se a tabela `usuarios` ainda não existe.
 * Retorna { ran: boolean, reason: string }.
 *
 * @param {object} opts
 * @param {string} opts.host
 * @param {number} opts.port
 * @param {string} opts.user       — usuário com permissão DDL (master do RDS)
 * @param {string} opts.password
 * @param {string} opts.database
 */
async function runMigrationIfNeeded(opts) {
  // Conexão dedicada (multi-statement off por segurança, charset utf8mb4)
  const conn = await mysql.createConnection({
    host: opts.host,
    port: Number(opts.port) || 3306,
    user: opts.user,
    password: opts.password,
    multipleStatements: false,
    charset: 'utf8mb4',
  });

  try {
    // 01_schema.sql cria o database em si — então conectamos sem database
    // e deixamos o arquivo fazer CREATE DATABASE IF NOT EXISTS.
    const exists = await conn.query(
      `SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME = ?`,
      [opts.database]
    ).then(([rows]) => rows.length > 0);

    if (exists) {
      await conn.query(`USE \`${opts.database}\``);
      if (await alreadyMigrated(conn, opts.database)) {
        return { ran: false, reason: 'já migrado (tabela usuarios existe)' };
      }
    }

    console.log('[migrate] aplicando 01_schema.sql ...');
    await runFile(conn, '01_schema.sql');
    await conn.query(`USE \`${opts.database}\``);

    console.log('[migrate] aplicando 02_seed.sql ...');
    await runFile(conn, '02_seed.sql');

    return { ran: true, reason: 'schema+seed aplicados' };
  } finally {
    await conn.end();
  }
}

module.exports = { runMigrationIfNeeded, splitStatements };
