import { streamSSE } from 'hono/streaming';
import type { Context } from 'hono';
import { requireSession } from './session-middleware';
import type { AIService } from '../services/ai';

export { requireSession };
type JobRow = { request_hash: string; state: string; result_json: string | null };
const canonical = (value: any): any => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export async function createStreamJob(c: Context<any>, operation: string, input: unknown) {
  const db = c.env.DB as D1Database;
  const user = c.get('user');
  const id = c.req.header('X-AI-Job-Id') || crypto.randomUUID();
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(id)) return { response: c.json({ success: false, message: 'Identitas proses tidak valid.' }, 400) };
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ operation, input: canonical(input) }))))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const now = Math.floor(Date.now() / 1000);
  await db.prepare("UPDATE ai_generation_jobs SET state = 'failed' WHERE state = 'running' AND lease_until < ?").bind(now).run();
  await db.prepare("DELETE FROM ai_generation_jobs WHERE expires_at < ? AND state != 'running'").bind(now).run();
  const previous = await db.prepare('SELECT request_hash, state, result_json FROM ai_generation_jobs WHERE user_id = ? AND job_id = ?').bind(user.id, id).first<JobRow>();
  if (previous) {
    if (previous.request_hash !== hash) return { response: c.json({ success: false, message: 'Identitas proses sudah digunakan untuk masukan lain.' }, 409) };
    if (['completed', 'partial'].includes(previous.state) && previous.result_json) {
      return { response: streamSSE(c, async stream => { await stream.writeSSE({ event: 'done', data: previous.result_json! }); }) };
    }
    return { response: c.json({ success: false, message: previous.state === 'running' ? 'Proses ini masih berjalan. Tunggu hasil atau batalkan.' : 'Proses sebelumnya sudah berakhir. Mulai ulang dengan identitas proses baru.' }, 409) };
  }
  try {
    await db.prepare("INSERT INTO ai_generation_jobs(user_id, job_id, operation, request_hash, state, lease_until, expires_at) VALUES(?, ?, ?, ?, 'running', ?, ?)").bind(user.id, id, operation, hash, now + 90, now + 86400).run();
  } catch (error: any) {
    if (/UNIQUE|PRIMARY KEY/i.test(error.message)) return { response: c.json({ success: false, message: 'Masih ada proses AI yang berjalan. Tinjau atau batalkan terlebih dahulu.' }, 409) };
    throw error;
  }
  const controller = new AbortController();
  let timer: ReturnType<typeof setInterval> | undefined;
  let settled = false;
  const writeState = async (state: string, result?: unknown) => {
    const update = await db.prepare("UPDATE ai_generation_jobs SET state = ?, result_json = ?, lease_until = ? WHERE user_id = ? AND job_id = ? AND state = 'running'").bind(state, result ? JSON.stringify(result) : null, Math.floor(Date.now() / 1000), user.id, id).run();
    if (['completed', 'partial'].includes(state) && update.meta.changes === 0) {
      const error = new DOMException('Proses sudah tidak memiliki izin untuk menyimpan hasil.', 'AbortError');
      controller.abort(error);
      clearInterval(timer);
      throw error;
    }
    settled = true;
    clearInterval(timer);
  };
  const abort = () => {
    if (settled) return;
    controller.abort(new DOMException('Permintaan dibatalkan.', 'AbortError'));
    clearInterval(timer);
    void writeState('cancelled').catch(error => console.error('[AI-JOB] Failed to record cancellation', error));
  };
  c.req.raw.signal.addEventListener('abort', abort, { once: true });
  if (c.req.raw.signal.aborted) abort();
  return {
    id, signal: controller.signal,
    attach(stream: any, ai: AIService) {
      stream.onAbort(abort);
      ai.setAbortSignal(controller.signal, () => stream.writeSSE({ event: 'reset', data: JSON.stringify({ jobId: id, message: 'Model mengulang penyusunan; catatan sebelumnya diganti.' }) }).catch(abort));
      timer = setInterval(() => {
        if (settled || controller.signal.aborted) return;
        void db.prepare("UPDATE ai_generation_jobs SET lease_until = ? WHERE user_id = ? AND job_id = ? AND state = 'running'").bind(Math.floor(Date.now() / 1000) + 90, user.id, id).run().then(result => { if (!settled && result.meta.changes === 0) abort(); }).catch(error => { console.error('[AI-JOB] Lease update failed', error); abort(); });
        void stream.write(': heartbeat\n\n').catch(abort);
      }, 15000);
      const wrapped = Object.create(stream);
      wrapped.writeSSE = async (frame: { event?: string; data: string }) => {
        controller.signal.throwIfAborted();
        let payload;
        try { payload = JSON.parse(frame.data); } catch { payload = { message: frame.data }; }
        const data = { ...payload, jobId: id };
        if (frame.event === 'done') await writeState(data.partial ? 'partial' : 'completed', data);
        if (frame.event === 'error') await writeState('failed');
        return stream.writeSSE({ ...frame, data: JSON.stringify(data) });
      };
      return wrapped;
    },
    async dispose() {
      clearInterval(timer);
      c.req.raw.signal.removeEventListener('abort', abort);
      if (!settled) await writeState(controller.signal.aborted ? 'cancelled' : 'failed');
    },
  };
}
