-- GymControl - Consultas que cobrem os requisitos funcionais (RF06 e RF10)
USE gymcontrol;

-- RF06: alunos inadimplentes (qualquer pagamento Atrasado OU Pendente vencido)
SELECT a.id, a.nome, a.cpf, p.referencia_mensal, p.data_vencimento, p.valor, p.status
FROM alunos a
JOIN pagamentos p ON p.aluno_id = a.id
WHERE p.status = 'Atrasado'
   OR (p.status = 'Pendente' AND p.data_vencimento < CURDATE())
ORDER BY a.nome, p.data_vencimento;

-- RF10: relatório de alunos ativos com seu plano
SELECT a.id, a.nome, pl.nome AS plano, pl.valor, a.data_inicio_plano
FROM alunos a
LEFT JOIN planos pl ON pl.id = a.plano_id
WHERE a.status = 'Ativo'
ORDER BY a.nome;

-- RF10: total arrecadado por mês de referência
SELECT referencia_mensal, COUNT(*) AS qtd, SUM(valor) AS total
FROM pagamentos
WHERE status = 'Pago'
GROUP BY referencia_mensal
ORDER BY referencia_mensal DESC;

-- RF10: frequência por aluno num período
SELECT a.nome, COUNT(*) AS visitas
FROM frequencias f
JOIN alunos a ON a.id = f.aluno_id
WHERE f.data_entrada BETWEEN '2026-05-01' AND '2026-05-31'
GROUP BY a.id, a.nome
ORDER BY visitas DESC;

-- Treino completo de um aluno (com exercícios)
SELECT t.id AS treino_id, t.objetivo, t.nivel,
       e.ordem, e.nome AS exercicio, e.grupo_muscular, e.series, e.repeticoes, e.descanso_seg
FROM treinos t
JOIN exercicios e ON e.treino_id = t.id
WHERE t.aluno_id = 1
ORDER BY t.data_inicio DESC, e.ordem;
