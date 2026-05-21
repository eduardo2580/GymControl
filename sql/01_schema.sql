-- GymControl - Sistema de Gerenciamento de Academia
-- Schema MySQL conforme planejamento (QUADROS 8, 9 e 10)

CREATE DATABASE IF NOT EXISTS gymcontrol
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gymcontrol;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS frequencias;
DROP TABLE IF EXISTS exercicios;
DROP TABLE IF EXISTS treinos;
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS alunos;
DROP TABLE IF EXISTS professores;
DROP TABLE IF EXISTS planos;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- Usuario (RNF02: controle de acesso por tipo de usuário)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  tipo_usuario  ENUM('Admin','Professor','Aluno') NOT NULL,
  aluno_id      INT NULL,
  professor_id  INT NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Plano
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE planos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(80) NOT NULL,
  valor          DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
  duracao_meses  INT NOT NULL CHECK (duracao_meses > 0),
  descricao      VARCHAR(255) NULL
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Professor
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE professores (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(120) NOT NULL,
  cref          VARCHAR(20) NOT NULL UNIQUE,
  especialidade VARCHAR(80) NULL,
  telefone      VARCHAR(20) NULL,
  email         VARCHAR(160) NULL
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Aluno
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE alunos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  nome                VARCHAR(120) NOT NULL,
  cpf                 CHAR(14) NOT NULL UNIQUE,
  telefone            VARCHAR(20) NULL,
  data_nascimento     DATE NULL,
  status              ENUM('Ativo','Inativo','Suspenso') NOT NULL DEFAULT 'Ativo',
  plano_id            INT NULL,
  data_inicio_plano   DATE NULL,
  observacoes         TEXT NULL,
  criado_em           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aluno_plano FOREIGN KEY (plano_id) REFERENCES planos(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_aluno_status (status),
  INDEX idx_aluno_plano (plano_id)
) ENGINE=InnoDB;

-- FKs do usuario (1..1 com Aluno e Professor) — adicionadas após existirem as tabelas
ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuario_aluno     FOREIGN KEY (aluno_id)     REFERENCES alunos(id)      ON DELETE CASCADE,
  ADD CONSTRAINT fk_usuario_professor FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
  ADD UNIQUE KEY uk_usuario_aluno     (aluno_id),
  ADD UNIQUE KEY uk_usuario_professor (professor_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Pagamento (RF05, RF06)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE pagamentos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id            INT NOT NULL,
  data_pagamento      DATE NULL,
  data_vencimento     DATE NOT NULL,
  valor               DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
  status              ENUM('Pago','Pendente','Atrasado') NOT NULL DEFAULT 'Pendente',
  referencia_mensal   CHAR(7) NOT NULL,            -- formato 'YYYY-MM'
  metodo_pagamento    ENUM('Dinheiro','Pix','Cartao','Boleto') NULL,
  observacoes         VARCHAR(255) NULL,
  CONSTRAINT fk_pag_aluno FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_pag_aluno_ref (aluno_id, referencia_mensal),
  INDEX idx_pag_status (status),
  INDEX idx_pag_venc (data_vencimento)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Treino (RF07, RF08)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE treinos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id      INT NOT NULL,
  professor_id  INT NOT NULL,
  objetivo      VARCHAR(120) NOT NULL,
  data_inicio   DATE NOT NULL,
  data_fim      DATE NULL,
  nivel         ENUM('Iniciante','Intermediario','Avancado') NOT NULL DEFAULT 'Iniciante',
  observacoes   TEXT NULL,
  CONSTRAINT fk_treino_aluno     FOREIGN KEY (aluno_id)     REFERENCES alunos(id)      ON DELETE CASCADE,
  CONSTRAINT fk_treino_professor FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE RESTRICT,
  INDEX idx_treino_aluno (aluno_id),
  INDEX idx_treino_professor (professor_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Exercicio (1..N com Treino, conforme QUADRO 9)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE exercicios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  treino_id       INT NOT NULL,
  nome            VARCHAR(80) NOT NULL,
  grupo_muscular  VARCHAR(40) NOT NULL,
  series          TINYINT UNSIGNED NOT NULL CHECK (series > 0),
  repeticoes      VARCHAR(20) NOT NULL,            -- ex.: '12', '8-10', 'até falha'
  descanso_seg    SMALLINT UNSIGNED NULL,
  ordem           TINYINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_ex_treino FOREIGN KEY (treino_id) REFERENCES treinos(id) ON DELETE CASCADE,
  INDEX idx_ex_treino (treino_id, ordem)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Frequencia (RF09)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE frequencias (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id          INT NOT NULL,
  data_entrada      DATE NOT NULL,
  horario_entrada   TIME NOT NULL,
  horario_saida     TIME NULL,
  CONSTRAINT fk_freq_aluno FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
  INDEX idx_freq_aluno_data (aluno_id, data_entrada),
  INDEX idx_freq_data (data_entrada)
) ENGINE=InnoDB;
