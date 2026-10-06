import { openUiDialog, closeUiDialog } from './ui-dialog.js';
import { showToast } from './utils.js';
import { state } from './state.js';

let activeMonitor;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const isAiJobRunning = () => activeMonitor?.state === 'running';
export const hasActiveAiJob = () => ['running', 'completed', 'partial'].includes(activeMonitor?.state);
export const getActiveAiJobSignal = () => activeMonitor?.signal;
export function closeAiLiveMonitor() { activeMonitor?.hide(); }

export function openAiLiveMonitor({ title = 'Menyusun perangkat ajar', subtitle = 'Hasil akan tersedia untuk ditinjau.', modelName = 'Model yang dipilih', steps = [], onCancel } = {}) {
  if (hasActiveAiJob()) {
    activeMonitor.show();
    throw new Error('Masih ada proses AI yang berjalan. Tinjau atau batalkan proses tersebut terlebih dahulu.');
  }
  activeMonitor?.close();
  const controller = new AbortController();
  const originPage = document.querySelector('#main-content')?.dataset.featurePage;
  const ownerId = state.user?.id;
  const jobId = crypto.randomUUID();
  const stages = (steps.length ? steps : [{ id: 1, label: 'Menyusun draf' }, { id: 2, label: 'Menyiapkan hasil' }]).map((stage, index) => ({ ...stage, id: stage.id ?? index + 1 }));
  const overlay = document.createElement('div');
  overlay.id = 'ai-live-monitor-modal';
  overlay.dataset.aiJobUi = 'true';
  overlay.className = 'ai-monitor hidden';
  overlay.innerHTML = `<section class="ai-monitor-panel">
    <header class="ai-monitor-header"><div><p class="ai-monitor-kind">Ruang kerja guru</p><h2 id="monitor-title">${escape(title)}</h2><p id="monitor-subtitle">${escape(subtitle)}</p></div><button id="monitor-close-btn" type="button" aria-label="Sembunyikan monitor">Sembunyikan</button></header>
    <div class="ai-monitor-body">
      <div class="ai-monitor-meta"><span id="monitor-connection">Menghubungkan</span><span>Waktu berjalan <span id="monitor-timer">00:00</span></span></div>
      <h3 id="monitor-step-title" aria-live="polite" aria-atomic="true">Menyiapkan proses</h3>
      <p id="monitor-stage-count">Tahap 0 dari ${stages.length}</p><progress id="monitor-progress-bar" max="${stages.length}" value="0" aria-label="Tahap yang telah selesai"></progress>
      <ol class="ai-stage-list">${stages.map(stage => `<li id="step-node-${escape(stage.id)}" data-state="pending"><span class="ai-stage-mark" aria-hidden="true"></span><span>${escape(stage.label)}</span></li>`).join('')}</ol>
      <p id="monitor-message">Draf yang selesai tetap perlu diperiksa sesuai kebutuhan kelas.</p>
      <details class="ai-monitor-details"><summary>Detail teknis</summary><p>Model: <span id="monitor-model-badge">${escape(modelName)}</span></p><p id="monitor-token-count">0 karakter diterima</p><pre id="monitor-terminal" tabindex="0" aria-label="Catatan teknis proses"></pre></details>
      <p id="monitor-error" role="alert" hidden></p>
    </div>
    <footer class="ai-monitor-footer"><button id="monitor-cancel-btn" type="button">Batalkan proses</button><button id="monitor-review-btn" type="button" hidden>Tinjau hasil</button><button id="monitor-dismiss-btn" type="button" hidden>Tutup</button></footer>
  </section>`;
  document.body.append(overlay);
  const find = selector => overlay.querySelector(selector);
  const startTime = Date.now();
  let timer, frame, log = '', characters = 0, review, restore, disposed = false, reviewing = false;
  const flush = () => {
    frame = null;
    find('#monitor-token-count').textContent = `${characters.toLocaleString('id-ID')} karakter diterima`;
    if (find('details').open) find('#monitor-terminal').textContent = log;
  };
  const stopTimer = () => { clearInterval(timer); if (frame) cancelAnimationFrame(frame); frame = null; flush(); };
  const finish = (state, message) => {
    monitor.state = state; stopTimer();
    find('#monitor-connection').textContent = state === 'completed' ? 'Selesai' : state === 'partial' ? 'Selesai sebagian' : state === 'cancelled' ? 'Dibatalkan' : 'Terhenti';
    find('#monitor-step-title').textContent = message;
    find('#monitor-cancel-btn').hidden = true;
    find('#monitor-dismiss-btn').hidden = false;
    if (restore) restore.textContent = `${title}: ${find('#monitor-connection').textContent}`;
  };
  const ensureStatus = () => {
    if (disposed || restore) return;
    restore = document.createElement('button'); restore.type = 'button'; restore.id = 'ai-job-status-button'; restore.dataset.aiJobUi = 'true';
    restore.textContent = `${title}: ${monitor.state === 'running' ? 'sedang berjalan' : 'tinjau status'}`;
    restore.addEventListener('click', () => monitor.show());
    const slot = document.querySelector('.wk-contextbar') || document.querySelector('#main-content') || document.body;
    slot.prepend(restore);
  };
  const statusObserver = new MutationObserver(() => {
    if (!disposed && state.user?.id !== ownerId) { monitor.cancel(); monitor.close(); return; }
    if (disposed || !restore || restore.isConnected) return;
    (document.querySelector('.wk-contextbar') || document.querySelector('#main-content') || document.body).prepend(restore);
  });
  statusObserver.observe(document.body, { childList: true, subtree: true });
  const monitor = {
    id: jobId, signal: controller.signal, state: 'running',
    show() { if (!disposed) openUiDialog(overlay, { labelledBy: 'monitor-title', initialFocus: '#monitor-close-btn', onClose: ensureStatus }); },
    hide() {
      if (disposed) return;
      closeUiDialog(overlay);
      ensureStatus();
    },
    updateStep(stepNum, stageTitle, message) {
      if (monitor.state !== 'running' || disposed) return;
      const index = stages.findIndex(stage => Number(stage.id) === Number(stepNum));
      if (index >= 0) {
        find('#monitor-stage-count').textContent = `Tahap ${index + 1} dari ${stages.length}`;
        find('#monitor-progress-bar').value = index;
        for (const [i, stage] of stages.entries()) {
          const node = find(`#step-node-${stage.id}`);
          node.dataset.state = i < index ? 'done' : i === index ? 'active' : 'pending';
          if (i === index) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
        }
      }
      find('#monitor-step-title').textContent = stages[index]?.label || stageTitle || 'Sedang menyusun draf';
      find('#monitor-message').textContent = message || 'Hasil akan tersedia untuk ditinjau setelah proses selesai.';
      find('#monitor-connection').textContent = 'Terhubung';
    },
    appendToken(text) {
      if (!text || monitor.state !== 'running' || disposed) return;
      characters += text.length; log = (log + text).slice(-65536);
      if (!frame) frame = requestAnimationFrame(flush);
    },
    reset(message = 'Model mengulang penyusunan. Catatan sebelumnya diganti agar hasil tidak tercampur.') {
      if (disposed || monitor.state !== 'running') return;
      log = ''; characters = 0; flush(); find('#monitor-message').textContent = message;
    },
    complete(callback, { partial = false, warnings = [] } = {}) {
      if (disposed || (!partial && controller.signal.aborted) || (monitor.state !== 'running' && !(partial && monitor.state === 'cancelled'))) return;
      review = callback;
      finish(partial ? 'partial' : 'completed', partial ? 'Sebagian hasil perlu dilengkapi' : 'Draf siap ditinjau');
      if (!partial) find('#monitor-progress-bar').value = stages.length;
      if (!partial) for (const stage of stages) { const node = find(`#step-node-${stage.id}`); node.dataset.state = 'done'; node.removeAttribute('aria-current'); }
      find('#monitor-message').textContent = warnings.length ? warnings.join(' ') : 'Tinjau isi, identitas, dan kesesuaian materi sebelum menggunakan draf.';
      find('#monitor-review-btn').hidden = false;
      find('#monitor-review-btn').textContent = partial ? 'Tinjau draf parsial' : 'Tinjau hasil';
      find('#monitor-dismiss-btn').textContent = 'Buang draf';
    },
    fail(error) {
      if (disposed || monitor.state !== 'running') return;
      if (controller.signal.aborted || error?.name === 'AbortError') return;
      finish('failed', 'Penyusunan belum selesai');
      find('#monitor-error').hidden = false;
      const contentFailure = error?.code === 'AI_OUTPUT_INVALID' || /draf belum lolos pemeriksaan|terlalu panjang untuk bidangnya/i.test(error?.message || '');
      find('#monitor-error').textContent = error?.status === 401 ? 'Sesi berakhir. Masuk kembali sebelum memulai ulang.' : error?.status === 429 ? 'Batas permintaan tercapai. Tunggu sebentar sebelum memulai ulang.' : contentFailure ? `AI mengirim draf, tetapi isinya belum lengkap atau belum sesuai. ${error.message}` : 'Proses terhenti. Periksa koneksi atau pilihan model, lalu mulai ulang.';
      log = (log + `\nCatatan kegagalan: ${error?.message || String(error)}`).slice(-65536); flush();
      find('#monitor-message').textContent = 'Masukan tetap tersimpan di form. Tutup monitor untuk memulai ulang secara sadar.';
    },
    cancel() {
      if (monitor.state !== 'running') return;
      controller.abort(new DOMException('Proses dibatalkan oleh pengguna.', 'AbortError'));
      finish('cancelled', 'Permintaan pembatalan dikirim');
      find('#monitor-message').textContent = 'Hasil yang belum lengkap tidak dinyatakan selesai.';
      onCancel?.();
    },
    close() {
      if (disposed) return;
      if (monitor.state === 'running') monitor.cancel();
      stopTimer(); disposed = true; statusObserver.disconnect(); closeUiDialog(overlay); overlay.remove(); restore?.remove();
      if (activeMonitor === monitor) activeMonitor = null;
    },
  };
  activeMonitor = monitor;
  find('#monitor-close-btn').addEventListener('click', () => monitor.hide());
  find('#monitor-cancel-btn').addEventListener('click', () => monitor.cancel());
  find('#monitor-dismiss-btn').addEventListener('click', () => monitor.close());
  find('#monitor-review-btn').addEventListener('click', async () => {
    if (reviewing) return;
    reviewing = true; find('#monitor-review-btn').disabled = true;
    monitor.hide();
    try {
      if (originPage && document.querySelector('#main-content')?.dataset.featurePage !== originPage) {
        if (!window.navigate) throw new Error('Navigasi halaman asal belum tersedia.');
        await new Promise((resolve, reject) => {
          let timeout;
          const observer = new MutationObserver(ready);
          const cleanup = () => { observer.disconnect(); clearTimeout(timeout); };
          const fail = error => { cleanup(); reject(error); };
          function ready() {
            if (document.querySelector('#main-content')?.dataset.featurePage === originPage) { cleanup(); resolve(); }
          }
          observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-feature-page'] });
          timeout = setTimeout(() => fail(new Error('Halaman asal belum selesai dimuat.')), 5000);
          try { Promise.resolve(window.navigate(originPage)).then(ready, fail); ready(); } catch (error) { fail(error); }
        });
      }
      if (disposed || state.user?.id !== ownerId) return;
      await review?.(); monitor.close();
    } catch (error) {
      if (disposed || state.user?.id !== ownerId) return;
      find('#monitor-error').hidden = false;
      find('#monitor-error').textContent = 'Draf masih tersedia, tetapi belum dapat ditampilkan. Coba tinjau kembali.';
      log = (log + `\nCatatan peninjauan: ${error.message}`).slice(-65536); flush();
      monitor.show(); showToast('Draf belum dapat ditampilkan dan masih tersimpan dalam proses ini.', 'error');
    } finally { reviewing = false; if (!disposed) find('#monitor-review-btn').disabled = false; }
  });
  find('details').addEventListener('toggle', flush);
  timer = setInterval(() => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    find('#monitor-timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }, 1000);
  monitor.show();
  return monitor;
}
