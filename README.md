# 🏋️ GymControl — Sistema de Gerenciamento de Academia

> Projeto desenvolvido para a disciplina **Prática Profissional: Projeto de Software — EV50775_2026_1** da Universidade São Francisco. É um exercício acadêmico: o sistema será publicado para demonstração, mas não está previsto uso real em produção.

Sistema web para gerenciamento de academia (alunos, professores, planos, pagamentos, treinos e frequência).

## 📚 Documentação completa

| | |
|---|---|
| 🎓 **[Tutoriais](docs/tutorials/)** | Guias passo a passo de Docker, Playwright e MySQL aplicados ao projeto |
| 📌 **[Entrega parcial](docs/entrega-parcial/)** | Planejamento original entregue na fase parcial — arquivado |
| 🚧 **[Entrega final](docs/entrega-final/)** | Documentação viva: RFs, RNFs, casos de uso, classes e features adicionadas |

---

## Quick start

Pré-requisitos: **Node.js 20+**, **Docker Desktop** rodando, **Git**.
(Se você nunca instalou Docker, veja o [tutorial 1](docs/tutorials/01-docker.md).)

```bash
git clone https://github.com/DyeAllPies/GymControl.git
cd GymControl
npm install
docker compose up -d
npm start
```

Abra <http://localhost:3000> e entre com uma conta demo.

## Contas de demonstração (seed)

| Perfil | E-mail | Senha |
|---|---|---|
| Admin | `admin@gym.com` | `admin123` |
| Professor | `ana@gym.com` | `prof123` |
| Aluno | `joao@aluno.com` | `aluno123` |

## Perfis e permissões (QUADRO 3)

| Perfil | Acesso |
|---|---|
| Admin | Tudo: alunos, professores, planos, pagamentos, inadimplentes, relatórios, backup |
| Professor | Consultar alunos; cadastrar e atualizar treinos |
| Aluno | Consultar seu perfil, treinos, situação de pagamento e frequência |

Detalhes da autenticação: [`docs/entrega-final/added/autenticacao.md`](docs/entrega-final/added/autenticacao.md).

## Comandos úteis

```bash
npm start             # sobe a aplicação em http://localhost:3000
npm test              # testes da API (Jest + Supertest, ~3s)
npm run test:e2e      # testes end-to-end no navegador (Playwright, ~8s)
npm run test:e2e:human   # gera test-results/human-e2e.mp4 com vídeo da suíte
docker compose stop   # pausa o banco (mantém os dados)
docker compose start  # religa o banco
```

Mais detalhes nos [tutoriais](docs/tutorials/) e em [`.env.example`](.env.example).

## Stack

Node.js + Express · mysql2 · bcrypt + JWT · helmet · express-rate-limit · HTML + Tailwind · MySQL 8.4 · Jest + Supertest · Playwright · GitHub Actions.
