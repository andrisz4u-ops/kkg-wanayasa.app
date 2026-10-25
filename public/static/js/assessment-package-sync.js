import { api, getCsrfToken } from './api.js';

export const ASSESSMENT_SAVE_LABELS = Object.freeze({
  unsaved: 'Belum disimpan',
  saving: 'Menyimpan…',
  saved: 'Tersimpan',
  failed: 'Gagal disimpan',
  conflict: 'Konflik revisi',
});
export const ASSESSMENT_PACKAGE_IMAGE_MAX_BYTES = 1_572_864;

const clone = value => JSON.parse(JSON.stringify(value ?? {}));
const uuid = () => globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 3 | 8)).toString(16);
});

export function createAssessmentAssetId() { return uuid(); }

export function canonicalAssessmentContent(content) {
  const copy = clone(content);
  delete copy._persistence;
  return copy;
}

/** Owner-scoped, debounced revision writer. Network/timer functions are injectable for tests. */
export class AssessmentPackageSync {
  constructor({
    request = api,
    fetcher = (...args) => fetch(...args),
    csrfToken = getCsrfToken,
    ownerProvider = null,
    debounceMs = 450,
    // Native timer functions must be wrapped: calling them as instance methods
    // (this.setTimer/this.clearTimer) makes `this` a plain object instead of the
    // global, which browsers reject with "TypeError: Illegal invocation".
    setTimer = (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimer = (id) => globalThis.clearTimeout(id),
    onStatus = () => {},
    onSaved = () => {},
    onConflict = () => {},
  } = {}) {
    this.request = request;
    this.fetcher = fetcher;
    this.csrfToken = csrfToken;
    this.ownerProvider = ownerProvider;
    this.debounceMs = debounceMs;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.onStatus = onStatus;
    this.onSaved = onSaved;
    this.onConflict = onConflict;
    this.context = null;
    this.timer = null;
    this.chain = Promise.resolve();
    this.version = 0;
    this.savedVersion = 0;
    this.snapshot = null;
    this.status = 'unsaved';
    this.error = null;
    this.imageWarnings = [];
  }

  setContext({ packageId = null, revision = null, owner = null, token = uuid(), clientDocumentId = uuid(), foreign = false, visibility = null } = {}) {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
    this.context = { packageId, revision, owner: owner == null ? null : String(owner), token, clientDocumentId, foreign, visibility };
    this.version = 0;
    this.savedVersion = 0;
    this.snapshot = null;
    this.error = null;
    this.imageWarnings = [];
    this.setStatus(packageId ? 'saved' : 'unsaved');
    return this.context;
  }

  current(token = this.context?.token) {
    if (!this.context || token !== this.context.token) return false;
    if (this.ownerProvider && this.context.owner != null && String(this.ownerProvider() ?? '') !== this.context.owner) return false;
    return true;
  }

  setStatus(status, error = null) {
    this.status = status;
    this.error = error;
    this.onStatus({ status, label: ASSESSMENT_SAVE_LABELS[status], error, context: this.context, imageWarnings: this.imageWarnings.slice() });
  }

  edit(content, metadata = {}) {
    if (!this.context) this.setContext();
    this.snapshot = { content: canonicalAssessmentContent(content), metadata: clone(metadata) };
    this.version++;
    this.setStatus('unsaved');
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = this.setTimer(() => {
      this.timer = null;
      this.flush().catch(() => {});
    }, this.debounceMs);
    return this.version;
  }

  flush() {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
    const token = this.context?.token;
    const operation = this.chain.then(() => this.savePending(token));
    this.chain = operation.catch(() => {});
    return operation;
  }

  async savePending(token) {
    if (!this.current(token)) return { stale: true };
    while (this.current(token) && this.snapshot && this.savedVersion < this.version) {
      const version = this.version;
      const draft = clone(this.snapshot);
      const context = this.context;
      const ownerAtStart = context.owner;
      this.setStatus('saving');
      try {
        let result;
        if (context.packageId) {
          result = await this.request(`/banksoal/${encodeURIComponent(context.packageId)}`, {
            method: 'PUT',
            body: { baseRevision: context.revision, content: draft.content },
          });
        } else {
          result = await this.request('/banksoal', {
            method: 'POST',
            body: {
              ...draft.metadata,
              content: draft.content,
              clientDocumentId: context.clientDocumentId,
            },
          });
        }
        const saved = result?.data || result;
        if (!this.current(token) || this.context.owner !== ownerAtStart) return { stale: true };
        if (!saved?.packageId || !Number.isInteger(Number(saved.revision)) || saved.saveStatus !== 'saved') {
          throw new Error('Server belum mengonfirmasi penyimpanan paket.');
        }
        context.packageId = saved.packageId;
        context.revision = Number(saved.revision);
        context.foreign = false;
        this.savedVersion = version;
        // A warning-free acknowledgement must clear earlier warnings, and the
        // server's canonical content is authoritative only while no newer edit
        // has been made locally.
        const currentAck = version === this.version;
        if (currentAck) this.imageWarnings = Array.isArray(saved.imageWarnings) ? saved.imageWarnings.slice(0, 200) : [];
        const canonical = currentAck && saved.content && typeof saved.content === 'object' ? clone(saved.content) : null;
        this.onSaved({ ...context }, {
          content: canonical || clone(draft.content),
          metadata: clone(draft.metadata),
          serverCanonical: Boolean(canonical),
          version,
        });
        if (version === this.version) this.setStatus('saved');
      } catch (error) {
        if (!this.current(token)) return { stale: true };
        if (Number(error?.status) === 409 || Number(error?.status) === 412 || error?.code === 'CONFLICT') {
          this.setStatus('conflict', error);
          this.onConflict({ error, context: { ...this.context }, local: clone(this.snapshot) });
        } else {
          this.setStatus('failed', error);
        }
        throw error;
      }
    }
    return { status: this.status, context: this.context && { ...this.context } };
  }

  retry() {
    if (this.status === 'conflict') return Promise.reject(this.error || new Error('Konflik revisi; muat versi server sebelum mencoba lagi.'));
    return this.flush();
  }

  async loadServer() {
    const context = this.context;
    if (!context?.packageId) throw new Error('Belum ada paket tersimpan di server.');
    const token = context.token;
    const result = await this.request(`/banksoal/${encodeURIComponent(context.packageId)}`);
    if (!this.current(token)) return { stale: true };
    const item = result?.data || result;
    return item;
  }

  async uploadImage(blob, { assetId = uuid(), name = '', type = blob?.type } = {}) {
    if (!(blob instanceof Blob)) throw new TypeError('Data gambar tidak valid.');
    const mime = String(type || blob.type || '').toLowerCase();
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) throw new Error('Unggah PNG, JPEG, atau WebP.');
    if (blob.size > ASSESSMENT_PACKAGE_IMAGE_MAX_BYTES) throw new Error('Ukuran gambar maksimal 1.5 MiB.');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assetId)) throw new Error('ID gambar tidak valid. Coba pilih file lagi.');
    const headers = { 'Content-Type': mime, 'X-Asset-Id': assetId };
    const token = this.csrfToken?.();
    if (token) headers['X-CSRF-Token'] = token;
    const controller = new AbortController();
    const timeout = this.setTimer(() => controller.abort(), 15000);
    let response;
    try {
      response = await this.fetcher('/api/assessment-assets', {
        method: 'POST', credentials: 'include', headers, body: blob, signal: controller.signal,
      });
    } catch {
      throw new Error('Gagal mengirim gambar untuk disimpan permanen. Periksa koneksi lalu coba lagi.');
    } finally { this.clearTimer(timeout); }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) throw new Error(payload.error?.message || payload.message || 'Gagal menyimpan gambar permanen.');
    const asset = payload.data || payload;
    if (!asset.assetId || !asset.url) throw new Error('Server belum mengembalikan identitas gambar permanen.');
    return { ...asset, title: name || undefined };
  }

  async uploadImageUrl(sourceUrl, { assetId = uuid(), name = '' } = {}) {
    const url = new URL(sourceUrl, globalThis.location?.origin || 'https://ruangkkg.my.id');
    const host = url.hostname.toLowerCase();
    const isAllowed = host === 'upload.wikimedia.org' || host === 'sewr2.vultrobjects.com' || /^[a-z0-9-]+\.vultrobjects\.com$/.test(host);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !isAllowed) {
      throw new Error('Sumber gambar ini tidak dapat disimpan permanen. Unggah file asli atau pilih diagram dari galeri.');
    }
    const controller = new AbortController();
    const timeout = this.setTimer(() => controller.abort(), 10000);
    let reader;
    try {
      const response = await this.fetcher(url.href, { method: 'GET', mode: 'cors', credentials: 'omit', redirect: 'error', signal: controller.signal });
      if (!response.ok || !response.body) throw new Error('Gambar sumber tidak dapat diakses. Unggah file asli atau pilih gambar lain.');
      const mime = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime || '')) throw new Error('Sumber harus berupa PNG, JPEG, atau WebP.');
      reader = response.body.getReader();
      const chunks = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > ASSESSMENT_PACKAGE_IMAGE_MAX_BYTES) throw new Error('Ukuran gambar maksimal 1.5 MiB.');
        chunks.push(value);
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return await this.uploadImage(new Blob([bytes], { type: mime }), { assetId, name, type: mime });
    } catch (error) {
      await reader?.cancel().catch(() => {});
      if (error instanceof Error && /1\.5 MiB|PNG, JPEG|Unggah file asli|Gambar sumber/.test(error.message)) throw error;
      throw new Error('Gambar sumber tidak dapat diakses. Unggah file asli atau pilih gambar lain.');
    } finally {
      try { reader?.releaseLock(); } catch {}
      this.clearTimer(timeout);
    }
  }
}

export function createAssessmentPackageSync(options) {
  return new AssessmentPackageSync(options);
}
