const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'gymcontrol.db');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

let db;

// ─── DB INIT ─────────────────────────────────────────────────────────────────
async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS alunos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT,
    telefone TEXT,
    dataNascimento TEXT,
    status TEXT DEFAULT 'Ativo',
    planoId INTEGER,
    dataInicioPlano TEXT,
    observacoes TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS professores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cref TEXT,
    especialidade TEXT,
    telefone TEXT,
    email TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS planos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    valor REAL,
    duracaoMeses INTEGER,
    descricao TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pagamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alunoId INTEGER,
    dataPagamento TEXT,
    valor REAL,
    status TEXT DEFAULT 'Pago',
    referenciaMensal TEXT,
    metodoPagamento TEXT DEFAULT 'Dinheiro',
    observacoes TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS treinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alunoId INTEGER,
    professorId INTEGER,
    objetivo TEXT,
    dataInicio TEXT,
    dataFim TEXT,
    observacoes TEXT,
    exercicios TEXT DEFAULT '[]',
    nivel TEXT DEFAULT 'Iniciante'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS frequencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alunoId INTEGER,
    dataEntrada TEXT,
    horarioEntrada TEXT,
    horarioSaida TEXT
  )`);

  // Seed data if empty
  const count = db.exec("SELECT COUNT(*) as c FROM planos")[0];
  if (count && count.values[0][0] === 0) {
    seedData();
  }

  persistDB();
}

function seedData() {
  db.run(`INSERT INTO planos (nome, valor, duracaoMeses, descricao) VALUES
    ('Basic', 99.90, 1, 'Acesso à musculação'),
    ('Premium', 149.90, 1, 'Musculação + aulas coletivas'),
    ('Anual', 999.00, 12, 'Plano anual com desconto')`);

  db.run(`INSERT INTO professores (nome, cref, especialidade, telefone, email) VALUES
    ('Prof. Ana Costa', '12345-G/SP', 'Musculação', '(11) 91234-5678', 'ana@gym.com'),
    ('Prof. Roberto Lima', '67890-G/SP', 'Funcional', '(11) 98765-4321', 'roberto@gym.com')`);

  db.run(`INSERT INTO alunos (nome, cpf, telefone, dataNascimento, status, planoId, dataInicioPlano) VALUES
    ('João Silva', '111.111.111-11', '(11) 91111-1111', '1990-01-01', 'Ativo', 1, '2026-01-01'),
    ('Maria Oliveira', '222.222.222-22', '(11) 92222-2222', '1985-05-10', 'Ativo', 2, '2026-02-01'),
    ('Carlos Souza', '333.333.333-33', '(11) 93333-3333', '1995-12-15', 'Inativo', 1, '2025-12-01')`);

  db.run(`INSERT INTO pagamentos (alunoId, dataPagamento, valor, status, referenciaMensal) VALUES
    (1, '2026-04-01', 99.90, 'Pago', '2026-04'),
    (2, '2026-04-05', 149.90, 'Pago', '2026-04'),
    (1, '2026-05-01', 99.90, 'Pago', '2026-05')`);

  db.run(`INSERT INTO treinos (alunoId, professorId, objetivo, dataInicio, dataFim, observacoes, exercicios) VALUES
    (1, 1, 'Hipertrofia', '2026-04-01', '2026-06-30', 'Treino A - Peito e Tríceps',
     '[{"nome":"Supino Reto","grupoMuscular":"Peito","series":4,"repeticoes":12,"descanso":60},
       {"nome":"Tríceps Pulley","grupoMuscular":"Tríceps","series":3,"repeticoes":15,"descanso":45}]')`);

  persistDB();
}

function persistDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getAllRows(sql, params = []) {
  try {
    const result = db.exec(sql, params);
    if (!result.length) return [];
    const { columns, values } = result[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  } catch (e) { return []; }
}

function getOneRow(sql, params = []) {
  const rows = getAllRows(sql, params);
  return rows[0] || null;
}

function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function isInadimplente(alunoId) {
  const ym = getCurrentYearMonth();
  const row = getOneRow(
    `SELECT id FROM pagamentos WHERE alunoId=? AND referenciaMensal=? AND status='Pago' LIMIT 1`,
    [alunoId, ym]
  );
  return !row;
}

// ─── ALUNOS ───────────────────────────────────────────────────────────────────
app.get('/api/alunos', (req, res) => {
  const alunos = getAllRows('SELECT * FROM alunos ORDER BY nome');
  const planos = getAllRows('SELECT * FROM planos');
  const result = alunos.map(a => {
    const plano = planos.find(p => p.id === a.planoId);
    return { ...a, planoNome: plano?.nome || null, inadimplente: isInadimplente(a.id) };
  });
  res.json(result);
});

app.get('/api/alunos/:id', (req, res) => {
  const aluno = getOneRow('SELECT * FROM alunos WHERE id=?', [req.params.id]);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const plano = getOneRow('SELECT * FROM planos WHERE id=?', [aluno.planoId]);
  res.json({ ...aluno, planoNome: plano?.nome || null, inadimplente: isInadimplente(aluno.id) });
});

app.post('/api/alunos', (req, res) => {
  const { nome, cpf, telefone, dataNascimento, planoId, observacoes } = req.body;
  db.run(
    `INSERT INTO alunos (nome, cpf, telefone, dataNascimento, status, planoId, dataInicioPlano, observacoes) VALUES (?,?,?,?,'Ativo',?,?,?)`,
    [nome, cpf, telefone, dataNascimento, parseInt(planoId), new Date().toISOString().split('T')[0], observacoes || '']
  );
  persistDB();
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  res.status(201).json(getOneRow('SELECT * FROM alunos WHERE id=?', [id]));
});

app.put('/api/alunos/:id', (req, res) => {
  const { nome, cpf, telefone, dataNascimento, status, planoId, observacoes } = req.body;
  db.run(
    `UPDATE alunos SET nome=?, cpf=?, telefone=?, dataNascimento=?, status=?, planoId=?, observacoes=? WHERE id=?`,
    [nome, cpf, telefone, dataNascimento, status, parseInt(planoId), observacoes || '', req.params.id]
  );
  persistDB();
  res.json(getOneRow('SELECT * FROM alunos WHERE id=?', [req.params.id]));
});

app.delete('/api/alunos/:id', (req, res) => {
  db.run('DELETE FROM alunos WHERE id=?', [req.params.id]);
  persistDB();
  res.status(204).send();
});

// ─── PROFESSORES ─────────────────────────────────────────────────────────────
app.get('/api/professores', (req, res) => {
  res.json(getAllRows('SELECT * FROM professores ORDER BY nome'));
});

app.post('/api/professores', (req, res) => {
  const { nome, cref, especialidade, telefone, email } = req.body;
  db.run('INSERT INTO professores (nome, cref, especialidade, telefone, email) VALUES (?,?,?,?,?)',
    [nome, cref, especialidade, telefone, email]);
  persistDB();
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  res.status(201).json(getOneRow('SELECT * FROM professores WHERE id=?', [id]));
});

app.put('/api/professores/:id', (req, res) => {
  const { nome, cref, especialidade, telefone, email } = req.body;
  db.run('UPDATE professores SET nome=?, cref=?, especialidade=?, telefone=?, email=? WHERE id=?',
    [nome, cref, especialidade, telefone, email, req.params.id]);
  persistDB();
  res.json(getOneRow('SELECT * FROM professores WHERE id=?', [req.params.id]));
});

app.delete('/api/professores/:id', (req, res) => {
  db.run('DELETE FROM professores WHERE id=?', [req.params.id]);
  persistDB();
  res.status(204).send();
});

// ─── PLANOS ───────────────────────────────────────────────────────────────────
app.get('/api/planos', (req, res) => {
  res.json(getAllRows('SELECT * FROM planos ORDER BY valor'));
});

app.post('/api/planos', (req, res) => {
  const { nome, valor, duracaoMeses, descricao } = req.body;
  db.run('INSERT INTO planos (nome, valor, duracaoMeses, descricao) VALUES (?,?,?,?)',
    [nome, parseFloat(valor), parseInt(duracaoMeses), descricao]);
  persistDB();
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  res.status(201).json(getOneRow('SELECT * FROM planos WHERE id=?', [id]));
});

app.put('/api/planos/:id', (req, res) => {
  const { nome, valor, duracaoMeses, descricao } = req.body;
  db.run('UPDATE planos SET nome=?, valor=?, duracaoMeses=?, descricao=? WHERE id=?',
    [nome, parseFloat(valor), parseInt(duracaoMeses), descricao, req.params.id]);
  persistDB();
  res.json(getOneRow('SELECT * FROM planos WHERE id=?', [req.params.id]));
});

app.delete('/api/planos/:id', (req, res) => {
  db.run('DELETE FROM planos WHERE id=?', [req.params.id]);
  persistDB();
  res.status(204).send();
});

// ─── PAGAMENTOS ───────────────────────────────────────────────────────────────
app.get('/api/pagamentos', (req, res) => {
  const { alunoId } = req.query;
  if (alunoId) {
    res.json(getAllRows('SELECT p.*, a.nome as alunoNome FROM pagamentos p LEFT JOIN alunos a ON a.id=p.alunoId WHERE p.alunoId=? ORDER BY p.dataPagamento DESC', [alunoId]));
  } else {
    res.json(getAllRows('SELECT p.*, a.nome as alunoNome FROM pagamentos p LEFT JOIN alunos a ON a.id=p.alunoId ORDER BY p.dataPagamento DESC'));
  }
});

app.post('/api/pagamentos', (req, res) => {
  const { alunoId, valor, dataPagamento, referenciaMensal, metodoPagamento, observacoes } = req.body;
  db.run('INSERT INTO pagamentos (alunoId, dataPagamento, valor, status, referenciaMensal, metodoPagamento, observacoes) VALUES (?,?,?,?,?,?,?)',
    [parseInt(alunoId), dataPagamento, parseFloat(valor), 'Pago', referenciaMensal, metodoPagamento || 'Dinheiro', observacoes || '']);
  persistDB();
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  res.status(201).json(getOneRow('SELECT * FROM pagamentos WHERE id=?', [id]));
});

app.delete('/api/pagamentos/:id', (req, res) => {
  db.run('DELETE FROM pagamentos WHERE id=?', [req.params.id]);
  persistDB();
  res.status(204).send();
});

app.get('/api/inadimplentes', (req, res) => {
  const ym = getCurrentYearMonth();
  const alunos = getAllRows("SELECT * FROM alunos WHERE status='Ativo'");
  const planos = getAllRows('SELECT * FROM planos');
  const pagosIds = getAllRows(
    `SELECT DISTINCT alunoId FROM pagamentos WHERE referenciaMensal=? AND status='Pago'`, [ym]
  ).map(r => r.alunoId);
  const result = alunos
    .filter(a => !pagosIds.includes(a.id))
    .map(a => ({ ...a, planoNome: planos.find(p => p.id === a.planoId)?.nome || null }));
  res.json(result);
});

// ─── TREINOS ─────────────────────────────────────────────────────────────────
app.get('/api/treinos', (req, res) => {
  const { alunoId } = req.query;
  let treinos;
  if (alunoId) {
    treinos = getAllRows(`
      SELECT t.*, a.nome as alunoNome, p.nome as professorNome
      FROM treinos t
      LEFT JOIN alunos a ON a.id = t.alunoId
      LEFT JOIN professores p ON p.id = t.professorId
      WHERE t.alunoId=? ORDER BY t.dataInicio DESC`, [alunoId]);
  } else {
    treinos = getAllRows(`
      SELECT t.*, a.nome as alunoNome, p.nome as professorNome
      FROM treinos t
      LEFT JOIN alunos a ON a.id = t.alunoId
      LEFT JOIN professores p ON p.id = t.professorId
      ORDER BY t.dataInicio DESC`);
  }
  treinos = treinos.map(t => ({ ...t, exercicios: JSON.parse(t.exercicios || '[]') }));
  res.json(treinos);
});

app.post('/api/treinos', (req, res) => {
  const { alunoId, professorId, objetivo, dataInicio, dataFim, observacoes, exercicios, nivel } = req.body;
  db.run('INSERT INTO treinos (alunoId, professorId, objetivo, dataInicio, dataFim, observacoes, exercicios, nivel) VALUES (?,?,?,?,?,?,?,?)',
    [parseInt(alunoId), parseInt(professorId), objetivo, dataInicio, dataFim, observacoes,
     JSON.stringify(exercicios || []), nivel || 'Iniciante']);
  persistDB();
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  const t = getOneRow('SELECT * FROM treinos WHERE id=?', [id]);
  res.status(201).json({ ...t, exercicios: JSON.parse(t.exercicios || '[]') });
});

app.put('/api/treinos/:id', (req, res) => {
  const { objetivo, dataInicio, dataFim, observacoes, exercicios, nivel } = req.body;
  db.run('UPDATE treinos SET objetivo=?, dataInicio=?, dataFim=?, observacoes=?, exercicios=?, nivel=? WHERE id=?',
    [objetivo, dataInicio, dataFim, observacoes, JSON.stringify(exercicios || []), nivel || 'Iniciante', req.params.id]);
  persistDB();
  const t = getOneRow('SELECT * FROM treinos WHERE id=?', [req.params.id]);
  res.json({ ...t, exercicios: JSON.parse(t.exercicios || '[]') });
});

app.delete('/api/treinos/:id', (req, res) => {
  db.run('DELETE FROM treinos WHERE id=?', [req.params.id]);
  persistDB();
  res.status(204).send();
});

// ─── FREQUÊNCIA ───────────────────────────────────────────────────────────────
app.get('/api/frequencia', (req, res) => {
  const { alunoId } = req.query;
  if (alunoId) {
    res.json(getAllRows('SELECT f.*, a.nome as alunoNome FROM frequencias f LEFT JOIN alunos a ON a.id=f.alunoId WHERE f.alunoId=? ORDER BY f.dataEntrada DESC', [alunoId]));
  } else {
    res.json(getAllRows('SELECT f.*, a.nome as alunoNome FROM frequencias f LEFT JOIN alunos a ON a.id=f.alunoId ORDER BY f.dataEntrada DESC, f.horarioEntrada DESC'));
  }
});

app.post('/api/frequencia', (req, res) => {
  const { alunoId, dataEntrada, horarioEntrada, horarioSaida } = req.body;
  db.run('INSERT INTO frequencias (alunoId, dataEntrada, horarioEntrada, horarioSaida) VALUES (?,?,?,?)',
    [parseInt(alunoId), dataEntrada, horarioEntrada, horarioSaida || null]);
  persistDB();
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  res.status(201).json(getOneRow('SELECT * FROM frequencias WHERE id=?', [id]));
});

app.delete('/api/frequencia/:id', (req, res) => {
  db.run('DELETE FROM frequencias WHERE id=?', [req.params.id]);
  persistDB();
  res.status(204).send();
});

// ─── SITUAÇÃO ALUNO ───────────────────────────────────────────────────────────
app.get('/api/alunos/:id/situacao-pagamento', (req, res) => {
  const id = req.params.id;
  const aluno = getOneRow('SELECT * FROM alunos WHERE id=?', [id]);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const inadimplente = isInadimplente(id);
  const historico = getAllRows('SELECT * FROM pagamentos WHERE alunoId=? ORDER BY dataPagamento DESC', [id]);
  res.json({ alunoId: id, status: inadimplente ? 'Inadimplente' : 'Em dia', historico });
});

app.get('/api/alunos/:id/plano-atual', (req, res) => {
  const id = req.params.id;
  const aluno = getOneRow('SELECT * FROM alunos WHERE id=?', [id]);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const plano = getOneRow('SELECT * FROM planos WHERE id=?', [aluno.planoId]);
  res.json({ plano: plano || null, dataInicio: aluno.dataInicioPlano });
});

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
app.get('/api/relatorios/dashboard', (req, res) => {
  const ym = getCurrentYearMonth();
  const totalAlunos = getOneRow('SELECT COUNT(*) as c FROM alunos').c;
  const ativos = getOneRow("SELECT COUNT(*) as c FROM alunos WHERE status='Ativo'").c;
  const receitaMes = getOneRow(`SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE referenciaMensal=? AND status='Pago'`, [ym]).t;
  const receitaTotal = getOneRow("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status='Pago'").t;
  const pagamentosMes = getOneRow(`SELECT COUNT(*) as c FROM pagamentos WHERE referenciaMensal=?`, [ym]).c;
  const inadimplentes = (getOneRow("SELECT COUNT(*) as c FROM alunos WHERE status='Ativo'").c || 0);
  const pagosIds = getAllRows(`SELECT DISTINCT alunoId FROM pagamentos WHERE referenciaMensal=? AND status='Pago'`, [ym]).length;
  const inadTotal = ativos - pagosIds;
  const checkins = getOneRow(`SELECT COUNT(*) as c FROM frequencias WHERE dataEntrada >= date('now','-30 days')`).c;
  res.json({ totalAlunos, ativos, inativos: totalAlunos - ativos, receitaMes, receitaTotal, pagamentosMes, inadimplentes: inadTotal < 0 ? 0 : inadTotal, checkins });
});

app.get('/api/relatorios/receita-mensal', (req, res) => {
  const rows = getAllRows(`
    SELECT referenciaMensal as mes, SUM(valor) as total, COUNT(*) as qtd
    FROM pagamentos WHERE status='Pago'
    GROUP BY referenciaMensal ORDER BY referenciaMensal DESC LIMIT 12`);
  res.json(rows.reverse());
});

// ─── BACKUP / RESTORE ─────────────────────────────────────────────────────────
app.get('/api/backup', (req, res) => {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    alunos: getAllRows('SELECT * FROM alunos'),
    professores: getAllRows('SELECT * FROM professores'),
    planos: getAllRows('SELECT * FROM planos'),
    pagamentos: getAllRows('SELECT * FROM pagamentos'),
    treinos: getAllRows('SELECT * FROM treinos').map(t => ({ ...t, exercicios: JSON.parse(t.exercicios || '[]') })),
    frequencias: getAllRows('SELECT * FROM frequencias')
  };
  res.setHeader('Content-Disposition', `attachment; filename=gymcontrol-backup-${new Date().toISOString().split('T')[0]}.json`);
  res.json(backup);
});

app.post('/api/restore', (req, res) => {
  const { alunos, professores, planos, pagamentos, treinos, frequencias } = req.body;
  try {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM frequencias');
    db.run('DELETE FROM treinos');
    db.run('DELETE FROM pagamentos');
    db.run('DELETE FROM alunos');
    db.run('DELETE FROM professores');
    db.run('DELETE FROM planos');

    for (const p of (planos || [])) {
      db.run('INSERT INTO planos (id, nome, valor, duracaoMeses, descricao) VALUES (?,?,?,?,?)',
        [p.id, p.nome, p.valor, p.duracaoMeses, p.descricao]);
    }
    for (const p of (professores || [])) {
      db.run('INSERT INTO professores (id, nome, cref, especialidade, telefone, email) VALUES (?,?,?,?,?,?)',
        [p.id, p.nome, p.cref, p.especialidade, p.telefone, p.email]);
    }
    for (const a of (alunos || [])) {
      db.run('INSERT INTO alunos (id, nome, cpf, telefone, dataNascimento, status, planoId, dataInicioPlano, observacoes) VALUES (?,?,?,?,?,?,?,?,?)',
        [a.id, a.nome, a.cpf, a.telefone, a.dataNascimento, a.status, a.planoId, a.dataInicioPlano, a.observacoes]);
    }
    for (const p of (pagamentos || [])) {
      db.run('INSERT INTO pagamentos (id, alunoId, dataPagamento, valor, status, referenciaMensal, metodoPagamento, observacoes) VALUES (?,?,?,?,?,?,?,?)',
        [p.id, p.alunoId, p.dataPagamento, p.valor, p.status, p.referenciaMensal, p.metodoPagamento, p.observacoes]);
    }
    for (const t of (treinos || [])) {
      db.run('INSERT INTO treinos (id, alunoId, professorId, objetivo, dataInicio, dataFim, observacoes, exercicios, nivel) VALUES (?,?,?,?,?,?,?,?,?)',
        [t.id, t.alunoId, t.professorId, t.objetivo, t.dataInicio, t.dataFim, t.observacoes,
         JSON.stringify(t.exercicios || []), t.nivel]);
    }
    for (const f of (frequencias || [])) {
      db.run('INSERT INTO frequencias (id, alunoId, dataEntrada, horarioEntrada, horarioSaida) VALUES (?,?,?,?,?)',
        [f.id, f.alunoId, f.dataEntrada, f.horarioEntrada, f.horarioSaida]);
    }

    db.run('COMMIT');
    persistDB();
    res.json({ success: true, message: 'Banco de dados restaurado com sucesso!' });
  } catch (e) {
    db.run('ROLLBACK');
    res.status(500).json({ error: 'Erro ao restaurar: ' + e.message });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🏋️  GymControl running at http://localhost:${PORT}\n`);
  });
}).catch(console.error);