// ─── PROFESSORES ──────────────────────────────────────────────────────────────
async function renderProfessores(c) {
    const profs = await api.get('/api/professores');
    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Professores</div>
        <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">${profs.length} cadastrados</div>
      </div>
      <button class="${BTN_PRI}" onclick="openModalProf()">＋ Novo Professor</button>
    </div>
    ${panelPlain(`
      <div class="overflow-x-auto">
        <table>
          <thead><tr><th>Nome</th><th>CREF</th><th>Especialidade</th><th>Telefone</th><th>Email</th><th>Ações</th></tr></thead>
          <tbody>${profs.length ? profs.map(p => `
            <tr>
              <td><strong>${escape(p.nome)}</strong></td>
              <td>${badge(p.cref || '—', 'yellow')}</td>
              <td>${escape(p.especialidade || '—')}</td>
              <td>${escape(p.telefone || '—')}</td>
              <td class="text-[var(--muted)]">${escape(p.email || '—')}</td>
              <td class="flex gap-1.5">
                <button class="${BTN_SEC_SM}" onclick="editarProf(${p.id})">✏️</button>
                <button class="${BTN_DNG_SM}" onclick="deletarProf(${p.id})">🗑️</button>
              </td>
            </tr>`).join('') :
            `<tr><td colspan="6">${emptyState('🏋️', 'Nenhum professor cadastrado')}</td></tr>`
        }</tbody>
        </table>
      </div>`)}`;

    window._profsList = profs;

    window.openModalProf = (id) => {
        const p = id ? profs.find(x => x.id === id) : null;
        openModal(p ? 'Editar Professor' : 'Cadastrar Professor', `
      <div class="${FGRID}">
        <div class="${FG_FULL}"><label>Nome *</label><input id="p_nome" value="${p ? escape(p.nome) : ''}"></div>
        <div class="${FG}"><label>CREF</label><input id="p_cref" value="${p ? escape(p.cref || '') : ''}"></div>
        <div class="${FG}"><label>Especialidade</label><input id="p_esp" value="${p ? escape(p.especialidade || '') : ''}"></div>
        <div class="${FG}"><label>Telefone</label><input id="p_tel" value="${p ? escape(p.telefone || '') : ''}"></div>
        <div class="${FG}"><label>Email</label><input id="p_email" type="email" value="${p ? escape(p.email || '') : ''}"></div>
      </div>`,
            `<button class="${BTN_SEC}" onclick="closeModal()">Cancelar</button>
       <button class="${BTN_PRI}" onclick="${p ? `submitting(this, () => salvarEditProf(${id}))` : 'submitting(this, salvarNovoProf)'}">Salvar</button>`
        );
    };

    window.editarProf = (id) => window.openModalProf(id);

    window.salvarNovoProf = async () => {
        const nome = document.getElementById('p_nome').value.trim();
        if (!nome) { toast('Nome obrigatório', 'error'); return; }
        await api.post('/api/professores', { nome, cref: document.getElementById('p_cref').value, especialidade: document.getElementById('p_esp').value, telefone: document.getElementById('p_tel').value, email: document.getElementById('p_email').value });
        closeModal(); toast('Professor cadastrado!'); renderProfessores(c);
    };

    window.salvarEditProf = async (id) => {
        await api.put(`/api/professores/${id}`, { nome: document.getElementById('p_nome').value, cref: document.getElementById('p_cref').value, especialidade: document.getElementById('p_esp').value, telefone: document.getElementById('p_tel').value, email: document.getElementById('p_email').value });
        closeModal(); toast('Professor atualizado!'); renderProfessores(c);
    };

    window.deletarProf = async (id) => {
        if (!confirm('Remover professor?')) return;
        await api.delete(`/api/professores/${id}`);
        toast('Professor removido'); renderProfessores(c);
    };
}
