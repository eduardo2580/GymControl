// ─── PLANOS ───────────────────────────────────────────────────────────────────
async function renderPlanos(c) {
    const planos = await api.get('/api/planos');
    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Planos</div>
        <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">Gerenciar planos de assinatura</div>
      </div>
      <button class="${BTN_PRI}" data-action="openModalPlano">＋ Novo Plano</button>
    </div>
    ${panelPlain(`
      <div class="overflow-x-auto">
        <table>
          <thead><tr><th>Nome</th><th>Valor</th><th>Duração</th><th>Descrição</th><th>Ações</th></tr></thead>
          <tbody>${planos.length ? planos.map(p => `
            <tr>
              <td><strong>${escape(p.nome)}</strong></td>
              <td class="text-[var(--accent)] font-bold">${fmtMoney(p.valor)}</td>
              <td>${p.duracaoMeses === 1 ? 'Mensal' : `${p.duracaoMeses} meses`}</td>
              <td class="text-[var(--muted)]">${escape(p.descricao || '—')}</td>
              <td class="flex gap-1.5">
                <button class="${BTN_SEC_SM}" data-action="editarPlano" data-id="${p.id}">✏️</button>
                <button class="${BTN_DNG_SM}" data-action="deletarPlano" data-id="${p.id}">🗑️</button>
              </td>
            </tr>`).join('') :
            `<tr><td colspan="5">${emptyState('', 'Nenhum plano cadastrado')}</td></tr>`
        }</tbody>
        </table>
      </div>`)}`;

    window._planosList = planos;

    window.openModalPlano = (id) => {
        const p = id ? planos.find(x => x.id === id) : null;
        openModal(p ? 'Editar Plano' : 'Novo Plano', `
      <div class="${FGRID}">
        <div class="${FG}"><label>Nome *</label><input id="pl_nome" value="${p ? escape(p.nome) : ''}"></div>
        <div class="${FG}"><label>Valor (R$) *</label><input id="pl_valor" type="number" step="0.01" value="${p ? p.valor : ''}"></div>
        <div class="${FG}"><label>Duração (meses)</label><input id="pl_dur" type="number" value="${p ? p.duracaoMeses : 1}"></div>
        <div class="${FG_FULL}"><label>Descrição</label><input id="pl_desc" value="${p ? escape(p.descricao || '') : ''}"></div>
      </div>`,
            `<button class="${BTN_SEC}" data-action="closeModal">Cancelar</button>
       <button class="${BTN_PRI}" data-action="${p ? 'submitEditPlano' : 'submitNovoPlano'}" data-id="${id || ''}">Salvar</button>`
        );
    };

    window.editarPlano = (id) => window.openModalPlano(id);

    window.salvarNovoPlano = async () => {
        const nome = document.getElementById('pl_nome').value.trim();
        if (!nome) { toast('Nome obrigatório', 'error'); return; }
        await api.post('/api/planos', { nome, valor: document.getElementById('pl_valor').value, duracaoMeses: document.getElementById('pl_dur').value, descricao: document.getElementById('pl_desc').value });
        closeModal(); toast('Plano criado!'); renderPlanos(c);
    };

    window.salvarEditPlano = async (id) => {
        await api.put(`/api/planos/${id}`, { nome: document.getElementById('pl_nome').value, valor: document.getElementById('pl_valor').value, duracaoMeses: document.getElementById('pl_dur').value, descricao: document.getElementById('pl_desc').value });
        closeModal(); toast('Plano atualizado!'); renderPlanos(c);
    };

    window.deletarPlano = async (id) => {
        if (!confirm('Remover plano?')) return;
        await api.delete(`/api/planos/${id}`);
        toast('Plano removido'); renderPlanos(c);
    };
}
