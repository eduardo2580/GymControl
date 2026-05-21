// ─── INADIMPLENTES ────────────────────────────────────────────────────────────
async function renderInadimplentes(c) {
    const [iad, planos] = await Promise.all([api.get('/api/inadimplentes'), api.get('/api/planos')]);
    const mesAtual = new Date().toISOString().substring(0, 7);
    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Inadimplentes</div>
        <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">${iad.length} alunos sem pagamento em ${fmtYM(mesAtual)}</div>
      </div>
    </div>
    ${iad.length ?
            panelPlain(`
        <div class="overflow-x-auto">
          <table>
            <thead><tr><th>Nome</th><th>Plano</th><th>Valor</th><th>Telefone</th><th>Ação</th></tr></thead>
            <tbody>${iad.map(a => {
                const plano = planos.find(p => p.id === a.planoId);
                return `<tr>
                <td><strong>${escape(a.nome)}</strong></td>
                <td>${badge(a.planoNome || '—', 'blue')}</td>
                <td class="text-[var(--red)] font-semibold">${fmtMoney(plano?.valor || 0)}</td>
                <td>${escape(a.telefone || '—')}</td>
                <td><button class="${BTN_SUC_SM}" data-action="registrarPagamentoRapido" data-id="${a.id}" data-valor="${plano?.valor || 0}">💵 Registrar Pgto</button></td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>`) :
            panelPlain(`<div class="p-5">${emptyState('🎉', 'Todos os alunos estão em dia este mês!')}</div>`)}`;

    window.registrarPagamentoRapido = async (alunoId, valor) => {
        const hoje = new Date().toISOString().split('T')[0];
        await api.post('/api/pagamentos', { alunoId, valor, dataPagamento: hoje, referenciaMensal: hoje.substring(0, 7), metodoPagamento: 'Dinheiro' });
        toast('Pagamento registrado!'); renderInadimplentes(c);
    };
}
