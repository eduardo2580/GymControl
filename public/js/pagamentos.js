// ─── PAGAMENTOS ───────────────────────────────────────────────────────────────
async function renderPagamentos(c) {
    const [pags, alunos, planos] = await Promise.all([
        api.get('/api/pagamentos'),
        api.get('/api/alunos'),
        api.get('/api/planos')
    ]);

    const alunoOpts = alunos.map(a => `<option value="${a.id}">${escape(a.nome)}</option>`).join('');
    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = hoje.substring(0, 7);

    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Pagamentos</div>
        <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">${pags.length} registros</div>
      </div>
      <button class="${BTN_PRI}" onclick="openModalPag()">＋ Registrar Pagamento</button>
    </div>
    ${panelPlain(`
      <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <span class="font-semibold text-[0.9rem]">Histórico de Pagamentos</span>
        <div class="flex gap-2 items-center">
          <input type="month" id="filtroMes" value="${mesAtual}" oninput="filtrarPag()" style="margin:0;width:auto">
          <input placeholder="🔍 Buscar aluno..." id="searchPag" oninput="filtrarPag()" style="margin:0;max-width:160px">
        </div>
      </div>
      <div class="overflow-x-auto">
        <table id="pagTable">
          <thead><tr><th>Aluno</th><th>Referência</th><th>Valor</th><th>Data Pgto</th><th>Método</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>${pagRows(pags)}</tbody>
        </table>
      </div>`)}`;

    window._pagList = pags;

    window.openModalPag = () => {
        openModal('Registrar Pagamento', `
      <div class="${FGRID}">
        <div class="${FG_FULL}"><label>Aluno *</label><select id="pg_aluno" onchange="autoPreencherValor()">${alunoOpts}</select></div>
        <div class="${FG}"><label>Valor (R$) *</label><input id="pg_valor" type="number" step="0.01" placeholder="0,00"></div>
        <div class="${FG}"><label>Data do Pagamento *</label><input id="pg_data" type="date" value="${hoje}"></div>
        <div class="${FG}"><label>Referência (mês) *</label><input id="pg_ref" value="${mesAtual}" placeholder="2026-05"></div>
        <div class="${FG}"><label>Método</label>
          <select id="pg_metodo"><option>Dinheiro</option><option>Pix</option><option>Cartão Débito</option><option>Cartão Crédito</option><option>Transferência</option></select>
        </div>
        <div class="${FG}"><label>Observações</label><input id="pg_obs" placeholder="Opcional"></div>
      </div>`,
            `<button class="${BTN_SEC}" onclick="closeModal()">Cancelar</button>
       <button class="${BTN_PRI}" onclick="submitting(this, salvarPagamento)">Registrar</button>`
        );
        setTimeout(window.autoPreencherValor, 100);
    };

    window.autoPreencherValor = () => {
        const alunoId = parseInt(document.getElementById('pg_aluno')?.value);
        if (!alunoId) return;
        const aluno = alunos.find(a => a.id === alunoId);
        const plano = planos.find(p => p.id === aluno?.planoId);
        if (plano) document.getElementById('pg_valor').value = plano.valor;
    };

    window.salvarPagamento = async () => {
        await api.post('/api/pagamentos', {
            alunoId: document.getElementById('pg_aluno').value,
            valor: document.getElementById('pg_valor').value,
            dataPagamento: document.getElementById('pg_data').value,
            referenciaMensal: document.getElementById('pg_ref').value,
            metodoPagamento: document.getElementById('pg_metodo').value,
            observacoes: document.getElementById('pg_obs').value
        });
        closeModal(); toast('Pagamento registrado!'); renderPagamentos(c);
    };

    window.deletarPag = async (id) => {
        if (!confirm('Remover este pagamento?')) return;
        await api.delete(`/api/pagamentos/${id}`);
        toast('Pagamento removido'); renderPagamentos(c);
    };

    window.filtrarPag = () => {
        const mes = document.getElementById('filtroMes').value;
        const q = document.getElementById('searchPag').value.toLowerCase();
        document.querySelectorAll('#pagTable tbody tr').forEach(r => {
            const ref = r.getAttribute('data-ref') || '';
            const mesMatch = !mes || ref === mes;
            const txt = r.textContent.toLowerCase();
            r.style.display = (mesMatch && txt.includes(q)) ? '' : 'none';
        });
    };
}

function pagRows(pags) {
    if (!pags.length) return `<tr><td colspan="7">${emptyState('💵', 'Nenhum pagamento')}</td></tr>`;
    return pags.map(p => `
    <tr data-ref="${escape(p.referenciaMensal || '')}">
      <td><strong>${escape(p.alunoNome || '—')}</strong></td>
      <td>${badge(fmtYM(p.referenciaMensal), 'blue')}</td>
      <td class="text-[var(--accent)] font-bold">${fmtMoney(p.valor)}</td>
      <td>${fmtDate(p.dataPagamento)}</td>
      <td class="text-[var(--muted)]">${escape(p.metodoPagamento || '—')}</td>
      <td>${badge(p.status || 'Pago', 'green')}</td>
      <td><button class="${BTN_DNG_SM}" onclick="deletarPag(${p.id})">🗑️</button></td>
    </tr>`).join('');
}
