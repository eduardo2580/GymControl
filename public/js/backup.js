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
