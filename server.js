const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const {
  BadRequest, normalizeCpf, formatCpf, isValidCpf, requireFields,
} = require('./lib/validators');
const {
  setAuthCookie, clearAuthCookie, signToken, makeAuthenticate, requireAuth, requireRole,
} = require('./lib/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dev-secret-change-me') {
  console.error('FATAL: JWT_SECRET must be set in production');
  process.exit(1);
}

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false, // Tailwind CDN + inline styles in the existing HTML
}));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
});
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde um minuto.' },
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'gymcontrol',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  decimalNumbers: true,
  charset: 'utf8mb4',
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
async function qOne(sql, params = []) {
  const rows = await q(sql, params);
  return rows[0] || null;
}
async function qRun(sql, params = []) {
  const [res] = await pool.query(sql, params);
  return res;
}
function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
function todayISO() {
  return new Date().toISOString().split('T')[0];
}
function wrap(handler) {
  return (req, res) => handler(req, res).catch(e => {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: e.message });
  });
}


// Field aliases keep the API in camelCase even though MySQL uses snake_case
const ALUNO_COLS = `a.id, a.nome, a.cpf, a.telefone,
  a.data_nascimento AS dataNascimento, a.status,
  a.plano_id AS planoId, a.data_inicio_plano AS dataInicioPlano, a.observacoes`;
const PAG_COLS = `p.id, p.aluno_id AS alunoId, p.data_pagamento AS dataPagamento,
  p.data_vencimento AS dataVencimento, p.valor, p.status,
  p.referencia_mensal AS referenciaMensal, p.metodo_pagamento AS metodoPagamento, p.observacoes`;
const TREINO_COLS = `t.id, t.aluno_id AS alunoId, t.professor_id AS professorId,
  t.objetivo, t.data_inicio AS dataInicio, t.data_fim AS dataFim, t.nivel, t.observacoes`;
const FREQ_COLS = `f.id, f.aluno_id AS alunoId, f.data_entrada AS dataEntrada,
  f.horario_entrada AS horarioEntrada, f.horario_saida AS horarioSaida`;
const EX_COLS = `id, nome, grupo_muscular AS grupoMuscular, series, repeticoes,
  descanso_seg AS descanso, ordem`;

// ─── AUTH ────────────────────────────────────────────────────────────────────
app.use(makeAuthenticate(JWT_SECRET));
app.use(express.static('public'));

app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  const u = await qOne(
    `SELECT id, nome, email, senha_hash, tipo_usuario AS role, aluno_id AS alunoId, professor_id AS professorId
     FROM usuarios WHERE email=?`,
    [email]
  );
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const payload = { id: u.id, role: u.role, alunoId: u.alunoId, professorId: u.professorId };
  setAuthCookie(res, signToken(payload, JWT_SECRET));
  res.json({ id: u.id, nome: u.nome, email: u.email, role: u.role, alunoId: u.alunoId, professorId: u.professorId });
}));

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  res.json(req.user);
});

// Tudo abaixo exige autenticação. Gates por papel são aplicados rota a rota.
app.use('/api', requireAuth);

const adminOnly = requireRole('Admin');
const adminOrProf = requireRole('Admin', 'Professor');

async function isInadimplente(alunoId) {
  const row = await qOne(
    `SELECT id FROM pagamentos
     WHERE aluno_id=? AND referencia_mensal=? AND status='Pago' LIMIT 1`,
    [alunoId, currentYearMonth()]
  );
  return !row;
}

async function loadExercicios(treinoId) {
  return q(`SELECT ${EX_COLS} FROM exercicios WHERE treino_id=? ORDER BY ordem`, [treinoId]);
}

async function replaceExercicios(treinoId, exercicios) {
  await qRun('DELETE FROM exercicios WHERE treino_id=?', [treinoId]);
  if (!exercicios || !exercicios.length) return;
  const rows = exercicios.map((e, i) => [
    treinoId,
    e.nome,
    e.grupoMuscular,
    Number(e.series) || 1,
    String(e.repeticoes ?? ''),
    e.descanso != null ? Number(e.descanso) : null,
    i + 1,
  ]);
  await pool.query(
    `INSERT INTO exercicios (treino_id, nome, grupo_muscular, series, repeticoes, descanso_seg, ordem)
     VALUES ?`,
    [rows]
  );
}

// ─── ALUNOS ──────────────────────────────────────────────────────────────────
app.get('/api/alunos', wrap(async (_req, res) => {
  const alunos = await q(`SELECT ${ALUNO_COLS} FROM alunos a ORDER BY a.nome`);
  const planos = await q('SELECT id, nome FROM planos');
  const ym = currentYearMonth();
  const pagos = new Set((await q(
    `SELECT DISTINCT aluno_id AS id FROM pagamentos WHERE referencia_mensal=? AND status='Pago'`,
    [ym]
  )).map(r => r.id));
  res.json(alunos.map(a => ({
    ...a,
    planoNome: planos.find(p => p.id === a.planoId)?.nome || null,
    inadimplente: !pagos.has(a.id),
  })));
}));

app.get('/api/alunos/:id', wrap(async (req, res) => {
  const aluno = await qOne(`SELECT ${ALUNO_COLS} FROM alunos a WHERE a.id=?`, [req.params.id]);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const plano = aluno.planoId
    ? await qOne('SELECT nome FROM planos WHERE id=?', [aluno.planoId])
    : null;
  res.json({
    ...aluno,
    planoNome: plano?.nome || null,
    inadimplente: await isInadimplente(aluno.id),
  });
}));

app.post('/api/alunos', adminOnly, wrap(async (req, res) => {
  requireFields(req.body, ['nome', 'cpf']);
  const { nome, cpf, telefone, dataNascimento, planoId, observacoes } = req.body;
  if (!isValidCpf(cpf)) throw new BadRequest('CPF inválido');
  const r = await qRun(
    `INSERT INTO alunos (nome, cpf, telefone, data_nascimento, status, plano_id, data_inicio_plano, observacoes)
     VALUES (?,?,?,?,'Ativo',?,?,?)`,
    [String(nome).trim(), formatCpf(normalizeCpf(cpf)), telefone || null, dataNascimento || null,
     planoId ? parseInt(planoId) : null, todayISO(), observacoes || '']
  ).catch(e => {
    if (e.code === 'ER_DUP_ENTRY') throw new BadRequest('CPF já cadastrado');
    throw e;
  });
  res.status(201).json(await qOne(`SELECT ${ALUNO_COLS} FROM alunos a WHERE a.id=?`, [r.insertId]));
}));

app.put('/api/alunos/:id', adminOnly, wrap(async (req, res) => {
  requireFields(req.body, ['nome', 'cpf']);
  const { nome, cpf, telefone, dataNascimento, status, planoId, observacoes } = req.body;
  if (!isValidCpf(cpf)) throw new BadRequest('CPF inválido');
  await qRun(
    `UPDATE alunos SET nome=?, cpf=?, telefone=?, data_nascimento=?, status=?, plano_id=?, observacoes=?
     WHERE id=?`,
    [String(nome).trim(), formatCpf(normalizeCpf(cpf)), telefone || null, dataNascimento || null, status,
     planoId ? parseInt(planoId) : null, observacoes || '', req.params.id]
  ).catch(e => {
    if (e.code === 'ER_DUP_ENTRY') throw new BadRequest('CPF já cadastrado');
    throw e;
  });
  res.json(await qOne(`SELECT ${ALUNO_COLS} FROM alunos a WHERE a.id=?`, [req.params.id]));
}));

app.delete('/api/alunos/:id', adminOnly, wrap(async (req, res) => {
  await qRun('DELETE FROM alunos WHERE id=?', [req.params.id]);
  res.status(204).send();
}));

// ─── PROFESSORES ─────────────────────────────────────────────────────────────
app.get('/api/professores', wrap(async (_req, res) => {
  res.json(await q('SELECT * FROM professores ORDER BY nome'));
}));

app.post('/api/professores', adminOnly, wrap(async (req, res) => {
  const { nome, cref, especialidade, telefone, email } = req.body;
  const r = await qRun(
    'INSERT INTO professores (nome, cref, especialidade, telefone, email) VALUES (?,?,?,?,?)',
    [nome, cref, especialidade, telefone, email]
  );
  res.status(201).json(await qOne('SELECT * FROM professores WHERE id=?', [r.insertId]));
}));

app.put('/api/professores/:id', adminOnly, wrap(async (req, res) => {
  const { nome, cref, especialidade, telefone, email } = req.body;
  await qRun(
    'UPDATE professores SET nome=?, cref=?, especialidade=?, telefone=?, email=? WHERE id=?',
    [nome, cref, especialidade, telefone, email, req.params.id]
  );
  res.json(await qOne('SELECT * FROM professores WHERE id=?', [req.params.id]));
}));

app.delete('/api/professores/:id', adminOnly, wrap(async (req, res) => {
  await qRun('DELETE FROM professores WHERE id=?', [req.params.id]);
  res.status(204).send();
}));

// ─── PLANOS ──────────────────────────────────────────────────────────────────
app.get('/api/planos', wrap(async (_req, res) => {
  res.json(await q(
    'SELECT id, nome, valor, duracao_meses AS duracaoMeses, descricao FROM planos ORDER BY valor'
  ));
}));

app.post('/api/planos', adminOnly, wrap(async (req, res) => {
  const { nome, valor, duracaoMeses, descricao } = req.body;
  const r = await qRun(
    'INSERT INTO planos (nome, valor, duracao_meses, descricao) VALUES (?,?,?,?)',
    [nome, parseFloat(valor), parseInt(duracaoMeses), descricao]
  );
  res.status(201).json(await qOne(
    'SELECT id, nome, valor, duracao_meses AS duracaoMeses, descricao FROM planos WHERE id=?',
    [r.insertId]
  ));
}));

app.put('/api/planos/:id', adminOnly, wrap(async (req, res) => {
  const { nome, valor, duracaoMeses, descricao } = req.body;
  await qRun(
    'UPDATE planos SET nome=?, valor=?, duracao_meses=?, descricao=? WHERE id=?',
    [nome, parseFloat(valor), parseInt(duracaoMeses), descricao, req.params.id]
  );
  res.json(await qOne(
    'SELECT id, nome, valor, duracao_meses AS duracaoMeses, descricao FROM planos WHERE id=?',
    [req.params.id]
  ));
}));

app.delete('/api/planos/:id', adminOnly, wrap(async (req, res) => {
  await qRun('DELETE FROM planos WHERE id=?', [req.params.id]);
  res.status(204).send();
}));

// ─── PAGAMENTOS ──────────────────────────────────────────────────────────────
app.get('/api/pagamentos', wrap(async (req, res) => {
  const { alunoId } = req.query;
  const where = alunoId ? 'WHERE p.aluno_id=?' : '';
  const params = alunoId ? [alunoId] : [];
  res.json(await q(
    `SELECT ${PAG_COLS}, a.nome AS alunoNome
     FROM pagamentos p LEFT JOIN alunos a ON a.id = p.aluno_id
     ${where}
     ORDER BY p.data_pagamento DESC`,
    params
  ));
}));

app.post('/api/pagamentos', adminOnly, wrap(async (req, res) => {
  requireFields(req.body, ['alunoId', 'valor', 'dataPagamento', 'referenciaMensal']);
  const { alunoId, valor, dataPagamento, dataVencimento, referenciaMensal, metodoPagamento, observacoes } = req.body;
  const r = await qRun(
    `INSERT INTO pagamentos (aluno_id, data_pagamento, data_vencimento, valor, status, referencia_mensal, metodo_pagamento, observacoes)
     VALUES (?,?,?,?,'Pago',?,?,?)`,
    [parseInt(alunoId), dataPagamento, dataVencimento || dataPagamento,
     parseFloat(valor), referenciaMensal, metodoPagamento || 'Dinheiro', observacoes || '']
  ).catch(e => {
    if (e.code === 'ER_DUP_ENTRY') throw new BadRequest('Pagamento já registrado para este aluno neste mês');
    throw e;
  });
  res.status(201).json(await qOne(`SELECT ${PAG_COLS} FROM pagamentos p WHERE p.id=?`, [r.insertId]));
}));

app.delete('/api/pagamentos/:id', adminOnly, wrap(async (req, res) => {
  await qRun('DELETE FROM pagamentos WHERE id=?', [req.params.id]);
  res.status(204).send();
}));

app.get('/api/inadimplentes', adminOnly, wrap(async (_req, res) => {
  const ym = currentYearMonth();
  const rows = await q(
    `SELECT a.id, a.nome, a.cpf, a.telefone,
            a.data_nascimento AS dataNascimento, a.status,
            a.plano_id AS planoId, a.data_inicio_plano AS dataInicioPlano,
            a.observacoes, pl.nome AS planoNome
     FROM alunos a
     LEFT JOIN planos pl ON pl.id = a.plano_id
     WHERE a.status='Ativo'
       AND NOT EXISTS (
         SELECT 1 FROM pagamentos p
         WHERE p.aluno_id = a.id AND p.referencia_mensal = ? AND p.status='Pago'
       )
     ORDER BY a.nome`,
    [ym]
  );
  res.json(rows);
}));

// ─── TREINOS ─────────────────────────────────────────────────────────────────
app.get('/api/treinos', wrap(async (req, res) => {
  const { alunoId } = req.query;
  const where = alunoId ? 'WHERE t.aluno_id=?' : '';
  const params = alunoId ? [alunoId] : [];
  const treinos = await q(
    `SELECT ${TREINO_COLS}, a.nome AS alunoNome, p.nome AS professorNome
     FROM treinos t
     LEFT JOIN alunos a ON a.id = t.aluno_id
     LEFT JOIN professores p ON p.id = t.professor_id
     ${where}
     ORDER BY t.data_inicio DESC`,
    params
  );
  for (const t of treinos) t.exercicios = await loadExercicios(t.id);
  res.json(treinos);
}));

app.post('/api/treinos', adminOrProf, wrap(async (req, res) => {
  const { alunoId, professorId, objetivo, dataInicio, dataFim, observacoes, exercicios, nivel } = req.body;
  const r = await qRun(
    `INSERT INTO treinos (aluno_id, professor_id, objetivo, data_inicio, data_fim, observacoes, nivel)
     VALUES (?,?,?,?,?,?,?)`,
    [parseInt(alunoId), parseInt(professorId), objetivo, dataInicio,
     dataFim || null, observacoes || null, nivel || 'Iniciante']
  );
  await replaceExercicios(r.insertId, exercicios);
  const t = await qOne(`SELECT ${TREINO_COLS} FROM treinos t WHERE t.id=?`, [r.insertId]);
  t.exercicios = await loadExercicios(t.id);
  res.status(201).json(t);
}));

app.put('/api/treinos/:id', adminOrProf, wrap(async (req, res) => {
  const { objetivo, dataInicio, dataFim, observacoes, exercicios, nivel } = req.body;
  await qRun(
    `UPDATE treinos SET objetivo=?, data_inicio=?, data_fim=?, observacoes=?, nivel=? WHERE id=?`,
    [objetivo, dataInicio, dataFim || null, observacoes || null,
     nivel || 'Iniciante', req.params.id]
  );
  await replaceExercicios(parseInt(req.params.id), exercicios);
  const t = await qOne(`SELECT ${TREINO_COLS} FROM treinos t WHERE t.id=?`, [req.params.id]);
  t.exercicios = await loadExercicios(t.id);
  res.json(t);
}));

app.delete('/api/treinos/:id', adminOrProf, wrap(async (req, res) => {
  await qRun('DELETE FROM treinos WHERE id=?', [req.params.id]);
  res.status(204).send();
}));

// ─── FREQUÊNCIA ──────────────────────────────────────────────────────────────
app.get('/api/frequencia', wrap(async (req, res) => {
  const { alunoId } = req.query;
  const where = alunoId ? 'WHERE f.aluno_id=?' : '';
  const params = alunoId ? [alunoId] : [];
  res.json(await q(
    `SELECT ${FREQ_COLS}, a.nome AS alunoNome
     FROM frequencias f LEFT JOIN alunos a ON a.id = f.aluno_id
     ${where}
     ORDER BY f.data_entrada DESC, f.horario_entrada DESC`,
    params
  ));
}));

app.post('/api/frequencia', adminOnly, wrap(async (req, res) => {
  const { alunoId, dataEntrada, horarioEntrada, horarioSaida } = req.body;
  const r = await qRun(
    `INSERT INTO frequencias (aluno_id, data_entrada, horario_entrada, horario_saida)
     VALUES (?,?,?,?)`,
    [parseInt(alunoId), dataEntrada, horarioEntrada, horarioSaida || null]
  );
  res.status(201).json(await qOne(`SELECT ${FREQ_COLS} FROM frequencias f WHERE f.id=?`, [r.insertId]));
}));

app.delete('/api/frequencia/:id', adminOnly, wrap(async (req, res) => {
  await qRun('DELETE FROM frequencias WHERE id=?', [req.params.id]);
  res.status(204).send();
}));

// ─── SITUAÇÃO ALUNO ──────────────────────────────────────────────────────────
app.get('/api/alunos/:id/situacao-pagamento', wrap(async (req, res) => {
  const aluno = await qOne('SELECT id FROM alunos WHERE id=?', [req.params.id]);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const inadimplente = await isInadimplente(req.params.id);
  const historico = await q(
    `SELECT ${PAG_COLS} FROM pagamentos p WHERE p.aluno_id=? ORDER BY p.data_pagamento DESC`,
    [req.params.id]
  );
  res.json({ alunoId: req.params.id, status: inadimplente ? 'Inadimplente' : 'Em dia', historico });
}));

app.get('/api/alunos/:id/plano-atual', wrap(async (req, res) => {
  const aluno = await qOne(
    'SELECT plano_id AS planoId, data_inicio_plano AS dataInicioPlano FROM alunos WHERE id=?',
    [req.params.id]
  );
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const plano = aluno.planoId
    ? await qOne(
        'SELECT id, nome, valor, duracao_meses AS duracaoMeses, descricao FROM planos WHERE id=?',
        [aluno.planoId]
      )
    : null;
  res.json({ plano, dataInicio: aluno.dataInicioPlano });
}));

// ─── RELATÓRIOS ──────────────────────────────────────────────────────────────
app.get('/api/relatorios/dashboard', adminOnly, wrap(async (_req, res) => {
  const ym = currentYearMonth();
  const totalAlunos = (await qOne('SELECT COUNT(*) AS c FROM alunos')).c;
  const ativos = (await qOne(`SELECT COUNT(*) AS c FROM alunos WHERE status='Ativo'`)).c;
  const receitaMes = (await qOne(
    `SELECT COALESCE(SUM(valor),0) AS t FROM pagamentos WHERE referencia_mensal=? AND status='Pago'`,
    [ym]
  )).t;
  const receitaTotal = (await qOne(
    `SELECT COALESCE(SUM(valor),0) AS t FROM pagamentos WHERE status='Pago'`
  )).t;
  const pagamentosMes = (await qOne(
    `SELECT COUNT(*) AS c FROM pagamentos WHERE referencia_mensal=?`, [ym]
  )).c;
  const pagos = (await q(
    `SELECT DISTINCT aluno_id FROM pagamentos WHERE referencia_mensal=? AND status='Pago'`, [ym]
  )).length;
  const inad = Math.max(ativos - pagos, 0);
  const checkins = (await qOne(
    `SELECT COUNT(*) AS c FROM frequencias WHERE data_entrada >= CURDATE() - INTERVAL 30 DAY`
  )).c;
  res.json({
    totalAlunos, ativos, inativos: totalAlunos - ativos,
    receitaMes: Number(receitaMes), receitaTotal: Number(receitaTotal),
    pagamentosMes, inadimplentes: inad, checkins,
  });
}));

app.get('/api/relatorios/receita-mensal', adminOnly, wrap(async (_req, res) => {
  const rows = await q(
    `SELECT referencia_mensal AS mes, SUM(valor) AS total, COUNT(*) AS qtd
     FROM pagamentos WHERE status='Pago'
     GROUP BY referencia_mensal ORDER BY referencia_mensal DESC LIMIT 12`
  );
  res.json(rows.reverse());
}));

// ─── BACKUP / RESTORE ───────────────────────────────────────────────────────
app.get('/api/backup', adminOnly, wrap(async (_req, res) => {
  const [alunos, professores, planos, pagamentos, frequencias, treinosRaw] = await Promise.all([
    q(`SELECT ${ALUNO_COLS} FROM alunos a`),
    q('SELECT * FROM professores'),
    q('SELECT id, nome, valor, duracao_meses AS duracaoMeses, descricao FROM planos'),
    q(`SELECT ${PAG_COLS} FROM pagamentos p`),
    q(`SELECT ${FREQ_COLS} FROM frequencias f`),
    q(`SELECT ${TREINO_COLS} FROM treinos t`),
  ]);
  const treinos = [];
  for (const t of treinosRaw) treinos.push({ ...t, exercicios: await loadExercicios(t.id) });
  res.setHeader('Content-Disposition',
    `attachment; filename=gymcontrol-backup-${todayISO()}.json`);
  res.json({
    version: '2.0',
    exportedAt: new Date().toISOString(),
    alunos, professores, planos, pagamentos, treinos, frequencias,
  });
}));

app.post('/api/restore', adminOnly, wrap(async (req, res) => {
  const { alunos = [], professores = [], planos = [], pagamentos = [], treinos = [], frequencias = [] } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    for (const t of ['frequencias', 'exercicios', 'treinos', 'pagamentos', 'alunos', 'professores', 'planos']) {
      await conn.query(`DELETE FROM ${t}`);
    }
    for (const p of planos)
      await conn.query('INSERT INTO planos (id, nome, valor, duracao_meses, descricao) VALUES (?,?,?,?,?)',
        [p.id, p.nome, p.valor, p.duracaoMeses, p.descricao]);
    for (const p of professores)
      await conn.query('INSERT INTO professores (id, nome, cref, especialidade, telefone, email) VALUES (?,?,?,?,?,?)',
        [p.id, p.nome, p.cref, p.especialidade, p.telefone, p.email]);
    for (const a of alunos)
      await conn.query(
        `INSERT INTO alunos (id, nome, cpf, telefone, data_nascimento, status, plano_id, data_inicio_plano, observacoes)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [a.id, a.nome, a.cpf, a.telefone, a.dataNascimento, a.status, a.planoId, a.dataInicioPlano, a.observacoes]);
    for (const p of pagamentos)
      await conn.query(
        `INSERT INTO pagamentos (id, aluno_id, data_pagamento, data_vencimento, valor, status, referencia_mensal, metodo_pagamento, observacoes)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [p.id, p.alunoId, p.dataPagamento, p.dataVencimento || p.dataPagamento,
         p.valor, p.status, p.referenciaMensal, p.metodoPagamento, p.observacoes]);
    for (const t of treinos) {
      await conn.query(
        `INSERT INTO treinos (id, aluno_id, professor_id, objetivo, data_inicio, data_fim, nivel, observacoes)
         VALUES (?,?,?,?,?,?,?,?)`,
        [t.id, t.alunoId, t.professorId, t.objetivo, t.dataInicio, t.dataFim, t.nivel || 'Iniciante', t.observacoes]);
      let i = 1;
      for (const e of (t.exercicios || []))
        await conn.query(
          `INSERT INTO exercicios (treino_id, nome, grupo_muscular, series, repeticoes, descanso_seg, ordem)
           VALUES (?,?,?,?,?,?,?)`,
          [t.id, e.nome, e.grupoMuscular, e.series, String(e.repeticoes ?? ''),
           e.descanso != null ? Number(e.descanso) : null, i++]);
    }
    for (const f of frequencias)
      await conn.query(
        `INSERT INTO frequencias (id, aluno_id, data_entrada, horario_entrada, horario_saida) VALUES (?,?,?,?,?)`,
        [f.id, f.alunoId, f.dataEntrada, f.horarioEntrada, f.horarioSaida]);
    await conn.query('SET FOREIGN_KEY_CHECKS=1');
    await conn.commit();
    res.json({ success: true, message: 'Banco restaurado.' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: 'Erro ao restaurar: ' + e.message });
  } finally {
    conn.release();
  }
}));

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get('/api/health', wrap(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

// ─── START ───────────────────────────────────────────────────────────────────
module.exports = { app, pool };

if (require.main === module) {
  pool.query('SELECT 1')
    .then(() => app.listen(PORT, () => {
      console.log(`\n🏋️  GymControl running at http://localhost:${PORT}\n`);
    }))
    .catch(err => {
      console.error('Failed to connect to MySQL:', err.message);
      process.exit(1);
    });
}
