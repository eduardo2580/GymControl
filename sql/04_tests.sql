-- GymControl - Testes do schema
-- Roda após 01_schema.sql + 02_seed.sql. Cada bloco imprime PASS/FAIL.
USE gymcontrol;

-- ─── Contagens das tabelas após o seed ──────────────────────────────────────
SELECT 'planos'      AS tabela, COUNT(*) AS qtd FROM planos      UNION ALL
SELECT 'professores',          COUNT(*)        FROM professores  UNION ALL
SELECT 'alunos',               COUNT(*)        FROM alunos       UNION ALL
SELECT 'usuarios',             COUNT(*)        FROM usuarios     UNION ALL
SELECT 'pagamentos',           COUNT(*)        FROM pagamentos   UNION ALL
SELECT 'treinos',              COUNT(*)        FROM treinos      UNION ALL
SELECT 'exercicios',           COUNT(*)        FROM exercicios   UNION ALL
SELECT 'frequencias',          COUNT(*)        FROM frequencias;

-- ─── Helper: cada teste captura erro e devolve PASS/FAIL ────────────────────
DELIMITER //

DROP PROCEDURE IF EXISTS expect_fail //
CREATE PROCEDURE expect_fail(IN label VARCHAR(120), IN stmt TEXT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    SELECT CONCAT('PASS - ', label) AS resultado;
  DECLARE EXIT HANDLER FOR SQLWARNING
    SELECT CONCAT('PASS - ', label) AS resultado;
  SET @s = stmt;
  PREPARE p FROM @s;
  EXECUTE p;
  DEALLOCATE PREPARE p;
  SELECT CONCAT('FAIL - ', label, ' (nao rejeitou)') AS resultado;
END //

DELIMITER ;

-- ─── Testes de constraint ───────────────────────────────────────────────────
CALL expect_fail('UNIQUE cpf rejeita duplicado',
  "INSERT INTO alunos (nome, cpf) VALUES ('Dup', '111.111.111-11')");

CALL expect_fail('UNIQUE cref rejeita duplicado',
  "INSERT INTO professores (nome, cref) VALUES ('Dup', '12345-G/SP')");

CALL expect_fail('UNIQUE email do usuario rejeita duplicado',
  "INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES ('X','admin@gym.com','h','Admin')");

CALL expect_fail('ENUM status do aluno rejeita valor invalido',
  "INSERT INTO alunos (nome, cpf, status) VALUES ('Zé', '999.999.999-99', 'Banido')");

CALL expect_fail('ENUM status do pagamento rejeita valor invalido',
  "INSERT INTO pagamentos (aluno_id, data_vencimento, valor, status, referencia_mensal) VALUES (1,'2026-06-05',99.90,'Quitado','2026-06')");

CALL expect_fail('FK pagamento->aluno rejeita orfao',
  "INSERT INTO pagamentos (aluno_id, data_vencimento, valor, status, referencia_mensal) VALUES (9999,'2026-06-05',99.90,'Pendente','2026-06')");

CALL expect_fail('FK treino->professor rejeita orfao',
  "INSERT INTO treinos (aluno_id, professor_id, objetivo, data_inicio) VALUES (1, 9999, 'X', '2026-05-01')");

CALL expect_fail('UNIQUE (aluno, referencia_mensal) impede duplicar mensalidade',
  "INSERT INTO pagamentos (aluno_id, data_vencimento, valor, status, referencia_mensal) VALUES (1,'2026-04-05',99.90,'Pago','2026-04')");

CALL expect_fail('CHECK valor do plano nao aceita negativo',
  "INSERT INTO planos (nome, valor, duracao_meses) VALUES ('Ruim', -10, 1)");

CALL expect_fail('1..1 usuario->aluno: nao permite dois usuarios pro mesmo aluno',
  "INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, aluno_id) VALUES ('Outro','outro@aluno.com','h','Aluno',1)");

-- ─── Testes de cascade ──────────────────────────────────────────────────────
-- Deletar um treino remove seus exercicios?
INSERT INTO treinos (aluno_id, professor_id, objetivo, data_inicio) VALUES (1, 1, 'Temp', '2026-05-01');
SET @t := LAST_INSERT_ID();
INSERT INTO exercicios (treino_id, nome, grupo_muscular, series, repeticoes) VALUES (@t,'X','Peito',3,'10');
DELETE FROM treinos WHERE id = @t;
SELECT IF(COUNT(*)=0,'PASS','FAIL') AS resultado,
       'CASCADE treino->exercicios' AS teste
FROM exercicios WHERE treino_id = @t;

-- ─── Verifica que as queries da RF06/RF10 retornam linhas ───────────────────
SELECT IF(COUNT(*) >= 1,'PASS','FAIL') AS resultado, 'RF06 lista inadimplentes' AS teste
FROM (
  SELECT a.id
  FROM alunos a JOIN pagamentos p ON p.aluno_id = a.id
  WHERE p.status = 'Atrasado' OR (p.status='Pendente' AND p.data_vencimento < CURDATE())
) x;

SELECT IF(COUNT(*) >= 1,'PASS','FAIL') AS resultado, 'RF10 arrecadacao por mes' AS teste
FROM (
  SELECT referencia_mensal FROM pagamentos WHERE status='Pago' GROUP BY referencia_mensal
) x;
