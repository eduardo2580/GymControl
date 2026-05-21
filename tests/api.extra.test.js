import request from 'supertest';
import { app, pool } from '../server.js';
import { resetDb, loginAs, ACCOUNTS } from './helpers.js';

let admin, professor, aluno;

beforeAll(async () => {
  await resetDb();
  admin     = await loginAs(app, ACCOUNTS.admin.email,     ACCOUNTS.admin.senha);
  professor = await loginAs(app, ACCOUNTS.professor.email, ACCOUNTS.professor.senha);
  aluno     = await loginAs(app, ACCOUNTS.aluno.email,     ACCOUNTS.aluno.senha);
});

afterAll(async () => { await pool.end(); });

describe('PLANOS - CRUD completo', () => {
  let createdId;

  test('GET lista planos (qualquer autenticado)', async () => {
    const r = await request(app).get('/api/planos').set('Cookie', aluno.cookie);
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);
  });

  test('Aluno não cria plano (403)', async () => {
    const r = await request(app).post('/api/planos').set('Cookie', aluno.cookie)
      .send({ nome: 'X', valor: 50, duracaoMeses: 1 });
    expect(r.status).toBe(403);
  });

  test('Admin cria plano (201)', async () => {
    const r = await request(app).post('/api/planos').set('Cookie', admin.cookie)
      .send({ nome: 'Trimestral', valor: 250, duracaoMeses: 3, descricao: '3 meses' });
    expect(r.status).toBe(201);
    expect(r.body.nome).toBe('Trimestral');
    createdId = r.body.id;
  });

  test('Admin atualiza plano (200)', async () => {
    const r = await request(app).put(`/api/planos/${createdId}`).set('Cookie', admin.cookie)
      .send({ nome: 'Trimestral+', valor: 260, duracaoMeses: 3, descricao: 'atualizado' });
    expect(r.status).toBe(200);
    expect(r.body.nome).toBe('Trimestral+');
  });

  test('Admin deleta plano (204)', async () => {
    const r = await request(app).delete(`/api/planos/${createdId}`).set('Cookie', admin.cookie);
    expect(r.status).toBe(204);
  });
});

describe('PROFESSORES - PUT e DELETE', () => {
  let id;
  test('cria professor', async () => {
    const r = await request(app).post('/api/professores').set('Cookie', admin.cookie)
      .send({ nome: 'Prof Teste', cref: '99999-G/SP', especialidade: 'Crossfit' });
    expect(r.status).toBe(201);
    id = r.body.id;
  });
  test('atualiza professor', async () => {
    const r = await request(app).put(`/api/professores/${id}`).set('Cookie', admin.cookie)
      .send({ nome: 'Prof Atualizado', cref: '99999-G/SP', especialidade: 'Funcional' });
    expect(r.status).toBe(200);
    expect(r.body.nome).toBe('Prof Atualizado');
  });
  test('deleta professor', async () => {
    const r = await request(app).delete(`/api/professores/${id}`).set('Cookie', admin.cookie);
    expect(r.status).toBe(204);
  });
});

describe('TREINOS - update e delete', () => {
  let id;
  test('cria treino', async () => {
    const r = await request(app).post('/api/treinos').set('Cookie', professor.cookie)
      .send({
        alunoId: 1, professorId: 1, objetivo: 'Hipertrofia',
        dataInicio: '2026-06-01', nivel: 'Intermediario',
        exercicios: [
          { nome: 'Supino', grupoMuscular: 'Peito', series: 4, repeticoes: 10, descanso: 60 },
          { nome: 'Crucifixo', grupoMuscular: 'Peito', series: 3, repeticoes: 12, descanso: 45 },
        ],
      });
    expect(r.status).toBe(201);
    expect(r.body.exercicios.length).toBe(2);
    id = r.body.id;
  });
  test('atualiza treino substitui exercícios', async () => {
    const r = await request(app).put(`/api/treinos/${id}`).set('Cookie', professor.cookie)
      .send({
        objetivo: 'Resistência', dataInicio: '2026-06-01',
        exercicios: [{ nome: 'Agachamento', grupoMuscular: 'Pernas', series: 5, repeticoes: 5 }],
      });
    expect(r.status).toBe(200);
    expect(r.body.exercicios.length).toBe(1);
    expect(r.body.exercicios[0].nome).toBe('Agachamento');
  });
  test('aluno não deleta treino', async () => {
    const r = await request(app).delete(`/api/treinos/${id}`).set('Cookie', aluno.cookie);
    expect(r.status).toBe(403);
  });
  test('professor deleta treino', async () => {
    const r = await request(app).delete(`/api/treinos/${id}`).set('Cookie', professor.cookie);
    expect(r.status).toBe(204);
  });
});

describe('FREQUÊNCIA - POST e DELETE', () => {
  let id;
  test('admin cria registro de frequência', async () => {
    const r = await request(app).post('/api/frequencia').set('Cookie', admin.cookie)
      .send({ alunoId: 1, dataEntrada: '2026-05-20', horarioEntrada: '08:00:00', horarioSaida: '09:30:00' });
    expect(r.status).toBe(201);
    id = r.body.id;
  });
  test('professor não cria frequência (403)', async () => {
    const r = await request(app).post('/api/frequencia').set('Cookie', professor.cookie)
      .send({ alunoId: 1, dataEntrada: '2026-05-21', horarioEntrada: '08:00:00' });
    expect(r.status).toBe(403);
  });
  test('GET frequencia com filtro alunoId', async () => {
    const r = await request(app).get('/api/frequencia?alunoId=1').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(r.body.every(f => f.alunoId === 1)).toBe(true);
  });
  test('admin deleta frequência', async () => {
    const r = await request(app).delete(`/api/frequencia/${id}`).set('Cookie', admin.cookie);
    expect(r.status).toBe(204);
  });
});

describe('ALUNO - rotas de consulta', () => {
  test('GET /api/alunos/:id/situacao-pagamento', async () => {
    const r = await request(app).get('/api/alunos/1/situacao-pagamento').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(['Em dia', 'Inadimplente']).toContain(r.body.status);
    expect(Array.isArray(r.body.historico)).toBe(true);
  });
  test('GET /api/alunos/:id/plano-atual', async () => {
    const r = await request(app).get('/api/alunos/1/plano-atual').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(r.body.plano).toBeDefined();
  });
  test('404 em aluno inexistente', async () => {
    const r = await request(app).get('/api/alunos/9999/situacao-pagamento').set('Cookie', admin.cookie);
    expect(r.status).toBe(404);
    const r2 = await request(app).get('/api/alunos/9999/plano-atual').set('Cookie', admin.cookie);
    expect(r2.status).toBe(404);
    const r3 = await request(app).get('/api/alunos/9999').set('Cookie', admin.cookie);
    expect(r3.status).toBe(404);
  });
});

describe('RELATÓRIOS', () => {
  test('dashboard volta números coerentes', async () => {
    const r = await request(app).get('/api/relatorios/dashboard').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(r.body.totalAlunos).toBeGreaterThan(0);
    expect(r.body.ativos + r.body.inativos).toBe(r.body.totalAlunos);
    expect(r.body.receitaTotal).toBeGreaterThanOrEqual(r.body.receitaMes);
  });
  test('receita-mensal devolve lista por mês', async () => {
    const r = await request(app).get('/api/relatorios/receita-mensal').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });
  test('aluno não acessa receita-mensal (403)', async () => {
    const r = await request(app).get('/api/relatorios/receita-mensal').set('Cookie', aluno.cookie);
    expect(r.status).toBe(403);
  });
});

describe('BACKUP / RESTORE round trip', () => {
  test('admin baixa backup, depois restaura, dados sobrevivem', async () => {
    const b = await request(app).get('/api/backup').set('Cookie', admin.cookie);
    expect(b.status).toBe(200);
    const payload = b.body;
    const r = await request(app).post('/api/restore').set('Cookie', admin.cookie).send(payload);
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);

    const alunosAfter = await request(app).get('/api/alunos').set('Cookie', admin.cookie);
    expect(alunosAfter.body.length).toBe(payload.alunos.length);
  });
  test('aluno não pode restaurar (403)', async () => {
    const r = await request(app).post('/api/restore').set('Cookie', aluno.cookie).send({});
    expect(r.status).toBe(403);
  });
});

describe('VALIDAÇÃO de entrada', () => {
  test('POST aluno sem nome → 400', async () => {
    const r = await request(app).post('/api/alunos').set('Cookie', admin.cookie)
      .send({ cpf: '529.982.247-25' });
    expect(r.status).toBe(400);
  });
  test('POST pagamento sem alunoId → 400', async () => {
    const r = await request(app).post('/api/pagamentos').set('Cookie', admin.cookie)
      .send({ valor: 99, dataPagamento: '2026-08-01', referenciaMensal: '2026-08' });
    expect(r.status).toBe(400);
  });
  test('POST pagamento sem referenciaMensal → 400', async () => {
    const r = await request(app).post('/api/pagamentos').set('Cookie', admin.cookie)
      .send({ alunoId: 1, valor: 99, dataPagamento: '2026-09-01' });
    expect(r.status).toBe(400);
  });
});

describe('HEALTH', () => {
  test('/api/health responde 200 para usuários autenticados', async () => {
    const r = await request(app).get('/api/health').set('Cookie', admin.cookie);
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });
});
