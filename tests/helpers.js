const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const request = require('supertest');

const SEED_SQL = fs.readFileSync(path.join(__dirname, '..', 'sql', '02_seed.sql'), 'utf8');

async function resetDb() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'gymcontrol',
    multipleStatements: true,
    charset: 'utf8mb4',
  });
  await conn.query('SET FOREIGN_KEY_CHECKS=0');
  for (const t of ['frequencias','exercicios','treinos','pagamentos','usuarios','alunos','professores','planos']) {
    await conn.query(`TRUNCATE TABLE ${t}`);
  }
  await conn.query('SET FOREIGN_KEY_CHECKS=1');
  await conn.query(SEED_SQL.replace(/^USE\s+\w+;\s*$/gim, ''));
  await conn.end();
}

async function loginAs(app, email, senha) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, senha });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  const cookie = res.headers['set-cookie'][0].split(';')[0];
  return { cookie, user: res.body };
}

const ACCOUNTS = {
  admin:     { email: 'admin@gym.com',  senha: 'admin123' },
  professor: { email: 'ana@gym.com',    senha: 'prof123' },
  aluno:     { email: 'joao@aluno.com', senha: 'aluno123' },
};

module.exports = { resetDb, loginAs, ACCOUNTS };
