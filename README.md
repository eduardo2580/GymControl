# 🏋️ GymControl — Sistema de Gerenciamento de Academia

## Setup

```bash
npm install
npm start
# Acesse: http://localhost:3000
```

## Banco de dados
Usa **sql.js** (SQLite puro JS) — sem compilação nativa necessária.  
O banco é salvo automaticamente em `gymcontrol.db` a cada alteração.

## Backup & Restore
- **Admin → Backup**: baixe um `.json` com todos os dados
- **Admin → Backup → Restaurar**: faça upload de um `.json` para sobrescrever o banco

## Perfis
| Perfil | Acesso |
|--------|--------|
| Admin | Tudo: alunos, professores, planos, pagamentos, frequência, relatórios, backup |
| Professor | Gerenciar treinos, ver alunos, registrar frequência |
| Aluno | Ver perfil, treinos, pagamentos, frequência |