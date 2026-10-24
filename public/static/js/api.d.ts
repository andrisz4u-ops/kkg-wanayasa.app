import type { RequestOptions } from './http-client.js';
export type ApiRequestOptions = RequestOptions;
export { ApiError, refreshCsrfToken, getCsrfToken } from './http-client.js';

export function api<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T>;
export function apiFetch(path: string, options?: ApiRequestOptions): Promise<Response>;
