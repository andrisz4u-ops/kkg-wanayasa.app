export interface ApiRequestOptions extends RequestInit {
  body?: BodyInit | Record<string, unknown>;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code?: string, status?: number);
}

export function api<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T>;
export function refreshCsrfToken(): Promise<string | null>;
export function getCsrfToken(): string | null;
