// ─── ALUNOS ───────────────────────────────────────────────────────────────────
async function renderAlunos(c) {
    const [alunos, planos] = await Promise.all([api.get('/api/alunos'), api.get('/api/planos')]);
    const planoOpts = planos.map(p => `<option value="${p.id}">${escape(p.nome)} — ${fmtMoney(p.valor)}</option>`).join('');

    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Alunos</div>
        <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">${alunos.length} cadastrados</div>
      </div>
      <button class="${BTN_PRI}" onclick="openModalCadastrarAluno()">＋ Novo Aluno</button>
    </div>
    ${panelPlain(`
      <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <span class="font-semibold text-[0.9rem]">Lista de Alunos</span>
        <input id="searchAluno" placeholder="🔍 Buscar..." oninput="filtrarAlunos()"
               class="max-w-[200px]" style="margin:0">
      </div>
      <div class="overflow-x-auto">
        <table id="alunosTable">
          <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>Plano</th><th>Status</th><th>Situação</th><th>Ações</th></tr></thead>
          <tbody>${alunosRows(alunos)}</tbody>
        </table>
      </div>`)}`;

    window._alunosList = alunos;
    window._planosOpts = planoOpts;

    window.openModalCadastrarAluno = () => {
        openModal('Cadastrar Aluno', `
      <div class="${FGRID}">
        <div class="${FG_FULL}"><label>Nome completo *</label><input id="m_nome" placeholder="Nome"></div>
        <div class="${FG}"><label>CPF *</label><input id="m_cpf" placeholder="000.000.000-00" inputmode="numeric" maxlength="14"></div>
        <div class="${FG}"><label>Telefone</label><input id="m_tel" placeholder="(11) 9xxxx-xxxx" inputmode="numeric" maxlength="15"></div>
        <div class="${FG}"><label>Data de Nascimento</label><input type="date" id="m_nasc"></div>
        <div class="${FG}"><label>Plano *</label><select id="m_plano">${planoOpts}</select></div>
        <div class="${FG_FULL}"><label>Observações</label><textarea id="m_obs" placeholder="Notas opcionais"></textarea></div>
      </div>`,
            `<button class="${BTN_SEC}" onclick="closeModal()">Cancelar</button>
       <button class="${BTN_PRI}" onclick="submitting(this, salvarAluno)">Cadastrar</button>`
        );
        maskCpfInput(document.getElementById('m_cpf'));
        maskPhoneInput(document.getElementById('m_tel'));
    };

    window.editarAluno = (id) => {
        const a = window._alunosList.find(x => x.id === id);
        if (!a) return;
        openModal('Editar Aluno', `
      <div class="${FGRID}">
        <div class="${FG_FULL}"><label>Nome *</label><input id="e_nome" value="${escape(a.nome)}"></div>
        <div class="${FG}"><label>CPF</label><input id="e_cpf" value="${escape(a.cpf || '')}"></div>
        <div class="${FG}"><label>Telefone</label><input id="e_tel" value="${escape(a.telefone || '')}"></div>
        <div class="${FG}"><label>Nascimento</label><input type="date" id="e_nasc" value="${a.dataNascimento || ''}"></div>
        <div class="${FG}"><label>Plano</label><select id="e_plano">${planos.map(p => `<option value="${p.id}" ${p.id === a.planoId ? 'selected' : ''}>${escape(p.nome)}</option>`).join('')}</select></div>
        <div class="${FG}"><label>Status</label><select id="e_status"><option ${a.status === 'Ativo' ? 'selected' : ''}>Ativo</option><option ${a.status === 'Inativo' ? 'selected' : ''}>Inativo</option></select></div>
        <div class="${FG_FULL}"><label>Observações</label><textarea id="e_obs">${escape(a.observacoes || '')}</textarea></div>
      </div>`,
            `<button class="${BTN_SEC}" onclick="closeModal()">Cancelar</button>
       <button class="${BTN_PRI}" onclick="submitting(this, () => atualizarAluno(${id}))">Salvar</button>`
        );
        maskCpfInput(document.getElementById('e_cpf'));
        maskPhoneInput(document.getElementById('e_tel'));
    };

    window.deletarAluno = async (id) => {
        if (!confirm('Remover este aluno? Esta ação não pode ser desfeita.')) return;
        await api.delete(`/api/alunos/${id}`);
        toast('Aluno removido');
        renderAlunos(c);
    };

    window.salvarAluno = async () => {
        const nome = document.getElementById('m_nome').value.trim();
        if (!nome) { toast('Nome é obrigatório', 'error'); return; }
        await api.post('/api/alunos', {
            nome, cpf: document.getElementById('m_cpf').value,
            telefone: document.getElementById('m_tel').value,
            dataNascimento: document.getElementById('m_nasc').value,
            planoId: document.getElementById('m_plano').value,
            observacoes: document.getElementById('m_obs').value
        });
        closeModal(); toast('Aluno cadastrado!'); renderAlunos(c);
    };

    window.atualizarAluno = async (id) => {
        const a = window._alunosList.find(x => x.id === id);
        await api.put(`/api/alunos/${id}`, {
            nome: document.getElementById('e_nome').value,
            cpf: document.getElementById('e_cpf').value,
            telefone: document.getElementById('e_tel').value,
            dataNascimento: document.getElementById('e_nasc').value,
            status: document.getElementById('e_status').value,
            planoId: document.getElementById('e_plano').value,
            observacoes: document.getElementById('e_obs').value,
            dataInicioPlano: a.dataInicioPlano
        });
        closeModal(); toast('Aluno atualizado!'); renderAlunos(c);
    };

    window.filtrarAlunos = () => {
        const q = document.getElementById('searchAluno').value.toLowerCase();
        document.querySelectorAll('#alunosTable tbody tr').forEach(r => {
            r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    };
}

function alunosRows(alunos) {
    if (!alunos.length) return `<tr><td colspan="7">${emptyState('👥', 'Nenhum aluno cadastrado')}</td></tr>`;
    return alunos.map(a => `
    <tr class="${a.inadimplente && a.status === 'Ativo' ? 'inadimplente-row' : ''}">
      <td><strong>${escape(a.nome)}</strong></td>
      <td class="text-[var(--muted)]">${escape(a.cpf || '—')}</td>
      <td>${escape(a.telefone || '—')}</td>
      <td>${badge(a.planoNome || '—', 'blue')}</td>
      <td>${badge(a.status, a.status === 'Ativo' ? 'green' : 'gray')}</td>
      <td>${a.status === 'Ativo' ? badge(a.inadimplente ? 'Inadimplente' : 'Em dia', a.inadimplente ? 'red' : 'green') : '—'}</td>
      <td class="flex gap-1.5">
        <button class="${BTN_SEC_SM}" onclick="editarAluno(${a.id})">✏️</button>
        <button class="${BTN_DNG_SM}" onclick="deletarAluno(${a.id})">🗑️</button>
      </td>
    </tr>`).join('');
}
