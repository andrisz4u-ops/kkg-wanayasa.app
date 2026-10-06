import { getCsrfToken, refreshCsrfToken } from './api.js';

export class SseParser {
  constructor(onEvent) { this.buffer = ''; this.onEvent = onEvent; }
  feed(text, final = false) {
    this.buffer += text;
    this.buffer = this.buffer.replace(/\r\n/g, '\n').replace(final ? /\r/g : /\r(?!$)/g, '\n');
    let boundary;
    while ((boundary = this.buffer.indexOf('\n\n')) >= 0) {
      this.dispatch(this.buffer.slice(0, boundary));
      this.buffer = this.buffer.slice(boundary + 2);
    }
    if (final && this.buffer) { this.dispatch(this.buffer); this.buffer = ''; }
  }
  dispatch(frame) {
    let event = 'message';
    const data = [];
    for (const line of frame.split('\n')) {
      if (!line || line.startsWith(':')) continue;
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      let value = colon < 0 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'event') event = value;
      if (field === 'data') data.push(value);
    }
    if (!data.length) return;
    let payload = data.join('\n');
    try { payload = JSON.parse(payload); } catch {}
    this.onEvent(event, payload);
  }
}

const activeRequests = new Set();
export async function streamPost(endpoint, data, onEvent, options = {}) {
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  if (activeRequests.has(url)) throw new Error('Proses ini masih berjalan. Tunggu atau batalkan sebelum memulai lagi.');
  activeRequests.add(url);
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal.reason || new DOMException('Proses dibatalkan.', 'AbortError'));
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  let reader, timer, completed = false, started = false, serverFailure = false;
  const cancelReader = () => { reader?.cancel(controller.signal.reason).catch(() => {}); };
  controller.signal.addEventListener('abort', cancelReader, { once: true });
  const armTimeout = () => {
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(new DOMException('Koneksi tidak mengirim kabar. Coba lagi saat jaringan stabil.', 'TimeoutError')), options.idleTimeout ?? 120000);
  };
  const jobId = options.jobId || crypto.randomUUID();
  try {
    controller.signal.throwIfAborted();
    let csrf = await getCsrfToken();
    controller.signal.throwIfAborted();
    const send = () => fetch(url, {
      method: 'POST', credentials: 'include', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '', 'X-AI-Job-Id': jobId },
      body: JSON.stringify(data),
    });
    armTimeout();
    let response = await send();
    if (response.status === 403) {
      const body = await response.clone().json().catch(() => ({}));
      if (/csrf/i.test(body?.error?.message || body?.error || body?.message || '')) {
        csrf = await refreshCsrfToken();
        controller.signal.throwIfAborted();
        response = await send();
      }
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(body?.error?.message || body?.message || (typeof body?.error === 'string' ? body.error : `Permintaan gagal (${response.status}).`));
      error.status = response.status;
      error.code = body?.error?.code || body?.code;
      error.details = body?.error?.details || body?.details;
      throw error;
    }
    reader = response.body?.getReader();
    if (!reader) throw new Error('Browser ini belum dapat menerima aliran hasil. Gunakan browser terbaru.');
    started = true;
    const decoder = new TextDecoder();
    const parser = new SseParser((event, payload) => {
      controller.signal.throwIfAborted();
      if (payload?.jobId && payload.jobId !== jobId) return;
      if (event === 'error') serverFailure = true;
      onEvent(event, payload);
      if (event === 'done') completed = true;
      if (event === 'error') {
        const error = new Error(payload?.message || 'Penyusunan belum berhasil. Silakan coba lagi.');
        error.code = payload?.code; error.status = payload?.status; error.details = payload?.details;
        throw error;
      }
    });
    while (!completed) {
      const chunk = await reader.read();
      controller.signal.throwIfAborted();
      if (chunk.done) { parser.feed(decoder.decode(), true); break; }
      armTimeout();
      parser.feed(decoder.decode(chunk.value, { stream: true }));
    }
    if (!completed) throw new Error('Koneksi terputus sebelum hasil selesai. Hasil belum dinyatakan lengkap; coba lagi saat jaringan stabil.');
  } catch (error) {
    if (started && !controller.signal.aborted && options.jobId && !serverFailure) {
      try {
        const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000);
        const response = await fetch(`/api/ai-jobs/${encodeURIComponent(jobId)}`, { credentials: 'include', signal });
        const status = await response.json();
        if (response.ok && status.success && ['completed', 'partial'].includes(status.data?.state) && status.data.result) {
          await onEvent('done', { ...status.data.result, recovered: true });
          return;
        }
      } catch { }
    }
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', cancelReader);
    await reader?.cancel().catch(() => {});
    activeRequests.delete(url);
  }
}
