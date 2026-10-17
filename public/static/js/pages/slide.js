import { state } from '../state.js';
import { api } from '../api.js';
import { showToast, openAiLiveMonitor, hasActiveAiJob, streamPost } from '../utils.js';
import { openUiDialog, closeUiDialog } from '../ui-dialog.js';
import { saveDocArchive, openArchiveDrawer } from '../storage-archive.js';
import { slideTemplates, slideLayouts, getTemplate, resolveTemplateId } from '../slides/templates.js';
import { normalizeDeck, normalizeSlide, deckIssues, teacherNotes } from '../slides/lesson-model.js';
import { buildScene, sceneSvg, escapeXml as esc } from '../slides/scene.js';
import { exampleDeck } from '../slides/examples.js';
import { readDraft, writeDraft } from '../slides/draft.js';
import { createDraftSync, createDraftDocumentId } from '../slides/draft-sync.js';
import { fetchTeacherReview, fetchTeacherReviewHistory, submitTeacherReview } from '../slides/teacher-review.js';
import { exportPptx, htmlPresentation, download, safeName } from '../slides/export.js';
export { slideTemplates, slideLayouts };

let S, timer, syncClient;
const selected = (a, b) => a === b ? ' selected' : '';
const slideSubjects = [
  'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Bahasa Inggris', 'Seni Rupa', 'Koding dan Kecerdasan Artifisial', 'B.Sunda', 'Tatanen di Bale Atikan', 'AKPK',
];
const slideSubjectAliases = {
  'Pendidikan Agama': 'Pendidikan Agama dan Budi Pekerti',
  IPAS: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Seni Budaya': 'Seni Rupa',
  PJOK: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
};
const canonicalSlideSubject = value => slideSubjectAliases[value] || value;
const owner = () => String(state.user?.id || '');
function materialConfig(config) {
  const { tujuanPembelajaran, tujuan_pembelajaran, tujuanBelajar, ...material } = config || {};
  return material;
}
function initial() {
  return { owner: owner(), view: 'brief', template: 'kelas-ceria', outline: [], deck: { title: '', slides: [] }, index: 0, reveal: false, busy: false, providers: [], ready: false, saveStatus: 'Draf belum disimpan', serverDocumentId: '', serverRevision: 0, reviewStatus: 'needs-review', reviewAction: null, reviewDirty: false, reviewBusy: false, reviewEditVersion: 0, reviewReadToken: 0, reviewLoadedKey: '', pendingReviewAction: null, config: { topik: '', mataPelajaran: 'IPAS', jenjangKelas: `Kelas ${String(state.user?.kelas || '5').match(/[1-6]/)?.[0] || '5'}`, slideCount: 8, aspectRatio: '16:9', aiProvider: '', semester: '1', alokasiWaktu: '2 x 35 menit', extraInstructions: '', usePhotos: false } };
}
const snapshot = () => ({ config: S.config, deck: S.deck, template: S.template, outline: S.outline, index: S.index, serverDocumentId: syncClient?.documentId || S.serverDocumentId, serverRevision: syncClient?.revision ?? S.serverRevision, reviewEditVersion: S.reviewEditVersion, reviewDirty: S.reviewDirty, pendingReviewAction: S.pendingReviewAction });
function save() {
  invalidateTeacherReview();
  const ok = writeDraft(snapshot(), S.owner); S.saveStatus = ok ? 'Draf tersimpan di perangkat ini; menyinkronkan…' : 'Draf belum tersimpan; unduh atau simpan ke Riwayat';
  document.querySelectorAll('.ss-save-status').forEach(badge => { badge.textContent = S.saveStatus; badge.dataset.error = String(!ok); });
  if (ok && syncClient && owner() === S.owner) syncServer();
  return ok;
}
function syncServer() {
  if (!syncClient || owner() !== S.owner) return;
  const client = syncClient;
  const data = snapshot();
  client.sync({ config: data.config, deck: data.deck, template: data.template, outline: data.outline, index: data.index }, data.deck.title || data.config.topik || 'Presentasi tanpa judul').then(ok => {
    if (owner() !== S.owner || syncClient !== client || !ok) return;
    S.serverDocumentId = client.documentId; S.serverRevision = client.revision;
    writeDraft(snapshot(), S.owner);
    if (S.reviewEditVersion === data.reviewEditVersion) {
      S.reviewDirty = false;
      S.reviewStatus = 'needs-review';
      S.reviewAction = null;
      S.reviewRevision = client.revision;
      S.reviewLoadedKey = `${S.owner}:${client.documentId}:${client.revision}`;
      updateTeacherReviewUi();
    }
  });
}
function initializeSyncClient() {
  const client = createDraftSync(api, S.owner, owner, (message, error) => {
    if (!S || S.owner !== owner() || syncClient !== client) return;
    S.saveStatus = message;
    document.querySelectorAll('.ss-save-status').forEach(badge => { badge.textContent = message; badge.dataset.error = String(error); });
    if (syncClient?.conflict?.documentId === syncClient?.documentId) showConflictActions();
  });
  syncClient = client;
  client.restoreIdentity(S.serverDocumentId, S.serverRevision);
}
function preserveCurrentDraft() {
  if (!writeDraft(snapshot(), S.owner)) { showToast('Draf lokal belum tersimpan. Perubahan tidak akan diganti.', 'error'); return false; }
  if (!S.deck.slides.length && !S.config.topik && !S.outline.length) return true;
  const archived = saveDocArchive({ module: 'slide', title: S.deck.title || S.config.topik || 'Draf presentasi', subtitle: `${S.config.jenjangKelas} • ${S.deck.slides.length} slide`, inputData: S.config, content: { deck: S.deck, template: S.template, outline: S.outline, config: S.config } });
  if (!archived) { showToast('Draf lokal belum dapat dicadangkan. Perubahan tidak akan diganti.', 'error'); return false; }
  return true;
}
function changed() {
  invalidateTeacherReview();
  clearTimeout(timer); S.saveStatus = 'Menyimpan di perangkat ini…';
  document.querySelectorAll('.ss-save-status').forEach(badge => { badge.textContent = S.saveStatus; });
  const id = S.owner; timer = setTimeout(() => { if (owner() === id && S.owner === id) save(); }, 450);
}
function teacherReviewLabel(status) {
  return status === 'reviewed' ? 'Sudah ditinjau' : status === 'rejected' ? 'Ditandai perlu perbaikan' : 'Perlu ditinjau';
}
function invalidateTeacherReview() {
  if (!S) return;
  S.reviewEditVersion++;
  S.reviewReadToken++;
  S.reviewDirty = true;
  S.reviewStatus = 'needs-review';
  S.reviewAction = null;
  S.reviewLoadedKey = '';
  S.pendingReviewAction = null;
  updateTeacherReviewUi();
}
function updateTeacherReviewUi() {
  const status = document.querySelector('#sg-teacher-review-status');
  const detail = document.querySelector('#sg-teacher-review-detail');
  if (status) {
    status.textContent = syncClient?.conflict
      ? 'Konflik versi: pulihkan versi server atau simpan salinan lokal sebelum meninjau.'
      : S.reviewDirty
        ? 'Perubahan belum dinilai sebagai tinjauan. Simpan versi terbaru ke server terlebih dahulu.'
        : S.reviewRevision
          ? `${teacherReviewLabel(S.reviewStatus)} · revisi server ${S.reviewRevision}`
          : 'Draf belum tersimpan di server; tinjauan belum dapat dicatat.';
  }
  if (detail) detail.textContent = S.reviewBusy
    ? 'Mencatat tinjauan untuk versi tersimpan…'
    : 'Ini catatan tinjauan Anda untuk versi tersebut, bukan pengesahan resmi atau jaminan kebenaran materi.';
  const blocked = S.reviewBusy || !!syncClient?.conflict || owner() !== S.owner;
  document.querySelectorAll('[data-teacher-review-action]').forEach(button => { button.disabled = blocked; });
  const history = document.querySelector('#sg-review-history');
  if (history) history.disabled = !syncClient?.revision || owner() !== S.owner;
}
function teacherReviewMarkup() {
  return `<section class="ss-panel" id="sg-teacher-review" aria-labelledby="sg-teacher-review-title"><h2 id="sg-teacher-review-title">Tinjauan guru</h2><p id="sg-teacher-review-status" role="status">${esc(syncClient?.conflict ? 'Konflik versi: pulihkan versi server atau simpan salinan lokal sebelum meninjau.' : S.reviewDirty ? 'Perubahan belum dinilai sebagai tinjauan. Simpan versi terbaru ke server terlebih dahulu.' : S.reviewRevision ? `${teacherReviewLabel(S.reviewStatus)} · revisi server ${S.reviewRevision}` : 'Draf belum tersimpan di server; tinjauan belum dapat dicatat.')}</p><p id="sg-teacher-review-detail">Ini catatan tinjauan Anda untuk versi tersebut, bukan pengesahan resmi atau jaminan kebenaran materi.</p><div class="ss-actions"><button type="button" data-teacher-review-action="reviewed" ${S.reviewBusy || syncClient?.conflict ? 'disabled' : ''}>Saya sudah meninjau</button><button type="button" data-teacher-review-action="rejected" ${S.reviewBusy || syncClient?.conflict ? 'disabled' : ''}>Tandai perlu perbaikan</button><button type="button" id="sg-review-history" ${!syncClient?.revision ? 'disabled' : ''}>Riwayat tinjauan</button></div></section>`;
}
async function loadTeacherReview() {
  const client = syncClient;
  const revision = client?.revision || 0;
  if (!client || !revision || client.conflict || S.reviewDirty) return;
  const key = `${S.owner}:${client.documentId}:${revision}`;
  if (S.reviewLoadedKey === key) return;
  S.reviewLoadedKey = key;
  const readToken = ++S.reviewReadToken;
  const editVersion = S.reviewEditVersion;
  try {
    const result = await fetchTeacherReview(api, 'presentation', client.documentId);
    if (S.owner !== owner() || client !== syncClient || client.revision !== revision || S.reviewEditVersion !== editVersion || S.reviewReadToken !== readToken || Number(result.revision) !== revision) return;
    S.reviewStatus = result.status === 'reviewed' || result.status === 'rejected' ? result.status : 'needs-review';
    S.reviewAction = result.action || null;
    S.reviewRevision = revision;
    updateTeacherReviewUi();
  } catch (_) {
    if (client === syncClient && S.owner === owner() && S.reviewEditVersion === editVersion && S.reviewReadToken === readToken) {
      S.reviewLoadedKey = '';
      const status = document.querySelector('#sg-teacher-review-status');
      if (status) status.textContent = 'Status tinjauan belum dapat dimuat. Coba muat ulang halaman sebelum meninjau.';
    }
  }
}
async function performTeacherReview(status) {
  const client = syncClient;
  const reviewOwner = S.owner;
  const documentId = client?.documentId;
  const editVersion = S.reviewEditVersion;
  if (!client || !documentId || owner() !== reviewOwner) return;
  clearTimeout(timer);
  const data = snapshot();
  if (!writeDraft(data, reviewOwner)) { showToast('Draf lokal belum tersimpan. Tinjauan ditunda.', 'error'); return; }
  const oldAction = S.pendingReviewAction;
  const pending = oldAction && oldAction.owner === reviewOwner && oldAction.documentId === documentId && oldAction.status === status && oldAction.editVersion === editVersion
    ? oldAction
    : { owner: reviewOwner, documentId, status, editVersion, mutationId: createDraftDocumentId() };
  S.pendingReviewAction = pending;
  S.reviewReadToken++;
  S.reviewBusy = true; updateTeacherReviewUi();
  writeDraft(snapshot(), reviewOwner);
  try {
    const action = await submitTeacherReview(api, {
      client, currentOwner: owner, ownerId: reviewOwner, module: 'presentation', documentId,
      payload: { config: data.config, deck: data.deck, template: data.template, outline: data.outline, index: data.index },
      title: data.deck.title || data.config.topik || 'Presentasi tanpa judul', status, mutationId: pending.mutationId,
      isCurrent: () => S.owner === reviewOwner && owner() === reviewOwner && syncClient === client && S.reviewEditVersion === editVersion,
    });
    S.pendingReviewAction = null;
    S.reviewAction = action; S.reviewStatus = action.status; S.reviewRevision = action.revision; S.reviewDirty = false;
    writeDraft(snapshot(), reviewOwner);
    showToast('Catatan tinjauan versi ini tersimpan. Ini bukan pengesahan resmi.', 'success');
  } catch (error) {
    if (error.code === 'REVISION_CONFLICT') { S.pendingReviewAction = null; S.reviewStatus = 'needs-review'; S.reviewDirty = true; writeDraft(snapshot(), reviewOwner); }
    showToast(error.message || 'Tinjauan belum tersimpan.', 'warning');
  } finally {
    S.reviewBusy = false;
    updateTeacherReviewUi();
  }
}
async function openTeacherReviewHistory() {
  const client = syncClient; const reviewOwner = S.owner;
  if (!client || owner() !== reviewOwner || !client.revision) return;
  const root = document.createElement('section'); root.className = 'ss-panel'; root.id = 'sg-review-history-dialog';
  root.innerHTML = '<h2 id="sg-review-history-title">Riwayat tinjauan guru</h2><p role="status">Memuat riwayat…</p>';
  document.body.append(root); openUiDialog(root, { labelledBy: 'sg-review-history-title', initialFocus: 'h2', onClose: () => root.remove() });
  try {
    const history = await fetchTeacherReviewHistory(api, 'presentation', client.documentId);
    if (!root.isConnected || client !== syncClient || owner() !== reviewOwner) return;
    root.innerHTML = `<h2 id="sg-review-history-title">Riwayat tinjauan guru</h2><p>Catatan ini berlaku per versi dan bukan pengesahan resmi.</p>${history.length ? `<ol>${history.map(item => `<li>Revisi ${Number(item.revision)} · ${esc(teacherReviewLabel(item.status))} · ${esc(item.created_at || '')}</li>`).join('')}</ol>` : '<p>Belum ada catatan tinjauan.</p>'}<button id="sg-review-history-close" type="button">Tutup</button>`;
    root.querySelector('#sg-review-history-close')?.addEventListener('click', () => closeUiDialog(root));
  } catch (error) { if (root.isConnected) root.querySelector('[role="status"]')?.replaceChildren(document.createTextNode(error.message || 'Riwayat tinjauan belum dapat dimuat.')); }
}
export function renderSlide() {
  if (!state.user) return '<div class="ss-panel"><h1>Media presentasi kelas SD</h1><p>Masuk untuk menyusun dan menyimpan slide pembelajaran.</p><button onclick="window.navigate(\'login\')">Masuk</button></div>';
  if (!S || S.owner !== owner()) {
    clearTimeout(timer); S = initial(); const draft = readDraft();
    if (draft) { S.config = materialConfig({ ...S.config, ...draft.config }); S.deck = normalizeDeck(draft.deck); S.template = resolveTemplateId(draft.template); S.outline = draft.outline || []; S.index = Math.max(0, Math.min(draft.index || 0, S.deck.slides.length - 1)); S.view = S.deck.slides.length ? 'editor' : 'brief'; S.saveStatus = 'Draf terakhir dimuat dari perangkat ini'; S.serverDocumentId = draft.serverDocumentId || ''; S.serverRevision = draft.serverRevision || 0; S.reviewEditVersion = draft.reviewEditVersion || 0; S.reviewDirty = !!draft.reviewDirty; S.pendingReviewAction = draft.pendingReviewAction || null; }
    initializeSyncClient();
  }
  window.slideGenState = S;
  return markup();
}
function header(title, description) {
  return `<header class="ss-header"><div><h1>${title}</h1><p>${description}</p><span class="ss-save-status" role="status">${esc(S.saveStatus)}</span></div><div class="ss-actions"><button id="sg-history">Riwayat Slide</button><button id="sg-server-drafts">Draf di server</button>${S.deck.slides.length ? '<button id="sg-save-checkpoint">Simpan checkpoint</button><button id="sg-new">Presentasi baru</button>' : ''}</div></header>`;
}
function modelSelect() {
  return `<label>Model AI<select id="sg-model-select" aria-describedby="sg-model-status">${S.providers.length ? S.providers.map(p => `<option value="${esc(p.slug)}"${selected(p.slug, S.config.aiProvider)}${Number(p.configured) === 0 ? ' disabled' : ''}>${esc(p.name)}${Number(p.configured) === 0 ? ' (belum dikonfigurasi)' : ''}</option>`).join('') : '<option value="">Memuat pilihan model…</option>'}</select></label><p id="sg-model-status" class="ss-model-status" role="status">${S.ready ? 'Model yang dipilih akan digunakan untuk permintaan ini.' : 'Memeriksa model yang tersedia…'}</p><button id="sg-reload-model" type="button">Muat ulang model</button>`;
}
function briefView() {
  return `${header('Studio Kelas Hidup', 'Mulai dari topik atau materi. Susun konsep, contoh konkret dan aktivitas dalam slide yang dapat dibaca di kelas.')}
    <div class="ss-brief"><form id="sg-brief-form" class="ss-panel"><h2>Pelajaran yang akan diajarkan</h2>
      <div class="ss-fields"><label>Kelas<select name="jenjangKelas">${[1, 2, 3, 4, 5, 6].map(i => `<option${selected(`Kelas ${i}`, S.config.jenjangKelas)}>Kelas ${i}</option>`).join('')}</select></label><label>Mata pelajaran<select name="mataPelajaran">${slideSubjects.map(v => `<option${selected(v, canonicalSlideSubject(S.config.mataPelajaran))}>${v}</option>`).join('')}</select></label></div>
      <label>Topik / materi<textarea id="sg-main-prompt" name="topik" rows="4" required maxlength="2000" placeholder="Contoh: pecahan sederhana dengan membagi kertas menjadi bagian sama besar">${esc(S.config.topik)}</textarea></label>
      <div class="ss-fields"><label>Jumlah slide<select name="slideCount">${[4, 6, 8, 10, 12, 15, 20].map(n => `<option value="${n}"${selected(n, Number(S.config.slideCount))}>${n} slide</option>`).join('')}</select></label><label>Format layar<select name="aspectRatio"><option value="16:9"${selected('16:9', S.config.aspectRatio)}>Lebar 16:9</option><option value="4:3"${selected('4:3', S.config.aspectRatio)}>Klasik 4:3</option></select></label></div>
      ${modelSelect()}<details><summary>Instruksi dan konteks tambahan</summary><div class="ss-fields"><label>Semester<select name="semester"><option${selected('1', S.config.semester)}>1</option><option${selected('2', S.config.semester)}>2</option></select></label><label>Alokasi waktu<input name="alokasiWaktu" value="${esc(S.config.alokasiWaktu)}" maxlength="100"></label></div><label>Instruksi tambahan<textarea name="extraInstructions" maxlength="2000" placeholder="Misalnya: alat hanya kertas; siswa belum memahami istilah pembilang">${esc(S.config.extraInstructions)}</textarea></label><label><input type="checkbox" name="usePhotos"${S.config.usePhotos ? ' checked' : ''}> Sertakan foto Unsplash jika tersedia dan relevan</label></details>
      <div class="ss-actions" style="margin-top:18px"><button type="submit" class="ss-primary" data-requires-ai>Buat slide</button></div>
    </form></div>`;
}
function preview(slide, template, index = 0, total = 8) { return sceneSvg(buildScene(slide, template, { index, total }), `Contoh ${getTemplate(template).name}: ${slide.title}`); }
function templatesView() {
  return `${header('Pilih desain untuk pelajaran', `${S.config.jenjangKelas} • ${S.config.mataPelajaran} • ${S.config.topik}`)}<div class="ss-actions" style="margin-bottom:18px"><button id="sg-back">Kembali ke brief</button>${S.outline.length ? '<button id="sg-edit-outline" type="button">Ubah kerangka</button>' : ''}</div><div class="ss-gallery">${Object.entries(slideTemplates).map(([id, t]) => {
    const demo = exampleDeck(id);
    return `<button class="ss-template" data-template="${id}" aria-pressed="${S.template === id}"><div class="ss-template-previews"><div class="ss-template-preview">${preview(demo.slides[0], id)}</div><div class="ss-template-preview">${preview(demo.slides[1], id, 1)}</div><div class="ss-template-preview">${preview(demo.slides[4], id, 4)}</div></div><strong>${t.name}</strong><p>${t.description}</p><p style="margin-top:8px">Contoh pembuka, konsep dan latihan</p></button>`;
  }).join('')}</div><div class="ss-panel ss-generation-bar"><div>${modelSelect()}</div><div><p id="sg-design-summary" style="margin-bottom:10px">${S.config.slideCount} slide • ${getTemplate(S.template).name}</p><button id="sg-generate" class="ss-primary" data-requires-ai>Buat slide pembelajaran</button></div></div>`;
}
function outlineView() {
  return `${header('Tinjau urutan pembelajaran', 'Perbaiki judul, materi setiap slide dan rencana visual sebelum memilih desain.')}<button id="sg-back-to-design">Kembali ke desain</button><form id="sg-outline-form" class="ss-panel" style="margin-top:18px">${S.outline.map((row, i) => `<div class="ss-outline-row" data-outline="${i}"><div class="ss-fields"><label>Judul slide ${i + 1}<input name="title" value="${esc(row.title)}" maxlength="85" required></label><label>Jenis slide<select name="layout">${slideLayouts.map(l => `<option value="${l.id}"${selected(l.id, row.layout)}>${l.name}</option>`).join('')}</select></label></div><label>Konsep atau kegiatan<input name="focus" value="${esc(row.focus)}" maxlength="500" required></label><label>Rencana visual<input name="visualConcept" value="${esc(row.visualConcept || '')}" maxlength="200"></label></div>`).join('')}<button type="submit" class="ss-primary" style="margin-top:18px">Simpan kerangka dan kembali ke desain</button></form>`;
}
const field = (name, label, value, area = false) => `<label>${label}${area ? `<textarea data-field="${name}">${esc(value)}</textarea>` : `<input data-field="${name}" value="${esc(value)}">`}</label>`;
function editorFields(slide) {
  let result = field('title', 'Judul', slide.title) + field('subtitle', 'Subjudul / refleksi', slide.subtitle);
  if (['content', 'summary', 'imageText', 'title', 'thankyou'].includes(slide.layout)) result += field('content', 'Poin materi (satu baris per poin)', slide.content.join('\n'), true);
  if (['twoColumn', 'comparison'].includes(slide.layout)) result += field('leftTitle', 'Judul kolom kiri', slide.leftTitle) + field('leftContent', 'Isi kiri (satu baris per poin)', slide.leftContent.join('\n'), true) + field('rightTitle', 'Judul kolom kanan', slide.rightTitle) + field('rightContent', 'Isi kanan', slide.rightContent.join('\n'), true);
  if (slide.layout === 'quiz') result += field('question', 'Pertanyaan', slide.question, true) + field('quizOptions', 'Pilihan (satu baris per pilihan)', slide.quizOptions.join('\n'), true) + field('quizAnswer', 'Jawaban, untuk guru (A, B, C atau D)', slide.quizAnswer) + field('quizExplanation', 'Pembahasan, untuk guru', slide.quizExplanation, true);
  if (slide.layout === 'activity') result += field('instruction', 'Instruksi aktivitas', slide.instruction, true) + field('time', 'Waktu', slide.time) + field('groupSize', 'Cara berkelompok', slide.groupSize) + field('materials', 'Alat / bahan', slide.materials);
  if (slide.layout === 'quote') result += field('quote', 'Definisi / kutipan', slide.quote, true) + field('author', 'Sumber kutipan (jika ada)', slide.author);
  const structured = ['timeline', 'stats', 'flipcard'].includes(slide.layout) ? slide.layout === 'timeline' ? 'timeline' : slide.layout === 'stats' ? 'stats' : 'flipcards' : null;
  if (structured) result += field(structured, structured === 'timeline' ? 'Tahap, format judul | penjelasan per baris' : structured === 'stats' ? 'Angka, format nilai | label | penjelasan' : 'Kartu, format istilah | jawaban per baris', slide[structured].map(r => structured === 'timeline' ? `${r.title} | ${r.desc}` : structured === 'stats' ? `${r.value} | ${r.label} | ${r.desc}` : `${r.front} | ${r.back}`).join('\n'), true);
  result += `<details${slide.visual ? ' open' : ''}><summary>Diagram pembelajaran</summary><label>Jenis diagram<select id="sg-visual-type">${[['', 'Tanpa diagram'], ['fraction', 'Pecahan'], ['numberLine', 'Garis bilangan'], ['process', 'Urutan proses'], ['cycle', 'Siklus'], ['concept', 'Konsep terkait']].map(([id, name]) => `<option value="${id}"${selected(id, slide.visual?.type || '')}>${name}</option>`).join('')}</select></label>${field('visual-label', 'Label diagram', slide.visual?.label || '')}${slide.visual?.type === 'fraction' ? field('visual-numerator', 'Pembilang', slide.visual.numerator) + field('visual-denominator', 'Penyebut (2 sampai 12)', slide.visual.denominator) : slide.visual?.type === 'numberLine' ? field('visual-min', 'Nilai awal', slide.visual.min) + field('visual-max', 'Nilai akhir', slide.visual.max) + field('visual-value', 'Posisi nilai', slide.visual.value) : slide.visual ? field('visual-nodes', 'Label tahap (satu baris per tahap)', slide.visual.nodes.map(n => n.label).join('\n'), true) : ''}</details>`;
  return result + field('speakerNotes', 'Catatan guru (tidak tampil kepada siswa)', slide.speakerNotes, true);
}
function issuesMarkup() {
  const issues = [...new Set([...deckIssues(S.deck), ...S.deck.slides.flatMap((s, i) => [false, ...(['quiz', 'flipcard'].includes(s.layout) ? [true] : [])].flatMap(reveal => buildScene(s, S.template, { aspectRatio: S.config.aspectRatio, reveal }).warnings.map(w => `Slide ${i + 1}: ${w}`)))])];
  const countNote = S.deck.meta?.requestedSlideCount && S.deck.meta.requestedSlideCount !== S.deck.slides.length ? `<p>Hasil berisi ${S.deck.slides.length} slide, dari target ${S.deck.meta.requestedSlideCount}. Sesuaikan jumlahnya di editor bila diperlukan.</p>` : '';
  return `<div class="ss-quality" id="sg-quality" role="status">${issues.length ? `<strong>Draf perlu dilengkapi: ${issues.length} hal perlu ditinjau sebelum ekspor</strong><ul>${issues.slice(0, 6).map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : 'Struktur dan bidang teks sudah diperiksa. Tinjau kebenaran materi dan kesesuaian kelas sebelum mengajar.'}${countNote}</div>${teacherReviewMarkup()}`;
}
function editorView() {
  const slide = S.deck.slides[S.index]; if (!slide) { S.view = 'brief'; return briefView(); }
  return `${header(esc(S.deck.title), 'Sunting satu slide, periksa catatan guru, lalu gunakan presenter atau unduh hasilnya.')}<div class="ss-actions" style="margin-bottom:12px"><button id="sg-open-presenter" class="ss-primary">Mulai mengajar</button><button id="sg-export-pptx">Unduh PPTX editable</button><button id="sg-export-html">Unduh HTML offline</button><button id="sg-save-archive">Simpan Riwayat</button><button id="sg-change-design">Ganti desain</button><span id="sg-save-status" class="ss-save-status" role="status">${esc(S.saveStatus)}</span></div>${issuesMarkup()}<div class="ss-editor"><div><div class="ss-canvas" id="sg-slide-render-area">${sceneSvg(buildScene(slide, S.template, { aspectRatio: S.config.aspectRatio, index: S.index, total: S.deck.slides.length, reveal: S.reveal }), slide.title)}</div><div class="ss-slide-control"><button id="sg-prev"${S.index === 0 ? ' disabled' : ''}>Sebelumnya</button><span>${S.index + 1} / ${S.deck.slides.length}</span><button id="sg-next"${S.index === S.deck.slides.length - 1 ? ' disabled' : ''}>Berikutnya</button>${['quiz', 'flipcard'].includes(slide.layout) ? `<button id="sg-reveal" aria-pressed="${S.reveal}">${S.reveal ? 'Tutup jawaban' : 'Buka jawaban dalam pratinjau'}</button>` : ''}</div><div class="ss-slide-strip" aria-label="Pilih slide">${S.deck.slides.map((row, i) => `<button data-slide="${i}" aria-current="${S.index === i}" aria-label="Slide ${i + 1}: ${esc(row.title)}">${preview(row, S.template, i, S.deck.slides.length)}<span>${i + 1}. ${esc(row.title)}</span></button>`).join('')}</div><div class="ss-actions"><button id="sg-move-left"${S.index === 0 ? ' disabled' : ''}>Geser ke kiri</button><button id="sg-move-right"${S.index === S.deck.slides.length - 1 ? ' disabled' : ''}>Geser ke kanan</button><button id="sg-add-slide">Tambah slide</button><button id="sg-delete-slide"${S.deck.slides.length <= 1 ? ' disabled' : ''}>Hapus slide ini</button></div></div><aside class="ss-panel"><h2>Sunting slide ${S.index + 1}</h2><label>Jenis slide<select id="sg-layout-select">${slideLayouts.map(l => `<option value="${l.id}"${selected(l.id, slide.layout)}>${l.name}</option>`).join('')}</select></label>${editorFields(slide)}<details><summary>Revisi dengan AI</summary>${modelSelect()}<label>Permintaan revisi<textarea id="sg-revision-instruction" placeholder="Contoh: gunakan benda di rumah dan sederhanakan istilah untuk kelas 3"></textarea></label><button id="sg-revise" data-requires-ai>Revisi slide ini</button></details></aside></div>`;
}
function markup() { return `<div id="slidegen-container" class="slide-classroom-studio">${S.view === 'brief' ? briefView() : S.view === 'templates' ? templatesView() : S.view === 'outline' ? outlineView() : editorView()}</div>`; }
function render() {
  const root = document.querySelector('#slidegen-container'); if (!root || S.owner !== owner()) return;
  root.outerHTML = markup(); initSlide();
}
function readBriefChange(event) {
  const input = event.target;
  if (!input.name) return;
  S.config[input.name] = input.type === 'checkbox' ? input.checked : input.name === 'slideCount' ? Number(input.value) : input.value;
  S.outline = []; changed();
}
function actionsReady() { document.querySelectorAll('[data-requires-ai]').forEach(b => { b.disabled = S.busy || !S.ready; }); }
async function models() {
  const select = document.querySelector('#sg-model-select'); if (!select) return;
  try {
    const res = await api('/ai-providers/active'); if (!select.isConnected || S.owner !== owner()) return;
    S.providers = Array.isArray(res.data) ? res.data : [];
    const usable = S.providers.filter(p => Number(p.configured) !== 0);
    if (!usable.some(p => p.slug === S.config.aiProvider)) S.config.aiProvider = usable[0]?.slug || '';
    S.ready = !!S.config.aiProvider;
    select.innerHTML = S.providers.length ? S.providers.map(p => `<option value="${esc(p.slug)}"${selected(p.slug, S.config.aiProvider)}${Number(p.configured) === 0 ? ' disabled' : ''}>${esc(p.name)}${Number(p.configured) === 0 ? ' (belum dikonfigurasi)' : ''}</option>`).join('') : '<option value="">Tidak ada model aktif</option>';
    select.value = S.config.aiProvider;
    const message = document.querySelector('#sg-model-status'); message.textContent = S.ready ? 'Model yang dipilih akan digunakan untuk permintaan ini.' : 'Belum ada model siap pakai. Minta admin mengaktifkan dan mengonfigurasi model di Panel Kontrol.'; message.dataset.error = String(!S.ready); actionsReady();
  } catch { if (select.isConnected) { S.ready = false; const msg = document.querySelector('#sg-model-status'); msg.textContent = 'Pilihan model belum dapat dimuat. Gunakan Muat ulang model untuk mencoba lagi.'; msg.dataset.error = 'true'; actionsReady(); } }
}
function readBrief() {
  const form = document.querySelector('#sg-brief-form'); if (!form?.reportValidity()) return false;
  const data = Object.fromEntries(new FormData(form)); S.config = { ...S.config, ...data, aiProvider: document.querySelector('#sg-model-select').value, slideCount: Number(data.slideCount), usePhotos: form.elements.usePhotos.checked }; S.outline = []; changed(); return true;
}
async function aiAction(title, fn) {
  if (S.busy || hasActiveAiJob()) { showToast('Tinjau hasil atau selesaikan proses AI yang masih terbuka terlebih dahulu.', 'info'); document.querySelector('#ai-job-status-button')?.click(); return; }
  if (!S.ready || !S.config.aiProvider) { showToast('Pilih model AI yang sudah dikonfigurasi.', 'error'); return; }
  S.busy = true; actionsReady();
  const monitor = openAiLiveMonitor({ title, subtitle: `${S.config.jenjangKelas} • ${S.config.mataPelajaran}. Draf perlu ditinjau guru.`, modelName: S.providers.find(p => p.slug === S.config.aiProvider)?.name, steps: [{ id: 1, label: 'Menyiapkan brief' }, { id: 2, label: 'Menyusun materi' }, { id: 3, label: 'Memeriksa struktur dan teks' }, { id: 4, label: 'Menyiapkan hasil' }] });
  try { await fn(monitor); } catch (error) { if (!monitor.signal.aborted) monitor.fail(error); } finally { S.busy = false; actionsReady(); }
}
async function generate() {
  await aiAction('Menyusun slide pembelajaran', async monitor => {
    let result;
    await streamPost('/presentation/generate-stream', { ...S.config, template: S.template, customOutline: S.outline.length ? S.outline : undefined }, (event, data) => {
      if (event === 'step') monitor.updateStep(data.step, data.title, data.message);
      if (event === 'token') monitor.appendToken(data.text);
      if (event === 'reset') monitor.reset(data.message);
      if (event === 'done') result = data.data;
    }, { signal: monitor.signal, jobId: monitor.id });
    if (!result) throw new Error('Hasil slide belum tersedia.');
    const quality = result.meta?.quality || {};
    const warnings = [...(quality.contentIssues || []), quality.countWarning, ...(quality.layoutWarnings || [])].filter(Boolean);
    const message = quality.partial ? 'Sebagian materi sudah tersedia. Lengkapi slide yang ditandai di editor sebelum ekspor.' : quality.layoutWarnings?.length ? 'Draf materi sudah tersedia. Rapikan bidang teks yang ditandai di editor sebelum ekspor.' : 'Draf materi tersedia untuk ditinjau.';
    monitor.complete(() => { S.deck = normalizeDeck(result, S.config.topik); S.index = 0; S.reveal = false; S.view = 'editor'; save(); render(); }, { partial: !!quality.partial, warnings: warnings.length ? [message, ...warnings.slice(0, 4)] : [], autoReview: true });
  });
}
async function outline() {
  if (!readBrief()) return;
  await aiAction('Menyusun kerangka slide', async monitor => {
    monitor.updateStep(2, '', 'Menyusun urutan konsep dan kegiatan.');
    const res = await api('/presentation/outline', { method: 'POST', body: JSON.stringify(S.config), signal: monitor.signal, timeout: 180000 });
    const rows = res?.data?.outline;
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Kerangka slide belum tersedia. brief tetap tersimpan; periksa topik lalu coba lagi.');
    monitor.complete(() => { S.outline = rows; S.view = 'templates'; save(); render(); }, { autoReview: true });
  });
}
async function revise() {
  const instruction = document.querySelector('#sg-revision-instruction')?.value.trim(); if (!instruction) { showToast('Tuliskan perubahan yang diinginkan.', 'info'); return; }
  const index = S.index;
  await aiAction('Merevisi satu slide', async monitor => {
    const res = await api('/presentation/patch-slide', { method: 'POST', body: JSON.stringify({ currentSlide: S.deck.slides[index], instruction, topik: S.config.topik.slice(0, 200), mataPelajaran: S.config.mataPelajaran, jenjangKelas: S.config.jenjangKelas, aiProvider: S.config.aiProvider }), signal: monitor.signal, timeout: 180000 });
    monitor.complete(() => { S.deck.slides[index] = normalizeSlide(res.data, index); S.reveal = false; save(); render(); }, { autoReview: true });
  });
}
function updateField(name, value) {
  const s = S.deck.slides[S.index];
  if (['content', 'leftContent', 'rightContent', 'quizOptions'].includes(name)) s[name] = value.split('\n').filter(v => v.trim());
  else if (['timeline', 'stats', 'flipcards'].includes(name)) s[name] = value.split('\n').filter(v => v.trim()).map(row => { const [a = '', b = '', c = ''] = row.split('|').map(v => v.trim()); return name === 'timeline' ? { title: a, desc: b } : name === 'stats' ? { value: a, label: b, desc: c } : { front: a, back: b }; });
  else if (name.startsWith('visual-')) { if (!s.visual) return; const key = name.slice(7); s.visual[key] = key === 'nodes' ? value.split('\n').filter(Boolean).map(label => ({ label })) : ['numerator', 'denominator', 'min', 'max', 'value'].includes(key) ? Number(value) : value; }
  else s[name] = value;
  const canvas = document.querySelector('#sg-slide-render-area'); canvas.innerHTML = sceneSvg(buildScene(s, S.template, { aspectRatio: S.config.aspectRatio, index: S.index, total: S.deck.slides.length, reveal: false }), s.title);
  document.querySelector('#sg-quality').outerHTML = issuesMarkup(); S.reveal = false; changed();
}
function move(delta) { S.index = Math.max(0, Math.min(S.deck.slides.length - 1, S.index + delta)); S.reveal = false; changed(); render(); }
function presenter() {
  const slides = S.deck.slides.map(s => normalizeSlide(s)); let index = S.index, reveal = false;
  const root = document.createElement('div'); root.id = 'sg-fullscreen-container'; root.className = 'ss-presenter hidden';
  root.innerHTML = '<h2 id="ss-presenter-title" class="sr-only">Presentasi kelas</h2><div id="ss-stage" class="ss-presenter-stage"></div><aside id="ss-notes" class="ss-presenter-notes" hidden></aside><nav aria-label="Kontrol presentasi"><button id="ss-close">Keluar</button><button id="ss-prev">Sebelumnya</button><span id="ss-position" aria-live="polite"></span><button id="ss-next">Berikutnya</button><button id="ss-answer" aria-pressed="false">Buka jawaban</button><button id="ss-teacher" aria-pressed="false">Catatan guru</button></nav>';
  const listeners = new AbortController(); document.body.append(root);
  const draw = () => { const slide = slides[index]; root.querySelector('#ss-stage').innerHTML = sceneSvg(buildScene(slide, S.template, { aspectRatio: S.config.aspectRatio, index, total: slides.length, reveal }), slide.title); root.querySelector('#ss-position').textContent = `${index + 1} / ${slides.length}`; root.querySelector('#ss-prev').disabled = index === 0; root.querySelector('#ss-next').disabled = index === slides.length - 1; const answer = root.querySelector('#ss-answer'); answer.hidden = !['quiz', 'flipcard'].includes(slide.layout); answer.textContent = reveal ? 'Tutup jawaban' : 'Buka jawaban'; answer.setAttribute('aria-pressed', String(reveal)); root.querySelector('#ss-notes').textContent = teacherNotes(slide) || 'Tidak ada catatan guru.'; };
  const next = d => { index = Math.max(0, Math.min(slides.length - 1, index + d)); reveal = false; draw(); };
  root.querySelector('#ss-close').onclick = () => closeUiDialog(root); root.querySelector('#ss-prev').onclick = () => next(-1); root.querySelector('#ss-next').onclick = () => next(1);
  root.querySelector('#ss-answer').onclick = () => { reveal = !reveal; draw(); };
  root.querySelector('#ss-teacher').onclick = () => { const notes = root.querySelector('#ss-notes'); notes.hidden = !notes.hidden; root.querySelector('#ss-teacher').setAttribute('aria-pressed', String(!notes.hidden)); };
  document.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || (event.key === ' ' && !event.target.closest('button'))) { event.preventDefault(); next(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); next(-1); } }, { signal: listeners.signal });
  openUiDialog(root, { labelledBy: 'ss-presenter-title', initialFocus: '#ss-close', onClose: () => { listeners.abort(); if (document.fullscreenElement === root) document.exitFullscreen?.(); root.remove(); } }); draw(); root.requestFullscreen?.().catch(() => {});
}
function showConflictActions() {
  if (!syncClient?.conflict || syncClient.conflict.documentId !== syncClient.documentId || document.querySelector('#sg-conflict-actions')) return;
  const status = document.querySelector('.ss-save-status');
  if (!status) return;
  const actions = document.createElement('div'); actions.id = 'sg-conflict-actions'; actions.className = 'ss-actions';
  actions.innerHTML = '<button type="button" id="sg-use-server-copy">Gunakan versi server</button><button type="button" id="sg-save-local-copy">Simpan draf lokal sebagai salinan baru</button>';
  status.after(actions);
  actions.querySelector('#sg-use-server-copy').addEventListener('click', async () => {
    try { const client = syncClient; const saved = await client.read(client.conflict.documentId); if (!confirm('Ganti draf di layar dengan versi server? Perubahan lokal tetap ada di perangkat ini.')) return; await restoreServerDraft(saved, client); }
    catch (error) { showToast(error.message || 'Tidak dapat memuat versi server.', 'error'); }
  });
  actions.querySelector('#sg-save-local-copy').addEventListener('click', () => { actions.remove(); S.serverDocumentId = createDraftDocumentId(); S.serverRevision = 0; initializeSyncClient(); save(); });
}
async function restoreServerDraft(saved, client = syncClient) {
  const activeOwner = S?.owner;
  await client.settled();
  if (!S || S.owner !== activeOwner || owner() !== activeOwner || syncClient !== client) return false;
  if (S && !preserveCurrentDraft()) return false;
  const payload = saved.payload || {};
  syncClient.adopt(saved); S.serverDocumentId = saved.document_id; S.serverRevision = saved.revision;
  S.config = materialConfig({ ...S.config, ...(payload.config || {}) });
  S.deck = normalizeDeck(payload.deck || { title: saved.title, slides: [] }, saved.title);
  S.template = resolveTemplateId(payload.template); S.outline = payload.outline || []; S.index = Math.max(0, Math.min(payload.index || 0, S.deck.slides.length - 1));
  S.view = S.deck.slides.length ? 'editor' : 'brief'; S.saveStatus = 'Draf server dipulihkan'; S.reviewDirty = false; S.reviewLoadedKey = ''; S.reviewStatus = 'needs-review'; S.reviewAction = null; S.reviewRevision = Number(saved.revision) || 0; S.pendingReviewAction = null; S.reviewReadToken++; writeDraft(snapshot(), S.owner); render(); return true;
}
async function flushAndCheckpoint() {
  const client = syncClient;
  const draftOwner = S.owner;
  clearTimeout(timer);
  const data = snapshot();
  if (!client || owner() !== draftOwner || !writeDraft(data, draftOwner)) throw new Error('Draf lokal belum tersimpan; checkpoint belum dibuat.');
  const saved = await client.sync({ config: data.config, deck: data.deck, template: data.template, outline: data.outline, index: data.index }, data.deck.title || data.config.topik || 'Presentasi tanpa judul');
  if (!saved || owner() !== draftOwner || S.owner !== draftOwner || syncClient !== client) throw new Error('Draf terbaru belum tersimpan di server. Checkpoint belum dibuat.');
  const checkpoint = await client.checkpoint();
  if (owner() !== draftOwner || S.owner !== draftOwner || syncClient !== client) throw new Error('Akun berubah sebelum checkpoint selesai.');
  return checkpoint;
}
async function openServerDrafts() {
  const client = syncClient;
  const root = document.createElement('section'); root.className = 'ss-panel'; root.id = 'sg-server-drafts-dialog';
  root.innerHTML = '<h2 id="sg-server-drafts-title">Draf presentasi di server</h2><p role="status">Memuat draf akun ini…</p>';
  document.body.append(root); openUiDialog(root, { labelledBy: 'sg-server-drafts-title', initialFocus: 'h2', onClose: () => root.remove() });
  try {
    const drafts = await client.list();
    if (client !== syncClient) { closeUiDialog(root); return; }
    if (!root.isConnected) return;
    root.innerHTML = `<h2 id="sg-server-drafts-title">Draf presentasi di server</h2><p>Hanya draf milik akun ini. Memulihkan draf akan mengganti isi yang sedang dibuka; draf lokal tetap tersimpan.</p><div>${drafts.length ? drafts.map((draft, index) => `<button type="button" class="ss-server-draft" data-index="${index}">${esc(draft.title)} · Revisi ${Number(draft.revision)} · ${esc(draft.server_updated_at || '')}</button>`).join('') : '<p>Belum ada draf presentasi di server.</p>'}</div><button type="button" id="sg-close-server-drafts">Tutup</button>`;
    root.querySelector('#sg-close-server-drafts').addEventListener('click', () => closeUiDialog(root));
    root.querySelectorAll('.ss-server-draft').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Buka draf server ini? Isi yang sedang terbuka akan diganti; draf lokal tetap tersimpan.')) return;
      try { if (client === syncClient && await restoreServerDraft(await client.read(drafts[Number(button.dataset.index)].document_id), client)) closeUiDialog(root); }
      catch (error) { showToast(error.message || 'Tidak dapat membuka draf server.', 'error'); }
    }));
  } catch (error) { if (root.isConnected) root.querySelector('[role="status"]')?.replaceChildren(document.createTextNode(`${error.message || 'Gagal memuat draf server.'} Draf lokal tidak berubah.`)); }
}
export function initSlide() {
  if (!S || !document.querySelector('#slidegen-container')) return;
  const subjectSelect = document.querySelector('#sg-brief-form [name="mataPelajaran"]');
  if (subjectSelect) {
    const subject = canonicalSlideSubject(S.config.mataPelajaran);
    subjectSelect.value = slideSubjects.includes(subject) ? subject : slideSubjects[4];
  }
  document.querySelector('.ss-slide-strip')?.setAttribute('role', 'group');
  if (syncClient?.conflict) showConflictActions();
  if (S.view === 'editor') loadTeacherReview();
  const on = (id, handler) => document.querySelector(`#${id}`)?.addEventListener('click', handler);
  on('sg-server-drafts', openServerDrafts);
  on('sg-history', () => openArchiveDrawer({ module: 'slide', moduleName: 'Slide', onSelect: item => { const content = item.content || {}; const deck = normalizeDeck(content.deck || content, item.title); if (!deck.slides.length) return showToast('Riwayat ini tidak mempunyai slide yang dapat dibuka.', 'error'); if (!preserveCurrentDraft()) return; S.serverDocumentId = createDraftDocumentId(); S.serverRevision = 0; S.deck = deck; S.template = resolveTemplateId(content.template); S.config = materialConfig({ ...S.config, ...item.inputData, ...content.config }); S.outline = content.outline || []; S.index = 0; S.view = 'editor'; initializeSyncClient(); save(); render(); queueMicrotask(() => document.querySelector('#sg-open-presenter')?.focus()); } }));
  on('sg-new', () => { if (confirm('Mulai presentasi baru? Draf saat ini tetap tersimpan sebagai draf terpisah.') && preserveCurrentDraft()) { clearTimeout(timer); S = initial(); S.serverDocumentId = createDraftDocumentId(); initializeSyncClient(); save(); render(); } });
    document.querySelector('#sg-brief-form')?.addEventListener('submit', event => { event.preventDefault(); outline(); });
  document.querySelector('#sg-brief-form')?.addEventListener('input', readBriefChange);
   on('sg-back', () => { S.view = 'brief'; render(); });
   on('sg-edit-outline', () => { S.view = 'outline'; render(); });
   on('sg-back-to-design', () => { S.view = 'templates'; render(); });
   document.querySelector('#sg-outline-form')?.addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; S.outline = [...form.querySelectorAll('[data-outline]')].map((row, i) => ({ index: i + 1, title: row.querySelector('[name=title]').value, layout: row.querySelector('[name=layout]').value, focus: row.querySelector('[name=focus]').value, visualConcept: row.querySelector('[name=visualConcept]').value })); S.view = 'templates'; changed(); render(); });
  document.querySelectorAll('[data-template]').forEach(button => button.addEventListener('click', () => { S.template = button.dataset.template; if (S.deck.slides.length) { S.view = 'editor'; save(); render(); } else { document.querySelectorAll('[data-template]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); document.querySelector('#sg-design-summary').textContent = `${S.config.slideCount} slide • ${getTemplate(S.template).name}`; changed(); } }));
  document.querySelector('#sg-model-select')?.addEventListener('change', event => { S.config.aiProvider = event.target.value; S.ready = !!S.config.aiProvider; changed(); actionsReady(); });
  on('sg-reload-model', models); if (document.querySelector('#sg-model-select')) models(); actionsReady();
  on('sg-generate', generate); on('sg-revise', revise); on('sg-prev', () => move(-1)); on('sg-next', () => move(1)); on('sg-reveal', () => { S.reveal = !S.reveal; render(); });
  on('sg-change-design', () => { S.view = 'templates'; render(); });
  document.querySelectorAll('[data-slide]').forEach(button => button.addEventListener('click', () => { S.index = Number(button.dataset.slide); S.reveal = false; changed(); render(); }));
  document.querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', event => updateField(input.dataset.field, event.target.value)));
  document.querySelector('#sg-layout-select')?.addEventListener('change', event => { S.deck.slides[S.index].layout = event.target.value; changed(); render(); });
  document.querySelector('#sg-visual-type')?.addEventListener('change', event => { const type = event.target.value; S.deck.slides[S.index].visual = type ? { type, label: '', numerator: 1, denominator: 4, min: 0, max: 10, value: 3, nodes: [{ label: '' }, { label: '' }] } : undefined; changed(); render(); });
  [['sg-move-left', -1], ['sg-move-right', 1]].forEach(([id, delta]) => on(id, () => { const target = S.index + delta; [S.deck.slides[S.index], S.deck.slides[target]] = [S.deck.slides[target], S.deck.slides[S.index]]; S.index = target; changed(); render(); }));
  on('sg-add-slide', () => { S.deck.slides.splice(S.index + 1, 0, normalizeSlide({ title: 'Gagasan baru', content: [], layout: 'content' })); S.index++; changed(); render(); });
  on('sg-delete-slide', () => { S.deck.slides.splice(S.index, 1); S.index = Math.min(S.index, S.deck.slides.length - 1); changed(); render(); });
  on('sg-save-archive', () => { save(); const saved = saveDocArchive({ module: 'slide', title: S.deck.title, subtitle: `${S.config.jenjangKelas} • ${S.deck.slides.length} slide`, inputData: S.config, content: { ...S.deck, template: S.template, outline: S.outline, config: S.config } }); showToast(saved ? 'Versi slide disimpan ke Riwayat perangkat ini.' : 'Riwayat belum tersimpan. Unduh hasil untuk menyimpan salinan.', saved ? 'success' : 'error'); });
  on('sg-save-checkpoint', async () => { try { await flushAndCheckpoint(); showToast('Checkpoint server berhasil disimpan.', 'success'); } catch (error) { showToast(error.message || 'Checkpoint belum tersimpan.', 'error'); } });
  document.querySelectorAll('[data-teacher-review-action]').forEach(button => button.addEventListener('click', () => performTeacherReview(button.dataset.teacherReviewAction)));
  on('sg-review-history', openTeacherReviewHistory);
  on('sg-open-presenter', presenter);
  on('sg-export-pptx', async event => { const button = event.currentTarget; button.disabled = true; try { await exportPptx(S.deck, S.template, S.config); showToast('PPTX siap diunduh. Jawaban dan pembahasan tersedia dalam catatan guru.', 'success'); } catch (error) { showToast(error.message, 'error'); } finally { button.disabled = false; } });
  on('sg-export-html', async event => { const button = event.currentTarget; button.disabled = true; try { const html = await htmlPresentation(S.deck, S.template, S.config); download(html, `${safeName(S.deck.title)}.html`, 'text/html;charset=utf-8'); showToast('HTML offline siap diunduh.', 'success'); } catch (error) { showToast(error.message, 'error'); } finally { button.disabled = false; } });
}
