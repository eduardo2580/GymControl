# 2. Playwright do zero

## O que é Playwright

Playwright é uma ferramenta que **automatiza um navegador de verdade** (Chromium, Firefox, Safari) e clica nos lugares como se fosse um usuário. A gente usa pra escrever testes **end-to-end** (E2E): "abre o app, faz login, cadastra aluno, confere que apareceu na lista".

Diferente dos testes da API (Jest), que só batem em URLs, o Playwright realmente desenha a página e interage. É mais lento, mas pega bugs que só aparecem na UI (clique não funciona, modal não fecha, campo não preenche).

## Pré-requisitos

- Node.js já instalado.
- `npm install` já rodado (instala o `@playwright/test`).
- Docker + banco subindo (ver [01-docker.md](01-docker.md)) **ou** MySQL local (ver [03-mysql-sem-docker.md](03-mysql-sem-docker.md)).
- Os testes da API verdes: `npm test` deve passar.

## Instalando o navegador (uma vez por máquina)

Playwright baixa um Chromium próprio (não usa o do seu sistema). Rode uma vez:

```bash
npx playwright install chromium
```

Baixa ~120 MB. Próximas vezes não precisa rodar.

## Modo rápido (a versão que a CI roda)

```bash
npm run test:e2e
```

O que acontece:
1. Playwright sobe o servidor Node automaticamente (via `webServer` no [`playwright.config.js`](../../playwright.config.js)).
2. Faz login direto pela API para cada papel (admin, professor, aluno) e salva os cookies — assim os testes começam já logados (sem cair no rate-limit de 5 logins/min).
3. Abre um Chromium **sem janela** (headless).
4. Roda os 6 testes em paralelo de 1, em ~8 segundos.
5. Mostra `6 passed`.

Se algum teste falhar, ele grava um screenshot e um trace em `test-results/`. Pra abrir o relatório bonitinho:

```bash
npx playwright show-report
```

## Modo "human-paced" — gera vídeo pra revisão humana

Esse é o modo que produz um arquivo de vídeo **único, compartilhável**, com todos os testes rodando devagar (1 segundo entre cada ação) e janela aberta.

```bash
npm run test:e2e:human
```

O comando faz uma sequência:

1. **Roda o modo rápido primeiro como gate** — se algum teste falhar aqui, o resto não roda. Você não quer um vídeo de 1 minuto mostrando um teste quebrado.
2. **Limpa `test-results/`** pra não misturar com vídeos da rodada anterior.
3. **Reroda a suíte** com:
   - Janela do navegador **visível** (você vê tudo acontecendo).
   - Pausa de **1 segundo** entre cada ação (`slowMo: 1000`).
   - **Vídeo gravado** em cada teste (config em [`playwright.config.human.js`](../../playwright.config.human.js)).
4. **Usa `ffmpeg`** (já incluído via `ffmpeg-static`, não precisa instalar nada) pra **costurar todos os vídeos num único arquivo**:
   ```
   test-results/human-e2e.mp4
   ```
   ~1.3 MB, ~78 segundos, MP4 (H.264) — abre em qualquer player, dá pra mandar pelo WhatsApp/Drive/email.

> 💡 O `test-results/` está no `.gitignore`. O vídeo fica só na sua máquina. Pra compartilhar, copie o arquivo manualmente.

> ⚠️ Enquanto o modo human-paced roda, **não mexa no mouse nem no teclado**. Você interagir com o navegador pode confundir o Playwright e fazer um teste falhar à toa.

## Vendo os testes interativamente (debug)

Pra rodar um teste específico e inspecionar passo a passo:

```bash
npx playwright test app.spec.js --headed --debug
```

Abre o **Playwright Inspector**, onde você pode dar "step over" linha a linha e ver o que o navegador tá fazendo.

## Estrutura do teste

[`tests/e2e/app.spec.js`](../../tests/e2e/app.spec.js) cobre:
- Login com credenciais válidas e inválidas.
- Admin: cadastrar/editar/remover aluno, com máscara automática de CPF.
- RBAC: aluno não vê o menu "Inadimplentes".
- Sessão: logout invalida o cookie; recarregar não retoma sessão.

## Problemas comuns

**"Error: browserType.launch: Executable doesn't exist"**
→ Você esqueceu de rodar `npx playwright install chromium`.

**"Timeout: page.goto: net::ERR_CONNECTION_REFUSED"**
→ O servidor Node não subiu. Confira que o banco tá no ar e tente `npm start` em outro terminal. Se subir, mate o processo (Ctrl+C) e rode `npm run test:e2e` de novo — o Playwright sobe ele sozinho.

**"login failed for admin: 429"**
→ Rate-limit. Espere 60 segundos e tente de novo. Os testes já são feitos pra evitar isso, mas se você rodar `npm run test:e2e` várias vezes em sequência em <1min, pode acontecer.

**O vídeo `human-e2e.mp4` não foi gerado**
→ Algum teste do modo rápido falhou (o gate impediu a continuação). Veja a saída do `npm run test:e2e` e corrija primeiro.

## Próximo passo
[3. MySQL sem Docker](03-mysql-sem-docker.md) (opcional — só se você não puder usar Docker)
