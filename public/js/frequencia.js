// ─── FREQUÊNCIA ADMIN ──────────────────────────────────────────────────────────
async function renderFrequenciaAdmin(c) {
    const [freqs, alunos] = await Promise.all([api.get('/api/frequencia'), api.get('/api/alunos')]);
    const alunoOpts = alunos.filter(a => a.status === 'Ativo').map(a => `<option value="${a.id}">${escape(a.nome)}</option>`).join('');
    const hoje = new Date().toISOString().split('T')[0];
    const horaAtual = new Date().toTimeString().substring(0, 5);

    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Frequência</div>
        <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">Check-in de alunos</div>
      </div>
      <button class="${BTN_PRI}" data-action="openModalFreq">＋ Registrar Check-in</button>
    </div>
    ${panelPlain(`
      <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <span class="font-semibold text-[0.9rem]">Histórico de Frequência</span>
        <input type="date" id="filtroData" value="${hoje}" data-action="filtrarFreq" style="margin:0;width:auto">
      </div>
      <div class="overflow-x-auto">
        <table id="freqTable">
          <thead><tr><th>Aluno</th><th>Data</th><th>Entrada</th><th>Saída</th><th>Ações</th></tr></thead>
          <tbody>${freqRows(freqs)}</tbody>
        </table>
      </div>`)}`;

    window.openModalFreq = () => {
        openModal('Registrar Check-in', `
      <div class="${FGRID}">
        <div class="${FG_FULL}"><label>Aluno *</label><select id="fq_aluno">${alunoOpts}</select></div>
        <div class="${FG}"><label>Data *</label><input type="date" id="fq_data" value="${hoje}"></div>
        <div class="${FG}"><label>Horário Entrada *</label><input type="time" id="fq_hora" value="${horaAtual}"></div>
        <div class="${FG}"><label>Horário Saída</label><input type="time" id="fq_saida"></div>
      </div>`,
            `<button class="${BTN_SEC}" data-action="closeModal">Cancelar</button>
       <button class="${BTN_PRI}" data-action="submitFreq">Registrar</button>`
        );
    };

    window.salvarFreq = async () => {
        await api.post('/api/frequencia', { alunoId: document.getElementById('fq_aluno').value, dataEntrada: document.getElementById('fq_data').value, horarioEntrada: document.getElementById('fq_hora').value, horarioSaida: document.getElementById('fq_saida').value });
        closeModal(); toast('Check-in registrado!'); renderFrequenciaAdmin(c);
    };

    window.deletarFreq = async (id) => {
        if (!confirm('Remover registro?')) return;
        await api.delete(`/api/frequencia/${id}`);
        toast('Registro removido'); renderFrequenciaAdmin(c);
    };

    window.filtrarFreq = () => {
        const data = document.getElementById('filtroData').value;
        document.querySelectorAll('#freqTable tbody tr').forEach(r => {
            r.style.display = !data || r.textContent.includes(fmtDate(data)) ? '' : 'none';
        });
    };

    setTimeout(() => { if (document.getElementById('filtroData')) window.filtrarFreq(); }, 0);
}

function freqRows(freqs) {
    if (!freqs.length) return `<tr><td colspan="5">${emptyState('📅', 'Nenhum check-in registrado')}</td></tr>`;
    return freqs.map(f => `
    <tr>
      <td><strong>${escape(f.alunoNome || '—')}</strong></td>
      <td>${fmtDate(f.dataEntrada)}</td>
      <td>${badge(f.horarioEntrada || '—', 'blue')}</td>
      <td>${f.horarioSaida ? badge(f.horarioSaida, 'green') : '<span class="text-[var(--muted)]">—</span>'}</td>
      <td><button class="${BTN_DNG_SM}" data-action="deletarFreq" data-id="${f.id}">🗑️</button></td>
    </tr>`).join('');
}

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
async function renderRelatorios(c) {
    const [dash, receita, alunos] = await Promise.all([
        api.get('/api/relatorios/dashboard'),
        api.get('/api/relatorios/receita-mensal'),
        api.get('/api/alunos')
    ]);

    const maxR = Math.max(...receita.map(r => r.total), 1);
    const barHTML = receita.slice(-12).map(r => `
    <div class="flex flex-col items-center gap-1 flex-1">
      <div class="chart-bar" style="height:${Math.round((r.total / maxR) * 100)}px" title="${fmtMoney(r.total)} — ${r.qtd} pgts"></div>
      <span class="text-[0.65rem] text-[var(--muted)]">${fmtYM(r.mes)}</span>
    </div>`).join('');

    const porPlano = {};
    alunos.filter(a => a.status === 'Ativo').forEach(a => { porPlano[a.planoNome || 'N/A'] = (porPlano[a.planoNome || 'N/A'] || 0) + 1; });
    const planoRows = Object.entries(porPlano).map(([nome, qtd]) =>
        `<tr><td>${escape(nome)}</td><td>${qtd}</td><td>${Math.round(qtd / Math.max(dash.ativos, 1) * 100)}%</td></tr>`).join('');

    const statCard = (color, icon, value, label, valClass = '') =>
        `<div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 relative overflow-hidden card-stripe stripe-${color}">
       <div class="text-2xl mb-2.5">${icon}</div>
       <div class="font-bebas text-[2rem] tracking-[1px] text-[var(--text)] leading-none ${valClass}">${value}</div>
       <div class="text-[0.75rem] text-[var(--muted)] mt-1 uppercase tracking-[0.5px]">${label}</div>
     </div>`;

    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Relatórios</div>
      <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">Análise do negócio</div></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 mb-7">
      ${statCard('yellow', '👥', dash.totalAlunos, 'Total de Alunos')}
      ${statCard('green', '✅', dash.ativos, 'Ativos')}
      ${statCard('red', '❌', dash.inativos, 'Inativos')}
      ${statCard('red', '⚠️', dash.inadimplentes, 'Inadimplentes')}
      ${statCard('orange', '💵', fmtMoney(dash.receitaMes), 'Receita do Mês', 'text-[1.2rem]')}
      ${statCard('green', '💰', fmtMoney(dash.receitaTotal), 'Receita Total', 'text-[1.2rem]')}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
      ${panel(
        `<span class="font-semibold text-[0.9rem]">📈 Receita por Mês</span>`,

        `<div class="p-5">${receita.length
            ? `<div class="flex items-end gap-2 h-[120px] py-2.5">${barHTML}</div>`
            : emptyState('', 'Sem dados')}</div>`
    )}
      ${panelPlain(`
        <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <span class="font-semibold text-[0.9rem]">📋 Alunos por Plano</span>
        </div>
        <div class="overflow-x-auto">
          <table><thead><tr><th>Plano</th><th>Qtd</th><th>%</th></tr></thead>
          <tbody>${planoRows || '<tr><td colspan="3" class="text-[var(--muted)]">Sem dados</td></tr>'}</tbody></table>
        </div>`)}
    </div>`;
}
