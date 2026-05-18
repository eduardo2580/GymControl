// ─── STATE ────────────────────────────────────────────────────────────────────
let currentRole = null;
let currentAlunoId = null;
let currentProfId = null;
let currentAdminTab = 'dashboard';
let currentProfTab = 'treinos';
let currentAlunoTab = 'meu-perfil';

// ─── API ──────────────────────────────────────────────────────────────────────
const api = {
  get: url => fetch(url).then(r => r.json()),
  post: (url, body) => fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json()),
  put: (url, body) => fetch(url, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json()),
  delete: url => fetch(url, { method:'DELETE' })
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
function toast(msg, type='success') {
  const t = document.getElementById('toast');
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  t.style.display = 'flex';
  setTimeout(() => { t.style.display = 'none'; }, 3500);
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModal(title, bodyHTML, footerHTML='') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalFooter').innerHTML = footerHTML;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }
function closeModalOutside(e) { if (e.target.id === 'modalOverlay') closeModal(); }

// ─── UTILS ────────────────────────────────────────────────────────────────────
function fmtDate(d) { if (!d) return '—'; return d.split('-').reverse().join('/'); }
function fmtMoney(v) { return 'R$ ' + Number(v||0).toFixed(2).replace('.',','); }
function fmtYM(ym) { if (!ym) return '—'; const [y,m] = ym.split('-'); const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; return `${months[parseInt(m)-1]}/${y}`; }
function badge(txt, cls) { return `<span class="badge badge-${cls}">${txt}</span>`; }
function escape(s) { return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

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
    // Let professor select themselves
    openProfessorSelect(profs);
  } else if (role === 'aluno') {
    show('alunoDashboard');
    const alunos = await api.get('/api/alunos');
    const sel = document.getElementById('alunoSelect');
    sel.innerHTML = '<option value="">-- Selecione seu nome --</option>' +
      alunos.filter(a=>a.status==='Ativo').map(a=>`<option value="${a.id}">${escape(a.nome)}</option>`).join('');
  }
}

function openProfessorSelect(profs) {
  const opts = profs.map(p=>`<option value="${p.id}">${escape(p.nome)}</option>`).join('');
  openModal('Selecione seu perfil',
    `<div class="form-group"><label>Você é:</label><select id="profSelModal">${opts}</select></div>`,
    `<button class="btn btn-primary" onclick="confirmProfLogin()">Entrar</button>`
  );
}

async function confirmProfLogin() {
  currentProfId = parseInt(document.getElementById('profSelModal').value);
  const profs = await api.get('/api/professores');
  const prof = profs.find(p=>p.id===currentProfId);
  document.getElementById('profBadge').textContent = `🏋️ ${prof?.nome || 'Professor'}`;
  closeModal();
  navProf(document.querySelector('[data-ptab="treinos"]'), 'treinos');
}

async function selecionarAluno() {
  currentAlunoId = parseInt(document.getElementById('alunoSelect').value) || null;
  if (!currentAlunoId) return;
  const alunos = await api.get('/api/alunos');
  const a = alunos.find(x=>x.id===currentAlunoId);
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
  document.querySelectorAll('#adminDashboard .nav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  currentAdminTab = tab;
  renderAdminTab(tab);
}

function navProf(el, tab) {
  document.querySelectorAll('#professorDashboard .nav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  currentProfTab = tab;
  renderProfTab(tab);
}

function navAluno(el, tab) {
  document.querySelectorAll('#alunoDashboard .nav-item').forEach(n=>n.classList.remove('active'));
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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function renderDashboard(c) {
  const [dash, receita] = await Promise.all([
    api.get('/api/relatorios/dashboard'),
    api.get('/api/relatorios/receita-mensal')
  ]);

  const maxR = Math.max(...receita.map(r=>r.total), 1);
  const barHTML = receita.slice(-8).map(r => `
    <div class="chart-bar-wrap">
      <div class="chart-bar" style="height:${Math.round((r.total/maxR)*100)}px" title="${fmtMoney(r.total)}"></div>
      <span class="chart-label">${fmtYM(r.mes)}</span>
    </div>`).join('');

  c.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Dashboard</div><div class="page-subtitle">Visão geral da academia</div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card yellow"><div class="stat-icon">👥</div><div class="stat-value">${dash.totalAlunos}</div><div class="stat-label">Total de Alunos</div></div>
      <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${dash.ativos}</div><div class="stat-label">Alunos Ativos</div></div>
      <div class="stat-card red"><div class="stat-icon">⚠️</div><div class="stat-value">${dash.inadimplentes}</div><div class="stat-label">Inadimplentes</div></div>
      <div class="stat-card blue"><div class="stat-icon">📅</div><div class="stat-value">${dash.checkins}</div><div class="stat-label">Check-ins (30d)</div></div>
      <div class="stat-card orange"><div class="stat-icon">💵</div><div class="stat-value" style="font-size:1.3rem">${fmtMoney(dash.receitaMes)}</div><div class="stat-label">Receita do Mês</div></div>
      <div class="stat-card green"><div class="stat-icon">💰</div><div class="stat-value" style="font-size:1.3rem">${fmtMoney(dash.receitaTotal)}</div><div class="stat-label">Receita Total</div></div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">📈 Receita Mensal</span></div>
      <div class="panel-body">
        ${receita.length ? `<div class="chart-bars">${barHTML}</div>` : '<div class="empty-state"><p>Sem dados de receita</p></div>'}
      </div>
    </div>`;
}

// ─── ALUNOS ───────────────────────────────────────────────────────────────────
async function renderAlunos(c) {
  const [alunos, planos] = await Promise.all([api.get('/api/alunos'), api.get('/api/planos')]);
  const planoOpts = planos.map(p=>`<option value="${p.id}">${escape(p.nome)} — ${fmtMoney(p.valor)}</option>`).join('');

  c.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Alunos</div><div class="page-subtitle">${alunos.length} cadastrados</div></div>
      <button class="btn btn-primary" onclick="openModalCadastrarAluno()">＋ Novo Aluno</button>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Lista de Alunos</span>
        <div class="search-bar" style="margin:0"><input id="searchAluno" placeholder="🔍 Buscar..." oninput="filtrarAlunos()" style="max-width:200px;margin:0"></div>
      </div>
      <div class="table-wrap">
        <table id="alunosTable">
          <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>Plano</th><th>Status</th><th>Situação</th><th>Ações</th></tr></thead>
          <tbody>${alunosRows(alunos)}</tbody>
        </table>
      </div>
    </div>`;

  window._alunosList = alunos;
  window._planosOpts = planoOpts;

  window.openModalCadastrarAluno = () => {
    openModal('Cadastrar Aluno', `
      <div class="form-grid">
        <div class="form-group full"><label>Nome completo *</label><input id="m_nome" placeholder="Nome"></div>
        <div class="form-group"><label>CPF</label><input id="m_cpf" placeholder="000.000.000-00"></div>
        <div class="form-group"><label>Telefone</label><input id="m_tel" placeholder="(11) 9xxxx-xxxx"></div>
        <div class="form-group"><label>Data de Nascimento</label><input type="date" id="m_nasc"></div>
        <div class="form-group"><label>Plano *</label><select id="m_plano">${planoOpts}</select></div>
        <div class="form-group full"><label>Observações</label><textarea id="m_obs" placeholder="Notas opcionais"></textarea></div>
      </div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="salvarAluno()">Cadastrar</button>`
    );
  };

  window.editarAluno = (id) => {
    const a = window._alunosList.find(x=>x.id===id);
    if (!a) return;
    openModal('Editar Aluno', `
      <div class="form-grid">
        <div class="form-group full"><label>Nome *</label><input id="e_nome" value="${escape(a.nome)}"></div>
        <div class="form-group"><label>CPF</label><input id="e_cpf" value="${escape(a.cpf||'')}"></div>
        <div class="form-group"><label>Telefone</label><input id="e_tel" value="${escape(a.telefone||'')}"></div>
        <div class="form-group"><label>Nascimento</label><input type="date" id="e_nasc" value="${a.dataNascimento||''}"></div>
        <div class="form-group"><label>Plano</label><select id="e_plano">${planos.map(p=>`<option value="${p.id}" ${p.id===a.planoId?'selected':''}>${escape(p.nome)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Status</label><select id="e_status"><option ${a.status==='Ativo'?'selected':''}>Ativo</option><option ${a.status==='Inativo'?'selected':''}>Inativo</option></select></div>
        <div class="form-group full"><label>Observações</label><textarea id="e_obs">${escape(a.observacoes||'')}</textarea></div>
      </div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="atualizarAluno(${id})">Salvar</button>`
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
    if (!nome) { toast('Nome é obrigatório','error'); return; }
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
    const a = window._alunosList.find(x=>x.id===id);
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
    const rows = document.querySelectorAll('#alunosTable tbody tr');
    rows.forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
}

function alunosRows(alunos) {
  if (!alunos.length) return '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👥</div><p>Nenhum aluno cadastrado</p></div></td></tr>';
  return alunos.map(a => `
    <tr class="${a.inadimplente && a.status==='Ativo' ? 'inadimplente-row' : ''}">
      <td><strong>${escape(a.nome)}</strong></td>
      <td class="text-muted">${escape(a.cpf||'—')}</td>
      <td>${escape(a.telefone||'—')}</td>
      <td>${badge(a.planoNome||'—','blue')}</td>
      <td>${badge(a.status, a.status==='Ativo'?'green':'gray')}</td>
      <td>${a.status==='Ativo' ? badge(a.inadimplente?'Inadimplente':'Em dia', a.inadimplente?'red':'green') : '—'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" onclick="editarAluno(${a.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deletarAluno(${a.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

// ─── PROFESSORES ─────────────────────────────────────────────────────────────
async function renderProfessores(c) {
  const profs = await api.get('/api/professores');
  c.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Professores</div><div class="page-subtitle">${profs.length} cadastrados</div></div>
      <button class="btn btn-primary" onclick="openModalProf()">＋ Novo Professor</button>
    </div>
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>CREF</th><th>Especialidade</th><th>Telefone</th><th>Email</th><th>Ações</th></tr></thead>
          <tbody>${profs.length ? profs.map(p=>`
            <tr>
              <td><strong>${escape(p.nome)}</strong></td>
              <td>${badge(p.cref||'—','yellow')}</td>
              <td>${escape(p.especialidade||'—')}</td>
              <td>${escape(p.telefone||'—')}</td>
              <td class="text-muted">${escape(p.email||'—')}</td>
              <td style="display:flex;gap:6px">
                <button class="btn btn-secondary btn-sm" onclick="editarProf(${p.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deletarProf(${p.id})">🗑️</button>
              </td>
            </tr>`).join('') :
            '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🏋️</div><p>Nenhum professor cadastrado</p></div></td></tr>'
          }</tbody>
        </table>
      </div>
    </div>`;

  window._profsList = profs;

  window.openModalProf = (id) => {
    const p = id ? profs.find(x=>x.id===id) : null;
    openModal(p ? 'Editar Professor' : 'Cadastrar Professor', `
      <div class="form-grid">
        <div class="form-group full"><label>Nome *</label><input id="p_nome" value="${p?escape(p.nome):''}"></div>
        <div class="form-group"><label>CREF</label><input id="p_cref" value="${p?escape(p.cref||''):''}"></div>
        <div class="form-group"><label>Especialidade</label><input id="p_esp" value="${p?escape(p.especialidade||''):''}"></div>
        <div class="form-group"><label>Telefone</label><input id="p_tel" value="${p?escape(p.telefone||''):''}"></div>
        <div class="form-group"><label>Email</label><input id="p_email" type="email" value="${p?escape(p.email||''):''}"></div>
      </div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="${p?`salvarEditProf(${id})`:'salvarNovoProf()'}">Salvar</button>`
    );
  };

  window.editarProf = (id) => window.openModalProf(id);

  window.salvarNovoProf = async () => {
    const nome = document.getElementById('p_nome').value.trim();
    if (!nome) { toast('Nome obrigatório','error'); return; }
    await api.post('/api/professores', { nome, cref:document.getElementById('p_cref').value, especialidade:document.getElementById('p_esp').value, telefone:document.getElementById('p_tel').value, email:document.getElementById('p_email').value });
    closeModal(); toast('Professor cadastrado!'); renderProfessores(c);
  };

  window.salvarEditProf = async (id) => {
    await api.put(`/api/professores/${id}`, { nome:document.getElementById('p_nome').value, cref:document.getElementById('p_cref').value, especialidade:document.getElementById('p_esp').value, telefone:document.getElementById('p_tel').value, email:document.getElementById('p_email').value });
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
    <div class="page-header">
      <div><div class="page-title">Planos</div><div class="page-subtitle">Gerenciar planos de assinatura</div></div>
      <button class="btn btn-primary" onclick="openModalPlano()">＋ Novo Plano</button>
    </div>
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Valor</th><th>Duração</th><th>Descrição</th><th>Ações</th></tr></thead>
          <tbody>${planos.length ? planos.map(p=>`
            <tr>
              <td><strong>${escape(p.nome)}</strong></td>
              <td class="text-accent" style="font-weight:700">${fmtMoney(p.valor)}</td>
              <td>${p.duracaoMeses === 1 ? 'Mensal' : `${p.duracaoMeses} meses`}</td>
              <td class="text-muted">${escape(p.descricao||'—')}</td>
              <td style="display:flex;gap:6px">
                <button class="btn btn-secondary btn-sm" onclick="editarPlano(${p.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deletarPlano(${p.id})">🗑️</button>
              </td>
            </tr>`).join('') :
            '<tr><td colspan="5"><div class="empty-state"><p>Nenhum plano cadastrado</p></div></td></tr>'
          }</tbody>
        </table>
      </div>
    </div>`;

  window._planosList = planos;

  window.openModalPlano = (id) => {
    const p = id ? planos.find(x=>x.id===id) : null;
    openModal(p ? 'Editar Plano' : 'Novo Plano', `
      <div class="form-grid">
        <div class="form-group"><label>Nome *</label><input id="pl_nome" value="${p?escape(p.nome):''}"></div>
        <div class="form-group"><label>Valor (R$) *</label><input id="pl_valor" type="number" step="0.01" value="${p?p.valor:''}"></div>
        <div class="form-group"><label>Duração (meses)</label><input id="pl_dur" type="number" value="${p?p.duracaoMeses:1}"></div>
        <div class="form-group full"><label>Descrição</label><input id="pl_desc" value="${p?escape(p.descricao||''):''}"></div>
      </div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="${p?`salvarEditPlano(${id})`:'salvarNovoPlano()'}">Salvar</button>`
    );
  };

  window.editarPlano = (id) => window.openModalPlano(id);

  window.salvarNovoPlano = async () => {
    const nome = document.getElementById('pl_nome').value.trim();
    if (!nome) { toast('Nome obrigatório','error'); return; }
    await api.post('/api/planos', { nome, valor:document.getElementById('pl_valor').value, duracaoMeses:document.getElementById('pl_dur').value, descricao:document.getElementById('pl_desc').value });
    closeModal(); toast('Plano criado!'); renderPlanos(c);
  };

  window.salvarEditPlano = async (id) => {
    await api.put(`/api/planos/${id}`, { nome:document.getElementById('pl_nome').value, valor:document.getElementById('pl_valor').value, duracaoMeses:document.getElementById('pl_dur').value, descricao:document.getElementById('pl_desc').value });
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

  const alunoOpts = alunos.map(a=>`<option value="${a.id}">${escape(a.nome)}</option>`).join('');
  const hoje = new Date().toISOString().split('T')[0];
  const mesAtual = hoje.substring(0,7);

  c.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Pagamentos</div><div class="page-subtitle">${pags.length} registros</div></div>
      <button class="btn btn-primary" onclick="openModalPag()">＋ Registrar Pagamento</button>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Histórico de Pagamentos</span>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="month" id="filtroMes" value="${mesAtual}" oninput="filtrarPag()" style="margin:0;width:auto">
          <input placeholder="🔍 Buscar aluno..." id="searchPag" oninput="filtrarPag()" style="margin:0;max-width:160px">
        </div>
      </div>
      <div class="table-wrap">
        <table id="pagTable">
          <thead><tr><th>Aluno</th><th>Referência</th><th>Valor</th><th>Data Pgto</th><th>Método</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>${pagRows(pags)}</tbody>
        </table>
      </div>
    </div>`;

  window._pagList = pags;

  window.openModalPag = () => {
    openModal('Registrar Pagamento', `
      <div class="form-grid">
        <div class="form-group full"><label>Aluno *</label><select id="pg_aluno" onchange="autoPreencherValor()">${alunoOpts}</select></div>
        <div class="form-group"><label>Valor (R$) *</label><input id="pg_valor" type="number" step="0.01" placeholder="0,00"></div>
        <div class="form-group"><label>Data do Pagamento *</label><input id="pg_data" type="date" value="${hoje}"></div>
        <div class="form-group"><label>Referência (mês) *</label><input id="pg_ref" value="${mesAtual}" placeholder="2026-05"></div>
        <div class="form-group"><label>Método</label>
          <select id="pg_metodo"><option>Dinheiro</option><option>Pix</option><option>Cartão Débito</option><option>Cartão Crédito</option><option>Transferência</option></select>
        </div>
        <div class="form-group"><label>Observações</label><input id="pg_obs" placeholder="Opcional"></div>
      </div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="salvarPagamento()">Registrar</button>`
    );
    // auto-fill value on load
    setTimeout(window.autoPreencherValor, 100);
  };

  window.autoPreencherValor = () => {
    const alunoId = parseInt(document.getElementById('pg_aluno')?.value);
    if (!alunoId) return;
    const aluno = alunos.find(a=>a.id===alunoId);
    const plano = planos.find(p=>p.id===aluno?.planoId);
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
    const rows = document.querySelectorAll('#pagTable tbody tr');
    rows.forEach(r => {
      const txt = r.textContent.toLowerCase();
      const mesMatch = !mes || txt.includes(mes.replace('-','/')) || txt.includes(mes);
      r.style.display = (mesMatch && txt.includes(q)) ? '' : 'none';
    });
  };
}

function pagRows(pags) {
  if (!pags.length) return '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">💵</div><p>Nenhum pagamento</p></div></td></tr>';
  return pags.map(p=>`
    <tr>
      <td><strong>${escape(p.alunoNome||'—')}</strong></td>
      <td>${badge(fmtYM(p.referenciaMensal),'blue')}</td>
      <td class="text-accent" style="font-weight:700">${fmtMoney(p.valor)}</td>
      <td>${fmtDate(p.dataPagamento)}</td>
      <td class="text-muted">${escape(p.metodoPagamento||'—')}</td>
      <td>${badge(p.status||'Pago','green')}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deletarPag(${p.id})">🗑️</button></td>
    </tr>`).join('');
}

// ─── INADIMPLENTES ────────────────────────────────────────────────────────────
async function renderInadimplentes(c) {
  const [iad, planos] = await Promise.all([api.get('/api/inadimplentes'), api.get('/api/planos')]);
  const mesAtual = new Date().toISOString().substring(0,7);
  c.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Inadimplentes</div><div class="page-subtitle">${iad.length} alunos sem pagamento em ${fmtYM(mesAtual)}</div></div>
    </div>
    ${iad.length ? `
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Plano</th><th>Valor</th><th>Telefone</th><th>Ação</th></tr></thead>
          <tbody>${iad.map(a=>{
            const plano = planos.find(p=>p.id===a.planoId);
            return `<tr>
              <td><strong>${escape(a.nome)}</strong></td>
              <td>${badge(a.planoNome||'—','blue')}</td>
              <td class="text-red" style="font-weight:600">${fmtMoney(plano?.valor||0)}</td>
              <td>${escape(a.telefone||'—')}</td>
              <td><button class="btn btn-success btn-sm" onclick="registrarPagamentoRapido(${a.id},${plano?.valor||0})">💵 Registrar Pgto</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>` :
    `<div class="panel"><div class="panel-body"><div class="empty-state"><div class="empty-icon">🎉</div><p>Todos os alunos estão em dia este mês!</p></div></div></div>`}`;

  window.registrarPagamentoRapido = async (alunoId, valor) => {
    const hoje = new Date().toISOString().split('T')[0];
    const mes = hoje.substring(0,7);
    await api.post('/api/pagamentos', { alunoId, valor, dataPagamento: hoje, referenciaMensal: mes, metodoPagamento: 'Dinheiro' });
    toast('Pagamento registrado!'); renderInadimplentes(c);
  };
}

// ─── FREQUÊNCIA ADMIN ─────────────────────────────────────────────────────────
async function renderFrequenciaAdmin(c) {
  const [freqs, alunos] = await Promise.all([api.get('/api/frequencia'), api.get('/api/alunos')]);
  const alunoOpts = alunos.filter(a=>a.status==='Ativo').map(a=>`<option value="${a.id}">${escape(a.nome)}</option>`).join('');
  const hoje = new Date().toISOString().split('T')[0];
  const horaAtual = new Date().toTimeString().substring(0,5);

  c.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Frequência</div><div class="page-subtitle">Check-in de alunos</div></div>
      <button class="btn btn-primary" onclick="openModalFreq()">＋ Registrar Check-in</button>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Histórico de Frequência</span>
        <input type="date" id="filtroData" value="${hoje}" oninput="filtrarFreq()" style="margin:0;width:auto">
      </div>
      <div class="table-wrap">
        <table id="freqTable">
          <thead><tr><th>Aluno</th><th>Data</th><th>Entrada</th><th>Saída</th><th>Ações</th></tr></thead>
          <tbody>${freqRows(freqs)}</tbody>
        </table>
      </div>
    </div>`;

  window.openModalFreq = () => {
    openModal('Registrar Check-in', `
      <div class="form-grid">
        <div class="form-group full"><label>Aluno *</label><select id="fq_aluno">${alunoOpts}</select></div>
        <div class="form-group"><label>Data *</label><input type="date" id="fq_data" value="${hoje}"></div>
        <div class="form-group"><label>Horário Entrada *</label><input type="time" id="fq_hora" value="${horaAtual}"></div>
        <div class="form-group"><label>Horário Saída</label><input type="time" id="fq_saida"></div>
      </div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="salvarFreq()">Registrar</button>`
    );
  };

  window.salvarFreq = async () => {
    await api.post('/api/frequencia', { alunoId:document.getElementById('fq_aluno').value, dataEntrada:document.getElementById('fq_data').value, horarioEntrada:document.getElementById('fq_hora').value, horarioSaida:document.getElementById('fq_saida').value });
    closeModal(); toast('Check-in registrado!'); renderFrequenciaAdmin(c);
  };

  window.deletarFreq = async (id) => {
    if (!confirm('Remover registro?')) return;
    await api.delete(`/api/frequencia/${id}`);
    toast('Registro removido'); renderFrequenciaAdmin(c);
  };

  window.filtrarFreq = () => {
    const data = document.getElementById('filtroData').value;
    const rows = document.querySelectorAll('#freqTable tbody tr');
    rows.forEach(r => { r.style.display = !data || r.textContent.includes(fmtDate(data)) ? '' : 'none'; });
  };

  // Apply initial filter
  setTimeout(() => { if (document.getElementById('filtroData')) window.filtrarFreq(); }, 0);
}

function freqRows(freqs) {
  if (!freqs.length) return '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📅</div><p>Nenhum check-in registrado</p></div></td></tr>';
  return freqs.map(f=>`
    <tr>
      <td><strong>${escape(f.alunoNome||'—')}</strong></td>
      <td>${fmtDate(f.dataEntrada)}</td>
      <td>${badge(f.horarioEntrada||'—','blue')}</td>
      <td>${f.horarioSaida ? badge(f.horarioSaida,'green') : '<span class="text-muted">—</span>'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deletarFreq(${f.id})">🗑️</button></td>
    </tr>`).join('');
}

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
async function renderRelatorios(c) {
  const [dash, receita, alunos, pags] = await Promise.all([
    api.get('/api/relatorios/dashboard'),
    api.get('/api/relatorios/receita-mensal'),
    api.get('/api/alunos'),
    api.get('/api/pagamentos')
  ]);

  const maxR = Math.max(...receita.map(r=>r.total), 1);
  const barHTML = receita.slice(-12).map(r => `
    <div class="chart-bar-wrap">
      <div class="chart-bar" style="height:${Math.round((r.total/maxR)*100)}px" title="${fmtMoney(r.total)} — ${r.qtd} pgts"></div>
      <span class="chart-label">${fmtYM(r.mes)}</span>
    </div>`).join('');

  // Plano distribution
  const porPlano = {};
  alunos.filter(a=>a.status==='Ativo').forEach(a => { porPlano[a.planoNome||'N/A'] = (porPlano[a.planoNome||'N/A']||0)+1; });
  const planoRows = Object.entries(porPlano).map(([nome,qtd])=>`
    <tr><td>${escape(nome)}</td><td>${qtd}</td><td>${Math.round(qtd/Math.max(dash.ativos,1)*100)}%</td></tr>`).join('');

  c.innerHTML = `
    <div class="page-header"><div><div class="page-title">Relatórios</div><div class="page-subtitle">Análise do negócio</div></div></div>
    <div class="stats-grid">
      <div class="stat-card yellow"><div class="stat-icon">👥</div><div class="stat-value">${dash.totalAlunos}</div><div class="stat-label">Total de Alunos</div></div>
      <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${dash.ativos}</div><div class="stat-label">Ativos</div></div>
      <div class="stat-card red"><div class="stat-icon">❌</div><div class="stat-value">${dash.inativos}</div><div class="stat-label">Inativos</div></div>
      <div class="stat-card red"><div class="stat-icon">⚠️</div><div class="stat-value">${dash.inadimplentes}</div><div class="stat-label">Inadimplentes</div></div>
      <div class="stat-card orange"><div class="stat-icon">💵</div><div class="stat-value" style="font-size:1.2rem">${fmtMoney(dash.receitaMes)}</div><div class="stat-label">Receita do Mês</div></div>
      <div class="stat-card green"><div class="stat-icon">💰</div><div class="stat-value" style="font-size:1.2rem">${fmtMoney(dash.receitaTotal)}</div><div class="stat-label">Receita Total</div></div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">📈 Receita por Mês</span></div>
        <div class="panel-body">
          ${receita.length ? `<div class="chart-bars">${barHTML}</div>` : '<div class="empty-state"><p>Sem dados</p></div>'}
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">📋 Alunos por Plano</span></div>
        <div class="table-wrap">
          <table><thead><tr><th>Plano</th><th>Qtd</th><th>%</th></tr></thead>
          <tbody>${planoRows || '<tr><td colspan="3" class="text-muted">Sem dados</td></tr>'}</tbody></table>
        </div>
      </div>
    </div>`;
}

// ─── BACKUP ───────────────────────────────────────────────────────────────────
async function renderBackup(c) {
  c.innerHTML = `
    <div class="page-header"><div><div class="page-title">Backup & Restore</div><div class="page-subtitle">Exportar e restaurar dados do sistema</div></div></div>
    <div class="backup-grid">
      <div class="backup-card">
        <div class="backup-icon">📦</div>
        <h3>Exportar Backup</h3>
        <p>Baixar todos os dados do sistema em formato JSON. Use para criar backups manuais ou migrar dados.</p>
        <button class="btn btn-primary" onclick="exportarBackup()">⬇️ Baixar Backup JSON</button>
      </div>
      <div class="backup-card">
        <div class="backup-icon">🔄</div>
        <h3>Restaurar Backup</h3>
        <p>Importar um arquivo JSON de backup para restaurar os dados. <strong>Atenção: isso substituirá todos os dados atuais!</strong></p>
        <label class="btn btn-secondary" style="cursor:pointer">
          📂 Selecionar arquivo JSON
          <input type="file" accept=".json" style="display:none" onchange="importarBackup(this)">
        </label>
      </div>
    </div>
    <div id="backupLog" style="margin-top:20px"></div>`;

  window.exportarBackup = async () => {
    const data = await fetch('/api/backup').then(r=>r.blob());
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
    log.innerHTML = `<div class="panel"><div class="panel-body"><p>⏳ Lendo arquivo...</p></div></div>`;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      log.innerHTML = `<div class="panel"><div class="panel-body">
        <p style="margin-bottom:12px">📋 Arquivo: <strong>${escape(file.name)}</strong></p>
        <p>Exportado em: ${json.exportedAt ? fmtDate(json.exportedAt.split('T')[0]) : '—'}</p>
        <p>Alunos: ${json.alunos?.length||0} | Professores: ${json.professores?.length||0} | Planos: ${json.planos?.length||0}</p>
        <p>Pagamentos: ${json.pagamentos?.length||0} | Treinos: ${json.treinos?.length||0} | Frequências: ${json.frequencias?.length||0}</p>
        <hr class="divider">
        <p style="color:var(--red);margin-bottom:14px">⚠️ Esta ação substituirá <strong>todos</strong> os dados atuais!</p>
        <button class="btn btn-danger" onclick="confirmarRestore()">🔄 Confirmar Restauração</button>
        <button class="btn btn-secondary" style="margin-left:8px" onclick="document.getElementById('backupLog').innerHTML=''">Cancelar</button>
      </div></div>`;
      window._pendingRestore = json;
    } catch(e) {
      log.innerHTML = `<div class="panel"><div class="panel-body"><p class="text-red">❌ Arquivo inválido: ${e.message}</p></div></div>`;
    }
  };

  window.confirmarRestore = async () => {
    const log = document.getElementById('backupLog');
    log.innerHTML = `<div class="panel"><div class="panel-body"><p>⏳ Restaurando...</p></div></div>`;
    const result = await api.post('/api/restore', window._pendingRestore);
    if (result.success) {
      toast('Backup restaurado com sucesso!');
      log.innerHTML = `<div class="panel"><div class="panel-body"><p class="text-green">✅ ${result.message}</p></div></div>`;
    } else {
      toast('Erro ao restaurar: ' + result.error, 'error');
      log.innerHTML = `<div class="panel"><div class="panel-body"><p class="text-red">❌ ${result.error}</p></div></div>`;
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
  const [alunos, treinos, profs] = await Promise.all([
    api.get('/api/alunos'),
    api.get('/api/treinos'),
    api.get('/api/professores')
  ]);
  const ativos = alunos.filter(a=>a.status==='Ativo');
  const meusTreinos = currentProfId ? treinos.filter(t=>t.professorId===currentProfId) : treinos;
  const alunoOpts = ativos.map(a=>`<option value="${a.id}">${escape(a.nome)}</option>`).join('');
  const grupos = ['Peito','Costas','Ombros','Bíceps','Tríceps','Abdômen','Quadríceps','Posterior','Glúteos','Panturrilha','Cardio','Funcional'];

  c.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Gerenciar Treinos</div><div class="page-subtitle">${meusTreinos.length} treinos cadastrados</div></div>
      <button class="btn btn-primary" onclick="openModalTreino()">＋ Novo Treino</button>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">Treinos</span>
        <select id="filtroAlunoTreino" onchange="filtrarTreinos()" style="margin:0;width:auto">
          <option value="">Todos os alunos</option>
          ${ativos.map(a=>`<option value="${a.id}">${escape(a.nome)}</option>`).join('')}
        </select>
      </div>
      <div id="treinosList">${renderTreinosCards(meusTreinos)}</div>
    </div>`;

  window._treinosList = meusTreinos;
  window._alunosAtivos = ativos;

  window.filtrarTreinos = () => {
    const id = parseInt(document.getElementById('filtroAlunoTreino').value);
    const filtered = id ? meusTreinos.filter(t=>t.alunoId===id) : meusTreinos;
    document.getElementById('treinosList').innerHTML = renderTreinosCards(filtered);
  };

  window.openModalTreino = (id) => {
    const t = id ? meusTreinos.find(x=>x.id===id) : null;
    const exs = t ? JSON.parse(typeof t.exercicios==='string'?t.exercicios:JSON.stringify(t.exercicios)) : [];
    const hoje = new Date().toISOString().split('T')[0];

    openModal(t ? 'Editar Treino' : 'Novo Treino', `
      <div class="form-grid">
        <div class="form-group full"><label>Aluno *</label>
          <select id="tr_aluno">${ativos.map(a=>`<option value="${a.id}" ${t&&t.alunoId===a.id?'selected':''}>${escape(a.nome)}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label>Objetivo *</label><input id="tr_obj" value="${t?escape(t.objetivo):''}"></div>
        <div class="form-group"><label>Nível</label>
          <select id="tr_nivel">${['Iniciante','Intermediário','Avançado'].map(n=>`<option ${t&&t.nivel===n?'selected':''}>${n}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label>Data Início</label><input type="date" id="tr_ini" value="${t?t.dataInicio:hoje}"></div>
        <div class="form-group"><label>Data Fim</label><input type="date" id="tr_fim" value="${t?t.dataFim:''}"></div>
        <div class="form-group full"><label>Observações</label><textarea id="tr_obs">${t?escape(t.observacoes||''):''}</textarea></div>
      </div>
      <hr class="divider">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <strong>Exercícios</strong>
        <button class="btn btn-secondary btn-sm" type="button" onclick="addExercicio()">＋ Exercício</button>
      </div>
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:8px;display:grid;grid-template-columns:2fr 1.5fr 1fr 1fr 1fr auto;gap:10px;padding:0 14px">
        <span>Nome</span><span>Grupo Muscular</span><span>Séries</span><span>Reps</span><span>Descanso(s)</span><span></span>
      </div>
      <div id="exerciciosList">
        ${exs.map((e,i)=>exercicioRow(e,i)).join('')}
      </div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="${t?`salvarEditTreino(${id})`:'salvarNovoTreino()'}">Salvar Treino</button>`
    );
    window._exIdx = exs.length;
  };

  window.addExercicio = () => {
    const d = document.getElementById('exerciciosList');
    d.insertAdjacentHTML('beforeend', exercicioRow({nome:'',grupoMuscular:'Peito',series:3,repeticoes:12,descanso:60}, window._exIdx||0));
    window._exIdx = (window._exIdx||0)+1;
  };

  window.removeExercicio = (i) => {
    document.getElementById(`ex_row_${i}`)?.remove();
  };

  function exercicioRow(e, i) {
    const gOpts = grupos.map(g=>`<option ${e.grupoMuscular===g?'selected':''}>${g}</option>`).join('');
    return `<div class="exercise-item" id="ex_row_${i}">
      <input placeholder="Ex: Supino Reto" value="${escape(e.nome||'')}" data-ex-nome="${i}">
      <select data-ex-grupo="${i}">${gOpts}</select>
      <input type="number" value="${e.series||3}" min="1" data-ex-series="${i}">
      <input type="number" value="${e.repeticoes||12}" min="1" data-ex-reps="${i}">
      <input type="number" value="${e.descanso||60}" min="0" data-ex-desc="${i}">
      <button class="btn btn-danger btn-icon" type="button" onclick="removeExercicio(${i})">✕</button>
    </div>`;
  }

  function coletarExercicios() {
    const rows = document.querySelectorAll('.exercise-item');
    return Array.from(rows).map(r => {
      const idx = r.id.replace('ex_row_','');
      return {
        nome: r.querySelector(`[data-ex-nome]`)?.value || '',
        grupoMuscular: r.querySelector(`[data-ex-grupo]`)?.value || '',
        series: parseInt(r.querySelector(`[data-ex-series]`)?.value||3),
        repeticoes: parseInt(r.querySelector(`[data-ex-reps]`)?.value||12),
        descanso: parseInt(r.querySelector(`[data-ex-desc]`)?.value||60)
      };
    }).filter(e=>e.nome.trim());
  }

  window.salvarNovoTreino = async () => {
    const obj = document.getElementById('tr_obj').value.trim();
    if (!obj) { toast('Objetivo obrigatório','error'); return; }
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
  if (!treinos.length) return '<div class="empty-state"><div class="empty-icon">💪</div><p>Nenhum treino cadastrado</p></div>';
  return `<div style="padding:16px;display:flex;flex-direction:column;gap:12px">` +
    treinos.map(t => {
      const exs = Array.isArray(t.exercicios) ? t.exercicios : JSON.parse(t.exercicios||'[]');
      const nivelBadge = { 'Iniciante':'blue', 'Intermediário':'yellow', 'Avançado':'red' };
      return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <strong style="font-size:1rem">${escape(t.objetivo)}</strong>
            <div style="margin-top:4px;display:flex;gap:8px;flex-wrap:wrap">
              <span class="text-muted" style="font-size:0.8rem">👤 ${escape(t.alunoNome||'—')}</span>
              <span class="text-muted" style="font-size:0.8rem">📅 ${fmtDate(t.dataInicio)} → ${fmtDate(t.dataFim)}</span>
              ${badge(t.nivel||'Iniciante', nivelBadge[t.nivel]||'blue')}
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="openModalTreino(${t.id})">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deletarTreino(${t.id})">🗑️</button>
          </div>
        </div>
        ${t.observacoes ? `<p style="font-size:0.82rem;color:var(--muted);margin-bottom:8px">📝 ${escape(t.observacoes)}</p>` : ''}
        ${exs.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${exs.map(e=>`<span style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:3px 9px;font-size:0.75rem">${escape(e.nome)} <span class="text-muted">${e.series}×${e.repeticoes}</span></span>`).join('')}</div>` : ''}
      </div>`;
    }).join('') + '</div>';
}

async function renderProfAlunos(c) {
  const alunos = await api.get('/api/alunos');
  const ativos = alunos.filter(a=>a.status==='Ativo');
  c.innerHTML = `
    <div class="page-header"><div><div class="page-title">Alunos Ativos</div><div class="page-subtitle">${ativos.length} alunos</div></div></div>
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Plano</th><th>Situação</th><th>Telefone</th></tr></thead>
          <tbody>${ativos.map(a=>`
            <tr>
              <td><strong>${escape(a.nome)}</strong></td>
              <td>${badge(a.planoNome||'—','blue')}</td>
              <td>${badge(a.inadimplente?'Inadimplente':'Em dia', a.inadimplente?'red':'green')}</td>
              <td>${escape(a.telefone||'—')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ─── ALUNO PAGES ──────────────────────────────────────────────────────────────
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
    <div class="page-header"><div><div class="page-title">Meu Perfil</div></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">👤 Dados Pessoais</span></div>
        <div class="panel-body">
          <table style="font-size:0.9rem">
            <tr><td class="text-muted" style="padding:6px 12px">Nome</td><td style="padding:6px 12px"><strong>${escape(aluno.nome)}</strong></td></tr>
            <tr><td class="text-muted" style="padding:6px 12px">CPF</td><td style="padding:6px 12px">${escape(aluno.cpf||'—')}</td></tr>
            <tr><td class="text-muted" style="padding:6px 12px">Telefone</td><td style="padding:6px 12px">${escape(aluno.telefone||'—')}</td></tr>
            <tr><td class="text-muted" style="padding:6px 12px">Nascimento</td><td style="padding:6px 12px">${fmtDate(aluno.dataNascimento)}</td></tr>
            <tr><td class="text-muted" style="padding:6px 12px">Status</td><td style="padding:6px 12px">${badge(aluno.status, aluno.status==='Ativo'?'green':'gray')}</td></tr>
          </table>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">📋 Meu Plano</span></div>
        <div class="panel-body">
          <div style="margin-bottom:12px">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--accent)">${escape(planoData.plano?.nome||'Nenhum')}</div>
            <div class="text-muted" style="font-size:0.82rem">Desde ${fmtDate(planoData.dataInicio)}</div>
          </div>
          ${planoData.plano ? `<div style="font-size:1.3rem;font-weight:700;color:var(--text)">${fmtMoney(planoData.plano.valor)}<span class="text-muted" style="font-size:0.8rem;font-weight:400">/mês</span></div>` : ''}
          <hr class="divider">
          <div style="display:flex;align-items:center;gap:8px;font-size:0.9rem">
            <span>Situação financeira:</span>
            ${badge(situacao.status, situacao.status==='Em dia'?'green':'red')}
          </div>
        </div>
      </div>
    </div>
    ${aluno.observacoes ? `<div class="panel"><div class="panel-header"><span class="panel-title">📝 Observações</span></div><div class="panel-body"><p style="font-size:0.9rem;color:var(--muted)">${escape(aluno.observacoes)}</p></div></div>` : ''}`;
}

async function renderAlunoTreinos(c) {
  const treinos = await api.get(`/api/treinos?alunoId=${currentAlunoId}`);
  c.innerHTML = `
    <div class="page-header"><div><div class="page-title">Meus Treinos</div><div class="page-subtitle">${treinos.length} treino(s)</div></div></div>
    ${treinos.length ? treinos.map(t => {
      const exs = Array.isArray(t.exercicios) ? t.exercicios : JSON.parse(t.exercicios||'[]');
      return `<div class="panel" style="margin-bottom:16px">
        <div class="panel-header">
          <div>
            <span class="panel-title">${escape(t.objetivo)}</span>
            <div style="display:flex;gap:8px;margin-top:4px">
              ${badge(t.nivel||'Iniciante','blue')}
              <span class="text-muted" style="font-size:0.78rem">📅 ${fmtDate(t.dataInicio)} → ${fmtDate(t.dataFim)}</span>
              <span class="text-muted" style="font-size:0.78rem">🏋️ ${escape(t.professorNome||'—')}</span>
            </div>
          </div>
        </div>
        ${t.observacoes ? `<div style="padding:12px 20px;border-bottom:1px solid var(--border);font-size:0.85rem;color:var(--muted)">📝 ${escape(t.observacoes)}</div>` : ''}
        ${exs.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Exercício</th><th>Grupo</th><th>Séries</th><th>Repetições</th><th>Descanso</th></tr></thead>
          <tbody>${exs.map(e=>`<tr>
            <td><strong>${escape(e.nome)}</strong></td>
            <td>${badge(e.grupoMuscular,'blue')}</td>
            <td style="text-align:center">${e.series}</td>
            <td style="text-align:center">${e.repeticoes}</td>
            <td style="text-align:center">${e.descanso ? e.descanso+'s' : '—'}</td>
          </tr>`).join('')}</tbody>
        </table></div>` : '<div class="panel-body"><p class="text-muted">Nenhum exercício cadastrado neste treino.</p></div>'}
      </div>`;
    }).join('') : '<div class="panel"><div class="panel-body"><div class="empty-state"><div class="empty-icon">💪</div><p>Nenhum treino atribuído ainda.</p></div></div></div>'}`;
}

async function renderAlunoPagamentos(c) {
  const hist = await api.get(`/api/pagamentos?alunoId=${currentAlunoId}`);
  c.innerHTML = `
    <div class="page-header"><div><div class="page-title">Meus Pagamentos</div></div></div>
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Referência</th><th>Valor</th><th>Data Pgto</th><th>Método</th><th>Status</th></tr></thead>
          <tbody>${hist.length ? hist.map(p=>`<tr>
            <td>${badge(fmtYM(p.referenciaMensal),'blue')}</td>
            <td class="text-accent" style="font-weight:700">${fmtMoney(p.valor)}</td>
            <td>${fmtDate(p.dataPagamento)}</td>
            <td>${escape(p.metodoPagamento||'—')}</td>
            <td>${badge(p.status||'Pago','green')}</td>
          </tr>`).join('') : '<tr><td colspan="5"><div class="empty-state"><p>Nenhum pagamento encontrado</p></div></td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}

async function renderAlunoFrequencia(c) {
  const freqs = await api.get(`/api/frequencia?alunoId=${currentAlunoId}`);
  const total = freqs.length;
  const thisMonth = freqs.filter(f => f.dataEntrada?.startsWith(new Date().toISOString().substring(0,7))).length;

  c.innerHTML = `
    <div class="page-header"><div><div class="page-title">Minha Frequência</div></div></div>
    <div class="stats-grid" style="margin-bottom:16px">
      <div class="stat-card blue"><div class="stat-icon">📅</div><div class="stat-value">${total}</div><div class="stat-label">Total de Visitas</div></div>
      <div class="stat-card green"><div class="stat-icon">🗓️</div><div class="stat-value">${thisMonth}</div><div class="stat-label">Visitas este Mês</div></div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">Histórico de Check-ins</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Data</th><th>Entrada</th><th>Saída</th></tr></thead>
        <tbody>${freqs.length ? freqs.map(f=>`<tr>
          <td><strong>${fmtDate(f.dataEntrada)}</strong></td>
          <td>${badge(f.horarioEntrada||'—','blue')}</td>
          <td>${f.horarioSaida ? badge(f.horarioSaida,'green') : '<span class="text-muted">—</span>'}</td>
        </tr>`).join('') : '<tr><td colspan="3"><div class="empty-state"><div class="empty-icon">📅</div><p>Nenhuma visita registrada</p></div></td></tr>'}</tbody>
      </table></div>
    </div>`;
}