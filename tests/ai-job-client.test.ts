import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SseParser, streamPost } from '../public/static/js/ai-stream.js';
import { openAiLiveMonitor, hasActiveAiJob } from '../public/static/js/ai-live-monitor.js';
import { mountFeatureDesign } from '../public/static/js/feature-design.js';
import { refreshCsrfToken } from '../public/static/js/api.js';

vi.mock('../public/static/js/api.js', async importOriginal => ({ ...await importOriginal<typeof import('../public/static/js/api.js')>(), getCsrfToken: vi.fn(async () => 'csrf-first'), refreshCsrfToken: vi.fn(async () => 'csrf-refreshed') }));
let monitor: any;
beforeEach(() => { vi.clearAllMocks(); document.body.innerHTML = '<div id="app"><main id="main-content"><button id="trigger">Buat</button><form><label>Topik<input name="topik" value="Pecahan"></label></form></main></div>'; });
afterEach(() => { monitor?.close(); monitor = null; mountFeatureDesign('home', document.body); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); document.body.innerHTML = ''; });
const sse = (text: string) => new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(text)); controller.close(); } }), { headers: { 'Content-Type': 'text/event-stream' } });

describe('SSE frame parsing and transport lifecycle', () => {
  it('accepts split CRLF, optional spaces, multiline JSON, comments and EOF without a trailing delimiter', () => {
    const events: any[] = [];
    const parser = new SseParser((...event: any[]) => events.push(event));
    for (const character of ': heartbeat\r\nevent:step\r\ndata:{\r\ndata:"step":6\r\ndata:}\r\n\r\nevent:done\r\ndata:{"ok":true}') parser.feed(character);
    parser.feed('', true);
    expect(events).toEqual([['step', { step: 6 }], ['done', { ok: true }]]);
  });
  it('refreshes CSRF once using the same job identity and accepts UTF-8 split across bytes', async () => {
    const bytes = new TextEncoder().encode('event:done\ndata:{"text":"Guru 📘"}\n\n');
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'CSRF token expired' } }), { status: 403 })).mockResolvedValueOnce(new Response(new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close(); } })));
    vi.stubGlobal('fetch', fetch);
    const events = vi.fn();
    await streamPost('/rpp/generate-stream', {}, events, { jobId: 'job-test-utf8' });
    expect(refreshCsrfToken).toHaveBeenCalledOnce();
    expect(events).toHaveBeenCalledWith('done', { text: 'Guru 📘' });
    expect(fetch.mock.calls.map(call => call[1].headers['X-AI-Job-Id'])).toEqual(['job-test-utf8', 'job-test-utf8']);
    expect(fetch.mock.calls[1][1].credentials).toBe('include');
  });
  it('aborts a blocked reader, cancels its stream and releases the duplicate-request guard', async () => {
    const cancelled = vi.fn();
    let fetchSignal: AbortSignal;
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => { fetchSignal = options.signal; return new Response(new ReadableStream({ cancel: cancelled })); }));
    const controller = new AbortController();
    const pending = streamPost('/rpp/generate-stream', {}, vi.fn(), { signal: controller.signal });
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(fetchSignal!).toBeDefined());
    await expect(streamPost('/rpp/generate-stream', {}, vi.fn())).rejects.toThrow('masih berjalan');
    controller.abort(new DOMException('Dibatalkan', 'AbortError'));
    await rejected;
    expect(cancelled).toHaveBeenCalledOnce();
    expect(fetchSignal!.aborted).toBe(true);
    vi.stubGlobal('fetch', vi.fn(async () => sse('event:done\ndata:{}\n\n')));
    await expect(streamPost('/rpp/generate-stream', {}, vi.fn())).resolves.toBeUndefined();
  });
  it('does not declare a disconnected or server-error result complete', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sse('event:token\ndata:{"text":"draf"}\n\n')));
    await expect(streamPost('/test', {}, vi.fn())).rejects.toThrow('belum dinyatakan lengkap');
    vi.stubGlobal('fetch', vi.fn(async () => sse('event:error\ndata:{"message":"Bagian belum lengkap"}\n\n')));
    await expect(streamPost('/test', {}, vi.fn())).rejects.toThrow('Bagian belum lengkap');
  });
  it('keeps the output-validation cause on an SSE error instead of presenting it as a connection failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sse('event:error\ndata:{"message":"Draf belum lolos pemeriksaan isi: jawaban kuis belum tersedia.","code":"AI_OUTPUT_INVALID","status":422,"details":["Slide 3: lengkapi jawaban"]}\n\n')));
    await expect(streamPost('/presentation/generate-stream', {}, vi.fn())).rejects.toMatchObject({ code: 'AI_OUTPUT_INVALID', status: 422, details: ['Slide 3: lengkapi jawaban'] });
  });
});

describe('Teacher-facing monitor ownership and accessibility', () => {
  it('explains a material-validation failure truthfully and retains the brief', () => {
    monitor = openAiLiveMonitor();
    monitor.fail(Object.assign(new Error('Draf belum lolos pemeriksaan isi: lengkapi jawaban kuis.'), { code: 'AI_OUTPUT_INVALID', status: 422 }));
    expect(document.querySelector('#monitor-error')!.textContent).toContain('isinya belum lengkap');
    expect(document.querySelector('#monitor-error')!.textContent).not.toContain('Periksa koneksi');
    expect(document.querySelector<HTMLInputElement>('[name=topik]')!.value).toBe('Pecahan');
  });
  it('tracks all six stages, hides without cancellation, traps focus, and returns to its trigger', () => {
    document.querySelector<HTMLButtonElement>('#trigger')!.focus();
    monitor = openAiLiveMonitor({ title: 'Menyusun Asesmen', steps: Array.from({ length: 6 }, (_, i) => ({ label: `Tahap ${i + 1}` })) });
    monitor.updateStep(6, 'Server', '', 100);
    expect(document.querySelector('#step-node-6')!.getAttribute('data-state')).toBe('active');
    expect(document.querySelector('#ai-live-monitor-modal')!.getAttribute('role')).toBe('dialog');
    expect(document.querySelector('#app')!.hasAttribute('inert')).toBe(true);
    const buttons = document.querySelectorAll<HTMLButtonElement>('.ai-monitor-footer button:not([hidden])');
    buttons[buttons.length - 1].focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement!.closest('#ai-live-monitor-modal')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(monitor.signal.aborted).toBe(false);
    expect(document.activeElement!.id).toBe('trigger');
    expect(document.querySelector('#ai-job-status-button')).not.toBeNull();
    monitor.show();
    document.querySelector<HTMLButtonElement>('#monitor-cancel-btn')!.click();
    expect(monitor.signal.aborted).toBe(true);
    expect(monitor.state).toBe('cancelled');
  });
  it('retains partial results for explicit review and never lets a stale callback close another monitor', () => {
    vi.useFakeTimers();
    const review = vi.fn();
    monitor = openAiLiveMonitor({ steps: [{ label: 'Isi' }, { label: 'Tinjau' }] });
    monitor.complete(review, { partial: true, warnings: ['Isian belum tersedia'] });
    expect(hasActiveAiJob()).toBe(true);
    expect(document.querySelector('#monitor-message')!.textContent).toContain('Isian belum tersedia');
    expect(() => openAiLiveMonitor()).toThrow('Masih ada proses');
    const old = monitor;
    monitor.close();
    monitor = openAiLiveMonitor();
    old.complete(review);
    vi.advanceTimersByTime(1000);
    expect(document.querySelector('#ai-live-monitor-modal')).not.toBeNull();
    expect(review).not.toHaveBeenCalled();
  });
  it('keeps technical logs opt-in, character counts chunk-independent, and UI outside generic styling', async () => {
    monitor = openAiLiveMonitor();
    for (let i = 0; i < 100; i++) monitor.appendToken('a');
    await vi.waitFor(() => expect(document.querySelector('#monitor-token-count')!.textContent).toBe('100 karakter diterima'));
    expect(document.querySelector('details')!.open).toBe(false);
    expect(document.querySelector('#monitor-terminal')!.textContent).toBe('');
    const html = document.querySelector('#ai-live-monitor-modal')!.outerHTML;
    mountFeatureDesign('rpp', document.querySelector('#app'));
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(document.querySelector('#ai-live-monitor-modal')!.outerHTML).toBe(html);
    expect(document.querySelector('#ai-live-monitor-modal .fw-ui')).toBeNull();
  });
  it('waits for an asynchronously restored origin page before reviewing a retained result', async () => {
    const root = document.querySelector<HTMLElement>('#main-content')!;
    root.dataset.featurePage = 'rpp';
    monitor = openAiLiveMonitor();
    const review = vi.fn(() => expect(root.dataset.featurePage).toBe('rpp'));
    monitor.complete(review);
    root.dataset.featurePage = 'kalender';
    const navigate = vi.fn(() => { setTimeout(() => { root.dataset.featurePage = 'rpp'; }, 20); });
    vi.stubGlobal('navigate', navigate);
    document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.click();
    expect(review).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(review).toHaveBeenCalledOnce());
    expect(navigate).toHaveBeenCalledWith('rpp');
    expect(document.querySelector('#ai-live-monitor-modal')).toBeNull();
  });
  it('retains a result if its review callback fails and permits a subsequent successful review', async () => {
    monitor = openAiLiveMonitor();
    const review = vi.fn().mockRejectedValueOnce(new Error('Tampilan belum siap')).mockResolvedValueOnce(undefined);
    monitor.complete(review);
    document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#monitor-error')!.textContent).toContain('Draf masih tersedia'));
    expect(hasActiveAiJob()).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.disabled).toBe(false);
    document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#ai-live-monitor-modal')).toBeNull());
    expect(review).toHaveBeenCalledTimes(2);
  });
  it('automatically proceeds to canvas review on completion without needing manual confirmation button', async () => {
    const root = document.querySelector<HTMLElement>('#main-content')!;
    root.dataset.featurePage = 'kisi';
    monitor = openAiLiveMonitor({ title: 'Menyusun Asesmen' });
    const review = vi.fn();
    monitor.complete(review);
    expect(review).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(review).toHaveBeenCalledOnce());
    expect(document.querySelector('#ai-live-monitor-modal')).toBeNull();
    expect(hasActiveAiJob()).toBe(false);
  });
});
