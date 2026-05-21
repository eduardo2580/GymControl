// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function renderDashboard(c) {
    const [dash, receita] = await Promise.all([
        api.get('/api/relatorios/dashboard'),
        api.get('/api/relatorios/receita-mensal')
    ]);

    const maxR = Math.max(...receita.map(r => r.total), 1);
    const barHTML = receita.slice(-8).map(r => `
    <div class="flex flex-col items-center gap-1 flex-1">
      <div class="chart-bar" style="height:${Math.round((r.total / maxR) * 100)}px" title="${fmtMoney(r.total)}"></div>
      <span class="text-[0.65rem] text-[var(--muted)]">${fmtYM(r.mes)}</span>
    </div>`).join('');

    const statCard = (color, icon, value, label, valClass = '') =>
        `<div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 relative overflow-hidden card-stripe stripe-${color}">
       <div class="text-2xl mb-2.5">${icon}</div>
       <div class="font-bebas text-[2rem] tracking-[1px] text-[var(--text)] leading-none ${valClass}">${value}</div>
       <div class="text-[0.75rem] text-[var(--muted)] mt-1 uppercase tracking-[0.5px]">${label}</div>
     </div>`;

    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Dashboard</div>
        <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">Visão geral da academia</div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 mb-7">
      ${statCard('yellow', '👥', dash.totalAlunos, 'Total de Alunos')}
      ${statCard('green', '✅', dash.ativos, 'Alunos Ativos')}
      ${statCard('red', '⚠️', dash.inadimplentes, 'Inadimplentes')}
      ${statCard('blue', '📅', dash.checkins, 'Check-ins (30d)')}
      ${statCard('orange', '💵', fmtMoney(dash.receitaMes), 'Receita do Mês', 'text-[1.3rem]')}
      ${statCard('green', '💰', fmtMoney(dash.receitaTotal), 'Receita Total', 'text-[1.3rem]')}
    </div>
    ${panel(
        `<span class="font-semibold text-[0.9rem]">📈 Receita Mensal</span>`,
        `<div class="p-5">${receita.length
            ? `<div class="flex items-end gap-2 h-[120px] py-2.5">${barHTML}</div>`
            : emptyState('', 'Sem dados de receita')}</div>`
    )}`;
}
