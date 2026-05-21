// ─── ESTADO ────────────────────────────────────────────────────────────────────
let currentRole = null;
let currentAlunoId = null;
let currentProfId = null;
let currentAdminTab = 'dashboard';
let currentProfTab = 'treinos';
let currentAlunoTab = 'meu-perfil';

// ─── EVENT DELEGATION (CSP-friendly: zero inline handlers) ────────────────────
// Cada handler é registrado em window.actions['nome']. No HTML:
//   <button data-action="nome">...</button>
// Args podem vir em data-args='["x", 123]' (JSON), ou em data-* específicos.
// Dentro do handler, `this` é o elemento e o primeiro argumento é o Event.
window.actions = {};

function _dispatch(eventType) {
    document.addEventListener(eventType, e => {
        const el = e.target.closest('[data-action]');
        if (!el) return;
        // Forms só reagem a submit; demais elementos só reagem a click/input/change.
        const isForm = el.tagName === 'FORM';
        if (isForm && eventType !== 'submit') return;
        if (!isForm && eventType === 'submit') return;
        if (eventType === 'submit') e.preventDefault();
        const fn = window.actions[el.dataset.action];
        if (!fn) return;
        let args = [];
        if (el.dataset.args) {
            try { args = JSON.parse(el.dataset.args); }
            catch (_e) { /* ignora args malformados */ }
        }
        fn.call(el, e, ...args);
    }, true);
}

['click', 'submit', 'input', 'change'].forEach(_dispatch);

// ─── API ──────────────────────────────────────────────────────────────────────
async function apiFetch(url, opts = {}) {
    const r = await fetch(url, { credentials: 'same-origin', ...opts });
    if (r.status === 401) { logout(); throw new Error('Não autenticado'); }
    if (r.status === 403) { toast('Acesso negado para o seu perfil.', 'error'); throw new Error('Forbidden'); }
    if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const msg = body.error || `Erro ${r.status}`;
        toast(msg, 'error');
        throw new Error(msg);
    }
    return r;
}
const jsonHeaders = { 'Content-Type': 'application/json' };
const api = {
    get: url => apiFetch(url).then(r => r.json()),
    post: (url, body) => apiFetch(url, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(body) }).then(r => r.json()),
    put: (url, body) => apiFetch(url, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(body) }).then(r => r.json()),
    delete: url => apiFetch(url, { method: 'DELETE' })
};

// Helper: desabilita o botão clicado enquanto a promise roda; reabilita em qualquer caso.
async function submitting(btn, fn) {
    if (!btn || btn.disabled) return;
    const original = btn.textContent;
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
    btn.textContent = 'Salvando...';
    try { return await fn(); }
    catch (_e) { /* erro já tostado por apiFetch */ }
    finally {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor = '';
        btn.textContent = original;
    }
}

// Máscara/validação de CPF
function maskCpfInput(el) {
    el.addEventListener('input', () => {
        const d = el.value.replace(/\D/g, '').slice(0, 11);
        let out = d;
        if (d.length > 9)      out = `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
        else if (d.length > 6) out = `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
        else if (d.length > 3) out = `${d.slice(0,3)}.${d.slice(3)}`;
        el.value = out;
    });
}
function maskPhoneInput(el) {
    el.addEventListener('input', () => {
        const d = el.value.replace(/\D/g, '').slice(0, 11);
        let out = d;
        if (d.length > 10) out = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
        else if (d.length > 6) out = `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
        else if (d.length > 2) out = `(${d.slice(0,2)}) ${d.slice(2)}`;
        else if (d.length > 0) out = `(${d}`;
        el.value = out;
    });
}

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
async function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const errEl = document.getElementById('loginErr');
    errEl.textContent = '';
    const r = await fetch('/api/auth/login', {
        method: 'POST', headers: jsonHeaders, credentials: 'same-origin',
        body: JSON.stringify({ email, senha })
    });
    if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        errEl.textContent = j.error || 'Falha ao entrar';
        return;
    }
    const user = await r.json();
    enterAsUser(user);
}

async function enterAsUser(user) {
    hide('loginScreen');
    if (user.role === 'Admin') {
        currentRole = 'admin';
        show('adminDashboard');
        navTo(document.querySelector('[data-tab="dashboard"]'), 'dashboard');
    } else if (user.role === 'Professor') {
        currentRole = 'professor';
        currentProfId = user.professorId;
        show('professorDashboard');
        const profs = await api.get('/api/professores');
        const prof = profs.find(p => p.id === currentProfId);
        document.getElementById('profBadge').textContent = `🏋️ ${prof?.nome || user.nome || 'Professor'}`;
        navProf(document.querySelector('[data-ptab="treinos"]'), 'treinos');
    } else if (user.role === 'Aluno') {
        currentRole = 'aluno';
        currentAlunoId = user.alunoId;
        show('alunoDashboard');
        const alunos = await api.get('/api/alunos');
        const a = alunos.find(x => x.id === currentAlunoId);
        document.getElementById('alunoBadge').textContent = `🏅 ${a?.nome || user.nome || 'Aluno'}`;
        navAluno(document.querySelector('[data-atab="meu-perfil"]'), 'meu-perfil');
    }
}

// retomar sessão ao abrir a página
(async () => {
    try {
        const r = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (r.ok) enterAsUser(await r.json());
    } catch (_e) { /* fica na tela de login */ }
})();

function openProfessorSelect(profs) {
    const opts = profs.map(p => `<option value="${p.id}">${escape(p.nome)}</option>`).join('');
    openModal('Selecione seu perfil',
        `<div class="flex flex-col gap-1.5"><label>Você é:</label><select id="profSelModal">${opts}</select></div>`,
        `<button class="${BTN_PRI}" data-action="confirmProfLogin">Entrar</button>`
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

async function logout() {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch (_e) { /* ignore */ }
    currentRole = null; currentAlunoId = null; currentProfId = null;
    hide('adminDashboard'); hide('professorDashboard'); hide('alunoDashboard');
    show('loginScreen');
    const f = document.getElementById('loginForm'); if (f) f.reset();
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

// ─── ACTIONS (todos os handlers data-action) ──────────────────────────────────
// Cada chave aqui é referenciada via `data-action="key"` no HTML / templates.
// `this` dentro do handler é o elemento que disparou o evento.
const _num = el => Number(el.dataset.id);

Object.assign(window.actions, {
    // ── auth / nav ──
    login:                  () => doLogin(),
    logout:                 () => logout(),
    selecionarAluno:        () => selecionarAluno(),
    confirmProfLogin:       () => confirmProfLogin(),
    navAdminTab: function () { navTo(this, this.dataset.tab);  closeMobileNav('adminNav'); },
    navProfTab:  function () { navProf(this, this.dataset.ptab); closeMobileNav('profNav'); },
    navAlunoTab: function () { navAluno(this, this.dataset.atab); closeMobileNav('alunoNav'); },
    toggleMobileNav: (_e, id) => toggleMobileNav(id),
    closeModal:             () => closeModal(),
    closeModalOutside:      (e) => closeModalOutside(e),

    // ── alunos ──
    openModalCadastrarAluno: () => window.openModalCadastrarAluno(),
    editarAluno:  function () { window.editarAluno(_num(this)); },
    deletarAluno: function () { window.deletarAluno(_num(this)); },
    filtrarAlunos: () => window.filtrarAlunos(),
    submitNovoAluno: function () { submitting(this, window.salvarAluno); },
    submitEditAluno: function () {
        const id = _num(this);
        submitting(this, () => window.atualizarAluno(id));
    },
    registrarPagamentoRapido: function () {
        window.registrarPagamentoRapido(_num(this), Number(this.dataset.valor));
    },

    // ── professores ──
    openModalProf: () => window.openModalProf(),
    editarProf:  function () { window.editarProf(_num(this)); },
    deletarProf: function () { window.deletarProf(_num(this)); },
    submitNovoProf: function () { submitting(this, window.salvarNovoProf); },
    submitEditProf: function () {
        const id = _num(this);
        submitting(this, () => window.salvarEditProf(id));
    },

    // ── planos ──
    openModalPlano: () => window.openModalPlano(),
    editarPlano:  function () { window.editarPlano(_num(this)); },
    deletarPlano: function () { window.deletarPlano(_num(this)); },
    submitNovoPlano: function () { submitting(this, window.salvarNovoPlano); },
    submitEditPlano: function () {
        const id = _num(this);
        submitting(this, () => window.salvarEditPlano(id));
    },

    // ── pagamentos ──
    openModalPag:     () => window.openModalPag(),
    deletarPag:       function () { window.deletarPag(_num(this)); },
    filtrarPag:       () => window.filtrarPag(),
    autoPreencherValor: () => window.autoPreencherValor(),
    submitPagamento:  function () { submitting(this, window.salvarPagamento); },

    // ── treinos ──
    openModalTreino: function () {
        if (this.dataset.id) window.openModalTreino(_num(this));
        else                 window.openModalTreino();
    },
    deletarTreino:  function () { window.deletarTreino(_num(this)); },
    filtrarTreinos: () => window.filtrarTreinos(),
    addExercicio:   () => window.addExercicio(),
    removeExercicio: function () { window.removeExercicio(Number(this.dataset.i)); },
    submitNovoTreino: function () { submitting(this, window.salvarNovoTreino); },
    submitEditTreino: function () {
        const id = _num(this);
        submitting(this, () => window.salvarEditTreino(id));
    },

    // ── frequência ──
    openModalFreq: () => window.openModalFreq(),
    deletarFreq:   function () { window.deletarFreq(_num(this)); },
    filtrarFreq:   () => window.filtrarFreq(),
    submitFreq:    function () { submitting(this, window.salvarFreq); },

    // ── backup ──
    exportarBackup:   () => window.exportarBackup(),
    importarBackup:   function () { window.importarBackup(this); },
    confirmarRestore: () => window.confirmarRestore(),
    clearBackupLog:   () => { document.getElementById('backupLog').innerHTML = ''; },
});
