const request = require('supertest');
const { app, pool } = require('../server');
const { resetDb, loginAs, ACCOUNTS } = require('./helpers');

let admin, professor, aluno;

beforeAll(async () => {
  await resetDb();
  admin     = await loginAs(app, ACCOUNTS.admin.email,     ACCOUNTS.admin.senha);
  professor = await loginAs(app, ACCOUNTS.professor.email, ACCOUNTS.professor.senha);
  aluno     = await loginAs(app, ACCOUNTS.aluno.email,     ACCOUNTS.aluno.senha);
});

afterAll(async () => { await pool.end(); });

describe('AUTH', () => {
  test('login com credenciais válidas devolve 200 e papel correto', () => {
    expect(admin.user.role).toBe('Admin');
    expect(professor.user.role).toBe('Professor');
    expect(aluno.user.role).toBe('Aluno');
  });

  test('login com senha errada → 401', async () => {
    const r = await request(app).post('/api/auth/login')
      .send({ email: 'admin@gym.com', senha: 'NOPE' });
    expect(r.status).toBe(401);
  });

  test('rota protegida sem cookie → 401', async () => {
    const r = await request(app).get('/api/alunos');
    expect(r.status).toBe(401);
  });

  test('/api/auth/me devolve usuário do cookie', async () => {
    const r = await request(app).get('/api/auth/me').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(r.body.role).toBe('Admin');
  });

  test('logout limpa o cookie', async () => {
    const session = await loginAs(app, ACCOUNTS.admin.email, ACCOUNTS.admin.senha);
    const r = await request(app).post('/api/auth/logout').set('Cookie', session.cookie);
    expect(r.status).toBe(200);
  });
});

describe('RBAC - QUADRO 3', () => {
  test('Aluno NÃO pode criar aluno (403)', async () => {
    const r = await request(app).post('/api/alunos').set('Cookie', aluno.cookie)
      .send({ nome: 'X', cpf: '529.982.247-25' });
    expect(r.status).toBe(403);
  });

  test('Aluno NÃO pode ver inadimplentes (403)', async () => {
    const r = await request(app).get('/api/inadimplentes').set('Cookie', aluno.cookie);
    expect(r.status).toBe(403);
  });

  test('Professor NÃO pode criar aluno (403)', async () => {
    const r = await request(app).post('/api/alunos').set('Cookie', professor.cookie)
      .send({ nome: 'X', cpf: '529.982.247-25' });
    expect(r.status).toBe(403);
  });

  test('Professor PODE criar treino (201)', async () => {
    const r = await request(app).post('/api/treinos').set('Cookie', professor.cookie)
      .send({ alunoId: 1, professorId: 1, objetivo: 'Teste', dataInicio: '2026-05-21', exercicios: [] });
    expect(r.status).toBe(201);
  });

  test('Admin PODE ler relatorios/dashboard', async () => {
    const r = await request(app).get('/api/relatorios/dashboard').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(typeof r.body.totalAlunos).toBe('number');
  });
});

describe('ALUNOS - validação e CRUD', () => {
  test('POST sem CPF → 400', async () => {
    const r = await request(app).post('/api/alunos').set('Cookie', admin.cookie)
      .send({ nome: 'Sem CPF' });
    expect(r.status).toBe(400);
  });

  test('POST com CPF inválido (dígito verificador) → 400', async () => {
    const r = await request(app).post('/api/alunos').set('Cookie', admin.cookie)
      .send({ nome: 'CPF Ruim', cpf: '111.111.111-11' });
    expect(r.status).toBe(400);
  });

  test('POST com CPF válido sem máscara é normalizado', async () => {
    const r = await request(app).post('/api/alunos').set('Cookie', admin.cookie)
      .send({ nome: 'Sem Mascara', cpf: '52998224725', planoId: 1 });
    expect(r.status).toBe(201);
    expect(r.body.cpf).toBe('529.982.247-25');
  });

  test('CPF duplicado → 400', async () => {
    const cpf = '390.533.447-05';
    await request(app).post('/api/alunos').set('Cookie', admin.cookie)
      .send({ nome: 'A', cpf });
    const r = await request(app).post('/api/alunos').set('Cookie', admin.cookie)
      .send({ nome: 'B', cpf });
    expect(r.status).toBe(400);
  });

  test('GET /api/alunos preserva acentuação (João)', async () => {
    const r = await request(app).get('/api/alunos').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(r.body.some(a => a.nome === 'João Silva')).toBe(true);
  });

  test('PUT atualiza aluno', async () => {
    const r = await request(app).put('/api/alunos/1').set('Cookie', admin.cookie)
      .send({ nome: 'João Editado', cpf: '111.111.111-11', status: 'Ativo', planoId: 1 });
    // CPF inválido → 400 (regra de validação)
    expect(r.status).toBe(400);
    const r2 = await request(app).put('/api/alunos/1').set('Cookie', admin.cookie)
      .send({ nome: 'João Editado', cpf: '100.456.789-87', status: 'Ativo', planoId: 1 });
    expect(r2.status).toBe(200);
    expect(r2.body.nome).toBe('João Editado');
  });
});

describe('PAGAMENTOS', () => {
  test('POST pagamento (admin) cria registro', async () => {
    const r = await request(app).post('/api/pagamentos').set('Cookie', admin.cookie)
      .send({ alunoId: 1, valor: 99.9, dataPagamento: '2026-06-01',
              referenciaMensal: '2026-06', metodoPagamento: 'Pix' });
    expect(r.status).toBe(201);
  });

  test('POST pagamento duplicado (mesmo mês/aluno) é rejeitado', async () => {
    const body = { alunoId: 1, valor: 99.9, dataPagamento: '2026-07-01',
                   referenciaMensal: '2026-07', metodoPagamento: 'Pix' };
    await request(app).post('/api/pagamentos').set('Cookie', admin.cookie).send(body);
    const r = await request(app).post('/api/pagamentos').set('Cookie', admin.cookie).send(body);
    expect(r.status).toBe(400);
  });

  test('GET com filtro alunoId só retorna pagamentos daquele aluno', async () => {
    const r = await request(app).get('/api/pagamentos?alunoId=1').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(r.body.every(p => p.alunoId === 1)).toBe(true);
  });
});

describe('BACKUP', () => {
  test('GET /api/backup retorna JSON com todas as entidades', async () => {
    const r = await request(app).get('/api/backup').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty('alunos');
    expect(r.body).toHaveProperty('treinos');
    expect(r.body).toHaveProperty('frequencias');
    expect(Array.isArray(r.body.alunos)).toBe(true);
  });

  test('Aluno não pode baixar backup', async () => {
    const r = await request(app).get('/api/backup').set('Cookie', aluno.cookie);
    expect(r.status).toBe(403);
  });
});

describe('TREINOS', () => {
  test('Treino criado vem com exercicios da tabela exercicios', async () => {
    const r = await request(app).get('/api/treinos').set('Cookie', professor.cookie);
    expect(r.status).toBe(200);
    const t = r.body.find(x => x.exercicios && x.exercicios.length > 0);
    expect(t).toBeDefined();
    expect(t.exercicios[0]).toHaveProperty('nome');
    expect(t.exercicios[0]).toHaveProperty('grupoMuscular');
  });
});
