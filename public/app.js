// ─── ESTADO ────────────────────────────────────────────────────────────────────
let currentRole = null;
let currentAlunoId = null;
let currentProfId = null;
let currentAdminTab = 'dashboard';
let currentProfTab = 'treinos';
let currentAlunoTab = 'meu-perfil';

// ─── API ──────────────────────────────────────────────────────────────────────
const api = {
    get: url => fetch(url).then(r => r.json()),
    post: (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    put: (url, body) => fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    delete: url => fetch(url, { method: 'DELETE' })
};

// ─── NOTIFICAÇÃO ──────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
    const t = document.getElementById('toast');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    t.className = `toast ${type} fixed bottom-6 right-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-3.5 shadow-[var(--shadow)] z-[9999] flex items-center gap-2.5 text-[0.9rem] animate-slideUp max-w-[340px]`;
    t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    t.style.display = 'flex';
    setTimeout(() => { t.style.display = 'none'; }, 3500);
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModal(title, bodyHTML, footerHTML = '') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalFooter').innerHTML = footerHTML;
    const overlay = document.getElementById('modalOverlay');
    overlay.style.display = 'flex';
    overlay.style.setProperty('display', 'flex', 'important');
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.style.setProperty('display', 'none', 'important');
}
function closeModalOutside(e) { if (e.target.id === 'modalOverlay') closeModal(); }

function toggleMobileNav(id) {
    const nav = document.getElementById(id);
    if (!nav) return;
    nav.classList.toggle('hidden');
    nav.classList.toggle('open');
}

function closeMobileNav(id) {
    const nav = document.getElementById(id);
    if (!nav) return;
    if (!nav.classList.contains('hidden')) {
        nav.classList.add('hidden');
        nav.classList.remove('open');
    }
}

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────
function fmtDate(d) { if (!d) return '—'; return d.split('-').reverse().join('/'); }
function fmtMoney(v) { return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ','); }
function fmtYM(ym) { if (!ym) return '—'; const [y, m] = ym.split('-'); const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']; return `${months[parseInt(m) - 1]}/${y}`; }
function badge(txt, cls) { return `<span class="badge badge-${cls} inline-block px-2 py-0.5 rounded-full text-[0.72rem] font-semibold tracking-[0.3px] uppercase">${txt}</span>`; }
function escape(s) { return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// classes de botão compartilhadas
const BTN = `inline-flex items-center gap-1.5 rounded-lg border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] px-4 py-2.5 font-semibold cursor-pointer transition duration-200 ease-out hover:-translate-y-px`;
const BTN_SM = `inline-flex items-center gap-1.5 rounded-lg border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] px-3 py-1.5 text-[0.78rem] font-semibold cursor-pointer transition duration-200 ease-out hover:-translate-y-px`;
const BTN_PRI = `${BTN} bg-[var(--accent)] text-[#0d0f14] border-none`;
const BTN_SEC = `${BTN}`;
const BTN_SEC_SM = `${BTN_SM}`;
const BTN_DNG_SM = `${BTN_SM} bg-[rgba(239,68,68,0.15)] text-[var(--red)] border-[rgba(239,68,68,0.2)]`;
const BTN_SUC_SM = `${BTN_SM} bg-[rgba(34,197,94,0.15)] text-[var(--green)] border-[rgba(34,197,94,0.2)]`;

// auxiliares HTML de painel/cartão compartilhados
const panel = (header, body) =>
    `<div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden mb-5">
     <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">${header}</div>
     ${body}
   </div>`;

const panelPlain = (content) =>
    `<div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden mb-5">${content}</div>`;

const emptyState = (icon, msg) =>
    `<div class="text-center py-10 px-5 text-[var(--muted)]"><div class="text-4xl mb-2.5">${icon}</div><p class="text-[0.9rem]">${msg}</p></div>`;

// ─── LOGIN / LOGOUT ───────────────────────────────────────────────────────────
async function login(role) {
    currentRole = role;
    hide('loginScreen');
    if (role === 'admin') {
        show('adminDashboard');
        navTo(document.querySelector('[data-tab="dashboard"]'), 'dashboard');
    } else if (role === 'professor') {
        show('professorDashboard');
        const profs = await api.get('/api/professores');
        if (!profs.length) { toast('Nenhum professor cadastrado. Peça ao admin.', 'info'); return; }
        openProfessorSelect(profs);
    } else if (role === 'aluno') {
        show('alunoDashboard');
        const alunos = await api.get('/api/alunos');
        const sel = document.getElementById('alunoSelect');
        sel.innerHTML = '<option value="">-- Selecione seu nome --</option>' +
            alunos.filter(a => a.status === 'Ativo').map(a => `<option value="${a.id}">${escape(a.nome)}</option>`).join('');
    }
}

function openProfessorSelect(profs) {
    const opts = profs.map(p => `<option value="${p.id}">${escape(p.nome)}</option>`).join('');
    openModal('Selecione seu perfil',
        `<div class="flex flex-col gap-1.5"><label>Você é:</label><select id="profSelModal">${opts}</select></div>`,
        `<button class="${BTN_PRI}" onclick="confirmProfLogin()">Entrar</button>`
    );
}

async function confirmProfLogin() {
    currentProfId = parseInt(document.getElementById('profSelModal').value);
    const profs = await api.get('/api/professores');
    const prof = profs.find(p => p.id === currentProfId);
    document.getElementById('profBadge').textContent = `🏋️ ${prof?.nome || 'Professor'}`;
    closeModal();
    navProf(document.querySelector('[data-ptab="treinos"]'), 'treinos');
}

async function selecionarAluno() {
    currentAlunoId = parseInt(document.getElementById('alunoSelect').value) || null;
    if (!currentAlunoId) return;
    const alunos = await api.get('/api/alunos');
    const a = alunos.find(x => x.id === currentAlunoId);
    document.getElementById('alunoBadge').textContent = `🏅 ${a?.nome || 'Aluno'}`;
    navAluno(document.querySelector('[data-atab="meu-perfil"]'), 'meu-perfil');
}

function logout() {
    currentRole = null; currentAlunoId = null; currentProfId = null;
    hide('adminDashboard'); hide('professorDashboard'); hide('alunoDashboard');
    show('loginScreen');
}

function show(id) { document.getElementById(id).style.display = 'block'; }
function hide(id) { document.getElementById(id).style.display = 'none'; }

// ─── NAV ──────────────────────────────────────────────────────────────────────
function navTo(el, tab) {
    document.querySelectorAll('#adminDashboard .nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    currentAdminTab = tab;
    renderAdminTab(tab);
}

function navProf(el, tab) {
    document.querySelectorAll('#professorDashboard .nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    currentProfTab = tab;
    renderProfTab(tab);
}

function navAluno(el, tab) {
    document.querySelectorAll('#alunoDashboard .nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    currentAlunoTab = tab;
    renderAlunoTab(tab);
}

// ─── ADMIN ROUTER ─────────────────────────────────────────────────────────────
async function renderAdminTab(tab) {
    const c = document.getElementById('adminContent');
    const tabs = {
        dashboard: renderDashboard,
        alunos: renderAlunos,
        professores: renderProfessores,
        planos: renderPlanos,
        pagamentos: renderPagamentos,
        inadimplentes: renderInadimplentes,
        frequencia: renderFrequenciaAdmin,
        relatorios: renderRelatorios,
        backup: renderBackup
    };
    if (tabs[tab]) await tabs[tab](c);
}

// ─── REUSABLE FORM GRID HTML ──────────────────────────────────────────────────
const FG = `flex flex-col gap-1.5`; // form-group
const FG_FULL = `flex flex-col gap-1.5 col-span-full`; // form-group full
const FGRID = `grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5`; // form-grid

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
        <div class="${FG}"><label>CPF</label><input id="m_cpf" placeholder="000.000.000-00"></div>
        <div class="${FG}"><label>Telefone</label><input id="m_tel" placeholder="(11) 9xxxx-xxxx"></div>
        <div class="${FG}"><label>Data de Nascimento</label><input type="date" id="m_nasc"></div>
        <div class="${FG}"><label>Plano *</label><select id="m_plano">${planoOpts}</select></div>
        <div class="${FG_FULL}"><label>Observações</label><textarea id="m_obs" placeholder="Notas opcionais"></textarea></div>
      </div>`,
            `<button class="${BTN_SEC}" onclick="closeModal()">Cancelar</button>
       <button class="${BTN_PRI}" onclick="salvarAluno()">Cadastrar</button>`
        );
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
       <button class="${BTN_PRI}" onclick="atualizarAluno(${id})">Salvar</button>`
        );
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
       <button class="${BTN_PRI}" onclick="${p ? `salvarEditProf(${id})` : 'salvarNovoProf()'}">Salvar</button>`
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

// ─── PLANOS ───────────────────────────────────────────────────────────────────
async function renderPlanos(c) {
    const planos = await api.get('/api/planos');
    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Planos</div>
        <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">Gerenciar planos de assinatura</div>
      </div>
      <button class="${BTN_PRI}" onclick="openModalPlano()">＋ Novo Plano</button>
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
                <button class="${BTN_SEC_SM}" onclick="editarPlano(${p.id})">✏️</button>
                <button class="${BTN_DNG_SM}" onclick="deletarPlano(${p.id})">🗑️</button>
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
            `<button class="${BTN_SEC}" onclick="closeModal()">Cancelar</button>
       <button class="${BTN_PRI}" onclick="${p ? `salvarEditPlano(${id})` : 'salvarNovoPlano()'}">Salvar</button>`
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
       <button class="${BTN_PRI}" onclick="salvarPagamento()">Registrar</button>`
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
            const txt = r.textContent.toLowerCase();
            const mesMatch = !mes || txt.includes(mes.replace('-', '/')) || txt.includes(mes);
            r.style.display = (mesMatch && txt.includes(q)) ? '' : 'none';
        });
    };
}

function pagRows(pags) {
    if (!pags.length) return `<tr><td colspan="7">${emptyState('💵', 'Nenhum pagamento')}</td></tr>`;
    return pags.map(p => `
    <tr>
      <td><strong>${escape(p.alunoNome || '—')}</strong></td>
      <td>${badge(fmtYM(p.referenciaMensal), 'blue')}</td>
      <td class="text-[var(--accent)] font-bold">${fmtMoney(p.valor)}</td>
      <td>${fmtDate(p.dataPagamento)}</td>
      <td class="text-[var(--muted)]">${escape(p.metodoPagamento || '—')}</td>
      <td>${badge(p.status || 'Pago', 'green')}</td>
      <td><button class="${BTN_DNG_SM}" onclick="deletarPag(${p.id})">🗑️</button></td>
    </tr>`).join('');
}

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
                <td><button class="${BTN_SUC_SM}" onclick="registrarPagamentoRapido(${a.id},${plano?.valor || 0})">💵 Registrar Pgto</button></td>
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
      <button class="${BTN_PRI}" onclick="openModalFreq()">＋ Registrar Check-in</button>
    </div>
    ${panelPlain(`
      <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <span class="font-semibold text-[0.9rem]">Histórico de Frequência</span>
        <input type="date" id="filtroData" value="${hoje}" oninput="filtrarFreq()" style="margin:0;width:auto">
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
            `<button class="${BTN_SEC}" onclick="closeModal()">Cancelar</button>
       <button class="${BTN_PRI}" onclick="salvarFreq()">Registrar</button>`
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
      <td><button class="${BTN_DNG_SM}" onclick="deletarFreq(${f.id})">🗑️</button></td>
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

// ─── BACKUP ───────────────────────────────────────────────────────────────────
async function renderBackup(c) {
    c.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><div class="font-bebas text-[1.8rem] tracking-[2px] text-[var(--text)]">Backup & Restore</div>
      <div class="text-[var(--muted)] text-[0.82rem] mt-0.5">Exportar e restaurar dados do sistema</div></div>
    </div>
    <div class="grid grid-cols-2 gap-5">
      <div class="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-6 text-center">
        <div class="text-4xl mb-3">📦</div>
        <h3 class="text-base font-semibold mb-1.5">Exportar Backup</h3>
        <p class="text-[0.82rem] text-[var(--muted)] mb-4">Baixar todos os dados do sistema em formato JSON. Use para criar backups manuais ou migrar dados.</p>
        <button class="${BTN_PRI}" onclick="exportarBackup()">⬇️ Baixar Backup JSON</button>
      </div>
      <div class="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-6 text-center">
        <div class="text-4xl mb-3">🔄</div>
        <h3 class="text-base font-semibold mb-1.5">Restaurar Backup</h3>
        <p class="text-[0.82rem] text-[var(--muted)] mb-4">Importar um arquivo JSON de backup para restaurar os dados. <strong>Atenção: isso substituirá todos os dados atuais!</strong></p>
        <label class="${BTN_SEC} cursor-pointer">
          📂 Selecionar arquivo JSON
          <input type="file" accept=".json" class="hidden" onchange="importarBackup(this)">
        </label>
      </div>
    </div>
    <div id="backupLog" class="mt-5"></div>`;

    window.exportarBackup = async () => {
        const data = await fetch('/api/backup').then(r => r.blob());
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gymcontrol-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Backup exportado com sucesso!');
    };

    window.importarBackup = async (input) => {
        const file = input.files[0];
        if (!file) return;
        const log = document.getElementById('backupLog');
        log.innerHTML = panelPlain(`<div class="p-5"><p>⏳ Lendo arquivo...</p></div>`);
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            log.innerHTML = panelPlain(`<div class="p-5">
            <p class="mb-3">📋 Arquivo: <strong>${escape(file.name)}</strong></p>
            <p>Exportado em: ${json.exportedAt ? fmtDate(json.exportedAt.split('T')[0]) : '—'}</p>
            <p>Alunos: ${json.alunos?.length || 0} | Professores: ${json.professores?.length || 0} | Planos: ${json.planos?.length || 0}</p>
            <p>Pagamentos: ${json.pagamentos?.length || 0} | Treinos: ${json.treinos?.length || 0} | Frequências: ${json.frequencias?.length || 0}</p>
            <hr class="border-none border-t border-[var(--border)] my-5">
            <p class="text-[var(--red)] mb-3.5">⚠️ Esta ação substituirá <strong>todos</strong> os dados atuais!</p>
            <button class="${BTN_DNG_SM.replace('btn-sm', '')}" onclick="confirmarRestore()">🔄 Confirmar Restauração</button>
            <button class="${BTN_SEC}" style="margin-left:8px" onclick="document.getElementById('backupLog').innerHTML=''">Cancelar</button>
          </div>`);
            window._pendingRestore = json;
        } catch (e) {
            log.innerHTML = panelPlain(`<div class="p-5"><p class="text-[var(--red)]">❌ Arquivo inválido: ${e.message}</p></div>`);
        }
    };

    window.confirmarRestore = async () => {
        const log = document.getElementById('backupLog');
        log.innerHTML = panelPlain(`<div class="p-5"><p>⏳ Restaurando...</p></div>`);
        const result = await api.post('/api/restore', window._pendingRestore);
        if (result.success) {
            toast('Backup restaurado com sucesso!');
            log.innerHTML = panelPlain(`<div class="p-5"><p class="text-[var(--green)]">✅ ${result.message}</p></div>`);
        } else {
          toast('Erro ao restaurar: ' + result.error, 'error');
          log.innerHTML = panelPlain(`<div class="p-5"><p class="text-[var(--red)]">❌ ${result.error}</p></div>`);
        }
    };
}

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
       <button class="${BTN_PRI}" onclick="${t ? `salvarEditTreino(${id})` : 'salvarNovoTreino()'}">Salvar Treino</button>`
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