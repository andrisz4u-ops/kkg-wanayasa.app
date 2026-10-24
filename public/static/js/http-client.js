// Shared same-origin transport for JSON, multipart uploads and binary exports.
let refreshingCsrf;
const preAuthPaths = new Set(['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password']);

export class ApiError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function getCsrfToken() {
  if (typeof document === 'undefined') return null;
  return document.cookie.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith('csrf_token='))?.slice('csrf_token='.length) || null;
}

export function refreshCsrfToken() {
  if (!refreshingCsrf) {
    refreshingCsrf = (async () => {
      try {
        const response = await fetch('/api/auth/csrf-token', { credentials: 'include', signal: AbortSignal.timeout(10000) });
        if (!response.ok) return null;
        const data = await response.json();
        return data.data?.csrf_token || null;
      } catch {
        return null;
      }
    })().finally(() => { refreshingCsrf = undefined; });
  }
  return refreshingCsrf;
}

function apiUrl(path) {
  if (typeof path !== 'string' || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path) || path.includes('\\')) {
    throw new ApiError('Alamat API harus berada pada aplikasi yang sama.', 'INVALID_API_URL', 0);
  }
  const relative = path.replace(/^\/?api\//, '').replace(/^\//, '');
  const url = new URL(`/api/${relative}`, 'https://same-origin.invalid');
  if (!url.pathname.startsWith('/api/')) throw new ApiError('Alamat API tidak valid.', 'INVALID_API_URL', 0);
  return url.pathname + url.search;
}

export function responseError(data, status, retryAfter = '60') {
  let message = data?.error?.message || data?.message || (status === 429 ? `Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.` : `Permintaan gagal (${status}).`);
  const details = data?.error?.details;
  if (Array.isArray(details)) {
    const messages = details.map(detail => typeof detail === 'string' ? detail : detail.message).filter(Boolean);
    if (messages.length) message += ` (${messages.join(', ')})`;
  }
  const error = new ApiError(message, data?.error?.code || (status === 429 ? 'RATE_LIMITED' : 'UNKNOWN_ERROR'), status);
  error.details = details;
  return error;
}

/** Returns the original Response. Its signal also covers binary body consumption. */
export async function request(path, options = {}) {
  const url = apiUrl(path);
  const { timeout, _retryCount, ...fetchOptions } = options;
  const method = (options.method || 'GET').toUpperCase();
  const changesState = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const needsCsrf = changesState && !preAuthPaths.has(url.split('?')[0]);
  const headers = new Headers(options.headers);
  let body = options.body;
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    headers.delete('Content-Type'); // The browser owns the multipart boundary.
  } else if (body && (Array.isArray(body) || Object.prototype.toString.call(body) === '[object Object]')) {
    body = JSON.stringify(body);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }
  const timeoutMs = timeout ?? (/analisis-cp|generate|extract|lampiran|kisi/.test(url) ? 120000 : 30000);
  const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
  signal.throwIfAborted();
  if (needsCsrf) {
    const token = headers.get('X-CSRF-Token') || getCsrfToken() || await refreshCsrfToken();
    signal.throwIfAborted();
    if (token) headers.set('X-CSRF-Token', token);
  }
  const send = () => fetch(url, { ...fetchOptions, method, headers, body, credentials: 'include', signal });
  let response;
  try {
    // A network retry is safe only for reads. POSTs are never retried here.
    try { response = await send(); }
    catch (error) {
      if (!['GET', 'HEAD'].includes(method) || signal.aborted) throw error;
      response = await send();
    }
    if (response.status === 403 && needsCsrf) {
      const data = await response.clone().json().catch(() => null);
      if (['CSRF_MISSING', 'CSRF_INVALID'].includes(data?.error?.code) && !(body && typeof body.getReader === 'function')) {
        const token = await refreshCsrfToken();
        signal.throwIfAborted();
        if (token) {
          await response.body?.cancel();
          headers.set('X-CSRF-Token', token);
          response = await send(); // Exactly once, after rejection before the route handler.
        }
      }
    }
  } catch (error) {
    if (options.signal?.aborted) throw options.signal.reason || error;
    throw new ApiError(signal.aborted ? 'Request timeout. Server terlalu lama merespons.' : 'Gagal menghubungi server. Periksa koneksi internet Anda.', 'NETWORK_ERROR', 0);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw responseError(data, response.status, response.headers.get('Retry-After') || '60');
  }
  return response;
}
