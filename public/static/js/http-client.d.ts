export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | object | null;
  timeout?: number;
  _retryCount?: number;
}
export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(message: string, code?: string, status?: number);
}
export function getCsrfToken(): string | null;
export function refreshCsrfToken(): Promise<string | null>;
export function responseError(data: any, status: number, retryAfter?: string): ApiError;
export function request(path: string, options?: RequestOptions): Promise<Response>;
