// ─── ALUNO PAGES ───────────────────────────────────────────────────────────────
async function renderAlunoTab(tab) {
    if (!currentAlunoId) return;
    const c = document.getElementById('alunoPageContent');
    if (tab === 'meu-perfil') await renderAlunoPerfil(c);
    else if (tab === 'meus-treinos') await renderAlunoTreinos(c);
    else if (tab === 'meus-pagamentos') await renderAlunoPagamentos(c);
    else if (tab === 'minha-frequencia') await renderAlunoFrequencia(c);
}

async function renderAlunoPerfil(c) {
    const [aluno, planoData, situacao] = await Promise.all([
        api.get(`/api/alunos/${currentAlunoId}`),
        api.get(`/api/alunos/${currentAlunoId}/plano-atual`),
        api.get(`/api/alunos/${currentAlunoId}/situacao-pagamento`)
    ]);

    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Meu Perfil</div></div>
    </div>
    <div class="grid grid-cols-2 gap-4 mb-4">
      ${panel(
        `<span class="font-semibold text-[0.9rem]">👤 Dados Pessoais</span>`,
        `<div class="p-5">
          <table class="text-[0.9rem]">
            <tr><td class="text-[var(--muted)] py-1.5 pr-3">Nome</td><td class="py-1.5"><strong>${escape(aluno.nome)}</strong></td></tr>
            <tr><td class="text-[var(--muted)] py-1.5 pr-3">CPF</td><td class="py-1.5">${escape(aluno.cpf || '—')}</td></tr>
            <tr><td class="text-[var(--muted)] py-1.5 pr-3">Telefone</td><td class="py-1.5">${escape(aluno.telefone || '—')}</td></tr>
            <tr><td class="text-[var(--muted)] py-1.5 pr-3">Nascimento</td><td class="py-1.5">${fmtDate(aluno.dataNascimento)}</td></tr>
            <tr><td class="text-[var(--muted)] py-1.5 pr-3">Status</td><td class="py-1.5">${badge(aluno.status, aluno.status === 'Ativo' ? 'green' : 'gray')}</td></tr>
          </table>
        </div>`
    )}
      ${panel(
        `<span class="font-semibold text-[0.9rem]">📋 Meu Plano</span>`,
        `<div class="p-5">
          <div class="mb-3">
            <div class="font-bebas text-[1.8rem] text-[var(--accent)]">${escape(planoData.plano?.nome || 'Nenhum')}</div>
            <div class="text-[var(--muted)] text-[0.82rem]">Desde ${fmtDate(planoData.dataInicio)}</div>
          </div>
          ${planoData.plano ? `<div class="text-[1.3rem] font-bold">${fmtMoney(planoData.plano.valor)}<span class="text-[var(--muted)] text-[0.8rem] font-normal">/mês</span></div>` : ''}
          <hr class="border-none border-t border-[var(--border)] my-5">
          <div class="flex items-center gap-2 text-[0.9rem]">
            <span>Situação financeira:</span>
            ${badge(situacao.status, situacao.status === 'Em dia' ? 'green' : 'red')}
          </div>
        </div>`
    )}
    </div>
    ${aluno.observacoes ?
            panel(`<span class="font-semibold text-[0.9rem]">📝 Observações</span>`,
                `<div class="p-5"><p class="text-[0.9rem] text-[var(--muted)]">${escape(aluno.observacoes)}</p></div>`) : ''}`;
}

async function renderAlunoTreinos(c) {
    const treinos = await api.get(`/api/treinos?alunoId=${currentAlunoId}`);
    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Meus Treinos</div>
      <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">${treinos.length} treino(s)</div></div>
    </div>
    ${treinos.length ? treinos.map(t => {
        const exs = Array.isArray(t.exercicios) ? t.exercicios : JSON.parse(t.exercicios || '[]');
        return `${panel(
            `<div>
          <span class="font-semibold text-[0.9rem]">${escape(t.objetivo)}</span>
          <div class="flex gap-2 mt-1">
            ${badge(t.nivel || 'Iniciante', 'blue')}
            <span class="text-[var(--muted)] text-[0.78rem]">📅 ${fmtDate(t.dataInicio)} → ${fmtDate(t.dataFim)}</span>
            <span class="text-[var(--muted)] text-[0.78rem]">🏋️ ${escape(t.professorNome || '—')}</span>
          </div>
        </div>`,
            `${t.observacoes ? `<div class="px-5 py-3 border-b border-[var(--border)] text-[0.85rem] text-[var(--muted)]">📝 ${escape(t.observacoes)}</div>` : ''}
        ${exs.length ?
                `<div class="overflow-x-auto"><table>
            <thead><tr><th>Exercício</th><th>Grupo</th><th>Séries</th><th>Repetições</th><th>Descanso</th></tr></thead>
            <tbody>${exs.map(e => `<tr>
              <td><strong>${escape(e.nome)}</strong></td>
              <td>${badge(e.grupoMuscular, 'blue')}</td>
              <td class="text-center">${e.series}</td>
              <td class="text-center">${e.repeticoes}</td>
              <td class="text-center">${e.descanso ? e.descanso + 's' : '—'}</td>
            </tr>`).join('')}</tbody>
          </table></div>` :
                `<div class="p-5"><p class="text-[var(--muted)]">Nenhum exercício cadastrado neste treino.</p></div>`
            }`
        )}`;
    }).join('') : panelPlain(`<div class="p-5">${emptyState('💪', 'Nenhum treino atribuído ainda.')}</div>`)}`;
}

async function renderAlunoPagamentos(c) {
    const hist = await api.get(`/api/pagamentos?alunoId=${currentAlunoId}`);
    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Meus Pagamentos</div></div>
    </div>
    ${panelPlain(`
      <div class="overflow-x-auto">
        <table>
          <thead><tr><th>Referência</th><th>Valor</th><th>Data Pgto</th><th>Método</th><th>Status</th></tr></thead>
          <tbody>${hist.length ? hist.map(p => `<tr>
            <td>${badge(fmtYM(p.referenciaMensal), 'blue')}</td>
            <td class="text-[var(--accent)] font-bold">${fmtMoney(p.valor)}</td>
            <td>${fmtDate(p.dataPagamento)}</td>
            <td>${escape(p.metodoPagamento || '—')}</td>
            <td>${badge(p.status || 'Pago', 'green')}</td>
          </tr>`).join('') : `<tr><td colspan="5">${emptyState('', 'Nenhum pagamento encontrado')}</td></tr>`}</tbody>
        </table>
      </div>`)}`;
}

async function renderAlunoFrequencia(c) {
    const freqs = await api.get(`/api/frequencia?alunoId=${currentAlunoId}`);
    const total = freqs.length;
    const thisMonth = freqs.filter(f => f.dataEntrada?.startsWith(new Date().toISOString().substring(0, 7))).length;

    const statCard = (color, icon, value, label) =>
        `<div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 relative overflow-hidden card-stripe stripe-${color}">
       <div class="text-2xl mb-2.5">${icon}</div>
       <div class="font-bebas text-[2rem] tracking-[1px] text-[var(--text)] leading-none">${value}</div>
       <div class="text-[0.75rem] text-[var(--muted)] mt-1 uppercase tracking-[0.5px]">${label}</div>
     </div>`;

    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Minha Frequência</div></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 mb-4">
      ${statCard('blue', '📅', total, 'Total de Visitas')}
      ${statCard('green', '🗓️', thisMonth, 'Visitas este Mês')}
    </div>
    ${panelPlain(`
      <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <span class="font-semibold text-[0.9rem]">Histórico de Check-ins</span>
      </div>
      <div class="overflow-x-auto">
        <table>
          <thead><tr><th>Data</th><th>Entrada</th><th>Saída</th></tr></thead>
          <tbody>${freqs.length ? freqs.map(f => `<tr>
            <td><strong>${fmtDate(f.dataEntrada)}</strong></td>
            <td>${badge(f.horarioEntrada || '—', 'blue')}</td>
            <td>${f.horarioSaida ? badge(f.horarioSaida, 'green') : '<span class="text-[var(--muted)]">—</span>'}</td>
          </tr>`).join('') : `<tr><td colspan="3">${emptyState('📅', 'Nenhuma visita registrada')}</td></tr>`}</tbody>
        </table>
      </div>`)}`;
}
