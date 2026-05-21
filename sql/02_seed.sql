-- GymControl - Dados de exemplo para testes manuais
USE gymcontrol;

-- Planos
INSERT INTO planos (nome, valor, duracao_meses, descricao) VALUES
  ('Basic',   99.90,  1, 'Acesso à musculação'),
  ('Premium', 149.90, 1, 'Musculação + aulas coletivas'),
  ('Anual',   999.00, 12, 'Plano anual com desconto');

-- Professores
INSERT INTO professores (nome, cref, especialidade, telefone, email) VALUES
  ('Ana Costa',    '12345-G/SP', 'Musculação', '(11) 91234-5678', 'ana@gym.com'),
  ('Roberto Lima', '67890-G/SP', 'Funcional',  '(11) 98765-4321', 'roberto@gym.com');

-- Alunos
INSERT INTO alunos (nome, cpf, telefone, data_nascimento, status, plano_id, data_inicio_plano) VALUES
  ('João Silva',     '111.111.111-11', '(11) 91111-1111', '1990-01-01', 'Ativo',   1, '2026-01-01'),
  ('Maria Oliveira', '222.222.222-22', '(11) 92222-2222', '1985-05-10', 'Ativo',   2, '2026-02-01'),
  ('Carlos Souza',   '333.333.333-33', '(11) 93333-3333', '1995-12-15', 'Inativo', 1, '2025-12-01');

-- Usuarios (senha_hash é placeholder; integração de auth virá depois)
INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, aluno_id, professor_id) VALUES
  ('Administrador', 'admin@gym.com',   'PLACEHOLDER_HASH', 'Admin',     NULL, NULL),
  ('Ana Costa',     'ana@gym.com',     'PLACEHOLDER_HASH', 'Professor', NULL, 1),
  ('João Silva',    'joao@aluno.com',  'PLACEHOLDER_HASH', 'Aluno',     1,    NULL);

-- Pagamentos
INSERT INTO pagamentos (aluno_id, data_pagamento, data_vencimento, valor, status, referencia_mensal, metodo_pagamento) VALUES
  (1, '2026-04-01', '2026-04-05',  99.90, 'Pago',     '2026-04', 'Pix'),
  (2, '2026-04-05', '2026-04-05', 149.90, 'Pago',     '2026-04', 'Cartao'),
  (1, '2026-05-01', '2026-05-05',  99.90, 'Pago',     '2026-05', 'Pix'),
  (2, NULL,         '2026-05-05', 149.90, 'Pendente', '2026-05', NULL),
  (3, NULL,         '2026-01-05',  99.90, 'Atrasado', '2026-01', NULL);

-- Treinos
INSERT INTO treinos (aluno_id, professor_id, objetivo, data_inicio, data_fim, nivel, observacoes) VALUES
  (1, 1, 'Hipertrofia',      '2026-04-01', '2026-06-30', 'Intermediario', 'Treino A - Peito e Tríceps'),
  (2, 2, 'Condicionamento',  '2026-04-15', NULL,         'Iniciante',     'Foco em resistência');

-- Exercicios
INSERT INTO exercicios (treino_id, nome, grupo_muscular, series, repeticoes, descanso_seg, ordem) VALUES
  (1, 'Supino Reto',     'Peito',   4, '12',   60, 1),
  (1, 'Crucifixo',       'Peito',   3, '12-15', 45, 2),
  (1, 'Tríceps Pulley',  'Tríceps', 4, '10-12', 60, 3),
  (2, 'Agachamento',     'Pernas',  3, '15',   45, 1),
  (2, 'Burpee',          'Full',    3, '10',   60, 2);

-- Frequencias
INSERT INTO frequencias (aluno_id, data_entrada, horario_entrada, horario_saida) VALUES
  (1, '2026-05-18', '07:30:00', '08:45:00'),
  (1, '2026-05-19', '07:25:00', '08:30:00'),
  (2, '2026-05-19', '18:00:00', '19:15:00');
