-- GymControl - cria um usuário MySQL dedicado para a aplicação, sem privilégios
-- de DDL/admin. Use isso em produção (AWS RDS) em vez de conectar como `root`.
--
-- Para rodar:
--   mysql -uroot -p < sql/05_app_user.sql
-- (informe a senha do app no prompt ou via variável)
--
-- Depois, ajuste as variáveis de ambiente do servidor:
--   DB_USER=gymcontrol_app
--   DB_PASSWORD=<a senha que você escolheu abaixo>

-- Edite a senha abaixo antes de rodar. NÃO commitar a senha real no git.
SET @app_password = 'CHANGE_ME_BEFORE_RUNNING';

-- Recria o usuário se já existir (idempotente)
DROP USER IF EXISTS 'gymcontrol_app'@'%';
CREATE USER 'gymcontrol_app'@'%' IDENTIFIED BY @app_password;

-- Privilégios mínimos: leitura e escrita em todas as tabelas do banco gymcontrol.
-- Sem CREATE, DROP, ALTER, GRANT, ou super-poderes.
GRANT SELECT, INSERT, UPDATE, DELETE ON gymcontrol.* TO 'gymcontrol_app'@'%';

-- Para o restore endpoint funcionar (precisa truncar/desligar FK_CHECKS temporariamente):
-- O restore usa TRUNCATE e SET FOREIGN_KEY_CHECKS=0. TRUNCATE exige privilégio DROP.
-- Se você quiser manter o restore funcionando com este usuário restrito, conceda
-- também:
--
--   GRANT DROP ON gymcontrol.* TO 'gymcontrol_app'@'%';
--
-- Recomendado em produção: NÃO conceder DROP. Faça restore via job manual com
-- credenciais separadas de admin.

FLUSH PRIVILEGES;

-- Verificação rápida (rode como root depois):
--   SHOW GRANTS FOR 'gymcontrol_app'@'%';
