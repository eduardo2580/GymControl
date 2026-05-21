// ─── PROFESSOR PAGES ──────────────────────────────────────────────────────────
async function renderProfTab(tab) {
    const c = document.getElementById('professorContent');
    if (tab === 'treinos') await renderProfTreinos(c);
    else if (tab === 'alunos-list') await renderProfAlunos(c);
    else if (tab === 'frequencia-prof') await renderFrequenciaAdmin(c);
}

async function renderProfTreinos(c) {
    const [alunos, treinos] = await Promise.all([
        api.get('/api/alunos'),
        api.get('/api/treinos')
    ]);
    const ativos = alunos.filter(a => a.status === 'Ativo');
    const meusTreinos = currentProfId ? treinos.filter(t => t.professorId === currentProfId) : treinos;
    const grupos = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Cardio', 'Funcional'];

    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Gerenciar Treinos</div>
        <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">${meusTreinos.length} treinos cadastrados</div>
      </div>
      <button class="${BTN_PRI}" onclick="openModalTreino()">＋ Novo Treino</button>
    </div>
    ${panelPlain(`
      <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <span class="font-semibold text-[0.9rem]">Treinos</span>
        <select id="filtroAlunoTreino" onchange="filtrarTreinos()" style="margin:0;width:auto">
          <option value="">Todos os alunos</option>
          ${ativos.map(a => `<option value="${a.id}">${escape(a.nome)}</option>`).join('')}
        </select>
      </div>
      <div id="treinosList">${renderTreinosCards(meusTreinos)}</div>`)}`;

    window._treinosList = meusTreinos;
    window._alunosAtivos = ativos;

    window.filtrarTreinos = () => {
        const id = parseInt(document.getElementById('filtroAlunoTreino').value);
        const filtered = id ? meusTreinos.filter(t => t.alunoId === id) : meusTreinos;
        document.getElementById('treinosList').innerHTML = renderTreinosCards(filtered);
    };

    window.openModalTreino = (id) => {
        const t = id ? meusTreinos.find(x => x.id === id) : null;
        const exs = t ? JSON.parse(typeof t.exercicios === 'string' ? t.exercicios : JSON.stringify(t.exercicios)) : [];
        const hoje = new Date().toISOString().split('T')[0];

        openModal(t ? 'Editar Treino' : 'Novo Treino', `
      <div class="${FGRID}">
        <div class="${FG_FULL}"><label>Aluno *</label>
          <select id="tr_aluno">${ativos.map(a => `<option value="${a.id}" ${t && t.alunoId === a.id ? 'selected' : ''}>${escape(a.nome)}</option>`).join('')}</select>
        </div>
        <div class="${FG}"><label>Objetivo *</label><input id="tr_obj" value="${t ? escape(t.objetivo) : ''}"></div>
        <div class="${FG}"><label>Nível</label>
          <select id="tr_nivel">${['Iniciante', 'Intermediário', 'Avançado'].map(n => `<option ${t && t.nivel === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </div>
        <div class="${FG}"><label>Data Início</label><input type="date" id="tr_ini" value="${t ? t.dataInicio : hoje}"></div>
        <div class="${FG}"><label>Data Fim</label><input type="date" id="tr_fim" value="${t ? t.dataFim : ''}"></div>
        <div class="${FG_FULL}"><label>Observações</label><textarea id="tr_obs">${t ? escape(t.observacoes || '') : ''}</textarea></div>
      </div>
      <hr class="border-none border-t border-[var(--border)] my-5">
      <div class="flex justify-between items-center mb-2.5">
        <strong>Exercícios</strong>
        <button class="${BTN_SEC_SM}" type="button" onclick="addExercicio()">＋ Exercício</button>
      </div>
      <div class="text-[0.75rem] text-[var(--muted)] mb-2 grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-2.5 px-3.5">
        <span>Nome</span><span>Grupo Muscular</span><span>Séries</span><span>Reps</span><span>Descanso(s)</span><span></span>
      </div>
      <div id="exerciciosList">
        ${exs.map((e, i) => exercicioRow(e, i)).join('')}
      </div>`,
            `<button class="${BTN_SEC}" onclick="closeModal()">Cancelar</button>
       <button class="${BTN_PRI}" onclick="${t ? `submitting(this, () => salvarEditTreino(${id}))` : 'submitting(this, salvarNovoTreino)'}">Salvar Treino</button>`
        );
        window._exIdx = exs.length;
    };

    window.addExercicio = () => {
        document.getElementById('exerciciosList').insertAdjacentHTML('beforeend',
            exercicioRow({ nome: '', grupoMuscular: 'Peito', series: 3, repeticoes: 12, descanso: 60 }, window._exIdx || 0));
        window._exIdx = (window._exIdx || 0) + 1;
    };

    window.removeExercicio = (i) => { document.getElementById(`ex_row_${i}`)?.remove(); };

    function exercicioRow(e, i) {
        const gOpts = grupos.map(g => `<option ${e.grupoMuscular === g ? 'selected' : ''}>${g}</option>`).join('');
        return `<div class="bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3.5 mb-2.5 grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-2.5 items-center" id="ex_row_${i}">
      <input placeholder="Ex: Supino Reto" value="${escape(e.nome || '')}" data-ex-nome="${i}" style="margin:0;padding:6px 10px;font-size:0.83rem">
      <select data-ex-grupo="${i}" style="margin:0;padding:6px 10px;font-size:0.83rem">${gOpts}</select>
      <input type="number" value="${e.series || 3}" min="1" data-ex-series="${i}" style="margin:0;padding:6px 10px;font-size:0.83rem">
      <input type="number" value="${e.repeticoes || 12}" min="1" data-ex-reps="${i}" style="margin:0;padding:6px 10px;font-size:0.83rem">
      <input type="number" value="${e.descanso || 60}" min="0" data-ex-desc="${i}" style="margin:0;padding:6px 10px;font-size:0.83rem">
      <button class="${BTN_DNG_SM} px-2" type="button" onclick="removeExercicio(${i})">✕</button>
    </div>`;
    }

    function coletarExercicios() {
        return Array.from(document.querySelectorAll('.exercise-item, [id^="ex_row_"]')).map(r => ({
            nome: r.querySelector('[data-ex-nome]')?.value || '',
            grupoMuscular: r.querySelector('[data-ex-grupo]')?.value || '',
            series: parseInt(r.querySelector('[data-ex-series]')?.value || 3),
            repeticoes: parseInt(r.querySelector('[data-ex-reps]')?.value || 12),
            descanso: parseInt(r.querySelector('[data-ex-desc]')?.value || 60)
        })).filter(e => e.nome.trim());
    }

    window.salvarNovoTreino = async () => {
        const obj = document.getElementById('tr_obj').value.trim();
        if (!obj) { toast('Objetivo obrigatório', 'error'); return; }
        await api.post('/api/treinos', {
            alunoId: document.getElementById('tr_aluno').value,
            professorId: currentProfId || 1,
            objetivo: obj,
            nivel: document.getElementById('tr_nivel').value,
            dataInicio: document.getElementById('tr_ini').value,
            dataFim: document.getElementById('tr_fim').value,
            observacoes: document.getElementById('tr_obs').value,
            exercicios: coletarExercicios()
        });
        closeModal(); toast('Treino cadastrado!'); renderProfTreinos(c);
    };

    window.salvarEditTreino = async (id) => {
        await api.put(`/api/treinos/${id}`, {
            objetivo: document.getElementById('tr_obj').value,
            nivel: document.getElementById('tr_nivel').value,
            dataInicio: document.getElementById('tr_ini').value,
            dataFim: document.getElementById('tr_fim').value,
            observacoes: document.getElementById('tr_obs').value,
            exercicios: coletarExercicios()
        });
        closeModal(); toast('Treino atualizado!'); renderProfTreinos(c);
    };

    window.deletarTreino = async (id) => {
        if (!confirm('Remover treino?')) return;
        await api.delete(`/api/treinos/${id}`);
        toast('Treino removido'); renderProfTreinos(c);
    };
}

function renderTreinosCards(treinos) {
    if (!treinos.length) return emptyState('💪', 'Nenhum treino cadastrado');
    const nivelBadge = { 'Iniciante': 'blue', 'Intermediário': 'yellow', 'Avançado': 'red' };
    return `<div class="p-4 flex flex-col gap-3">` +
        treinos.map(t => {
            const exs = Array.isArray(t.exercicios) ? t.exercicios : JSON.parse(t.exercicios || '[]');
            return `<div class="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4">
        <div class="flex justify-between items-start mb-2.5">
          <div>
            <strong class="text-base">${escape(t.objetivo)}</strong>
            <div class="mt-1 flex gap-2 flex-wrap">
              <span class="text-[var(--muted)] text-[0.8rem]">👤 ${escape(t.alunoNome || '—')}</span>
              <span class="text-[var(--muted)] text-[0.8rem]">📅 ${fmtDate(t.dataInicio)} → ${fmtDate(t.dataFim)}</span>
              ${badge(t.nivel || 'Iniciante', nivelBadge[t.nivel] || 'blue')}
            </div>
          </div>
          <div class="flex gap-1.5">
            <button class="${BTN_SEC_SM}" onclick="openModalTreino(${t.id})">✏️</button>
            <button class="${BTN_DNG_SM}" onclick="deletarTreino(${t.id})">🗑️</button>
          </div>
        </div>
        ${t.observacoes ? `<p class="text-[0.82rem] text-[var(--muted)] mb-2">📝 ${escape(t.observacoes)}</p>` : ''}
        ${exs.length ? `<div class="flex gap-1.5 flex-wrap">${exs.map(e => `<span class="bg-[var(--surface)] border border-[var(--border)] rounded-md px-2 py-0.5 text-[0.75rem]">${escape(e.nome)} <span class="text-[var(--muted)]">${e.series}×${e.repeticoes}</span></span>`).join('')}</div>` : ''}
      </div>`;
        }).join('') + '</div>';
}

async function renderProfAlunos(c) {
    const alunos = await api.get('/api/alunos');
    const ativos = alunos.filter(a => a.status === 'Ativo');
    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Alunos Ativos</div>
      <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">${ativos.length} alunos</div></div>
    </div>
    ${panelPlain(`
      <div class="overflow-x-auto">
        <table>
          <thead><tr><th>Nome</th><th>Plano</th><th>Situação</th><th>Telefone</th></tr></thead>
          <tbody>${ativos.map(a => `
            <tr>
              <td><strong>${escape(a.nome)}</strong></td>
              <td>${badge(a.planoNome || '—', 'blue')}</td>
              <td>${badge(a.inadimplente ? 'Inadimplente' : 'Em dia', a.inadimplente ? 'red' : 'green')}</td>
              <td>${escape(a.telefone || '—')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`)}`;
}
