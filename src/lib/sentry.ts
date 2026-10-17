import { setAsyncLocalStorageAsyncContextStrategy, type CloudflareOptions } from '@sentry/cloudflare';
import { wrapRequestHandler } from '@sentry/cloudflare/request';
import * as SentryCore from '@sentry/core';
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types';

// Install request-local scopes once at module load, not from request middleware.
setAsyncLocalStorageAsyncContextStrategy();

const SENSITIVE_KEYS = /^(?:password|token|key|secret|session|authorization|cookie|email|ip|ip_address)$/i;
const SENSITIVE_HEADERS = /^(?:cookie|authorization|x-csrf-token|x-session-id)$/i;
const URL_VALUE_FIELDS = new Set(['url.full', 'http.url', 'http.target', 'http.request.url']);
const URL_QUERY_FIELDS = new Set(['url.query', 'http.query']);

function redactQuery(query: unknown): unknown {
  if (typeof query === 'string') {
    return query.split('&').map((part) => {
      const index = part.indexOf('=');
      const key = index < 0 ? part : part.slice(0, index);
      let decodedKey = key;
      try { decodedKey = decodeURIComponent(key.replace(/\+/g, ' ')); } catch { /* keep raw key */ }
      return SENSITIVE_KEYS.test(decodedKey) ? `${key}=[Filtered]` : part;
    }).join('&');
  }

  if (Array.isArray(query)) {
    return query.map((tuple) => {
      if (!Array.isArray(tuple) || typeof tuple[0] !== 'string') return tuple;
      return SENSITIVE_KEYS.test(tuple[0]) ? [tuple[0], '[Filtered]'] : tuple;
    });
  }
  return query;
}

function redactUrl(value: string): string {
  const queryStart = value.indexOf('?');
  if (queryStart < 0) return value;
  const fragmentStart = value.indexOf('#', queryStart);
  const queryEnd = fragmentStart < 0 ? value.length : fragmentStart;
  const query = redactQuery(value.slice(queryStart + 1, queryEnd));
  return `${value.slice(0, queryStart + 1)}${typeof query === 'string' ? query : value.slice(queryStart + 1, queryEnd)}${value.slice(queryEnd)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function redactUrlCarriers(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) redactUrlCarriers(item);
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (typeof nested === 'string' && URL_VALUE_FIELDS.has(normalizedKey)) {
      value[key] = redactUrl(nested);
    } else if (typeof nested === 'string' && URL_QUERY_FIELDS.has(normalizedKey)) {
      const hasPrefix = nested.startsWith('?');
      const query = redactQuery(hasPrefix ? nested.slice(1) : nested);
      value[key] = `${hasPrefix ? '?' : ''}${typeof query === 'string' ? query : nested}`;
    } else {
      redactUrlCarriers(nested);
    }
  }
}

function redactEvent<T extends SentryCore.Event>(event: T): T {
  if (event.request) {
    const headers = event.request.headers;
    if (headers && typeof headers === 'object') {
      for (const key of Object.keys(headers)) {
        if (SENSITIVE_HEADERS.test(key)) delete headers[key];
      }
    }
    event.request.query_string = redactQuery(event.request.query_string) as typeof event.request.query_string;
    if (event.request.url) {
      try {
        const url = new URL(event.request.url);
        for (const key of [...url.searchParams.keys()]) {
          if (SENSITIVE_KEYS.test(key)) url.searchParams.set(key, '[Filtered]');
        }
        event.request.url = url.toString();
      } catch { /* malformed URLs are still protected by removing the body below */ }
    }
    delete event.request.data;
    delete event.request.cookies;
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }
  redactUrlCarriers(event.contexts);
  redactUrlCarriers(event.spans);
  return event;
}

export type SentryEnvironment = {
  SENTRY_DSN?: string;
  ENVIRONMENT?: string;
  CF_PAGES_COMMIT_SHA?: string;
};

export function getSentryOptions(env: SentryEnvironment): CloudflareOptions | null {
  if (!env.SENTRY_DSN) return null;
  return {
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT || 'production',
    release: env.CF_PAGES_COMMIT_SHA || 'unknown',
    tracesSampleRate: 0.1,
    sampleRate: 1,
    sendDefaultPii: false,
    beforeSend: (event) => redactEvent(event),
    beforeSendTransaction: (event) => redactEvent(event),
  };
}

/** Run one Hono request inside the SDK's isolated request scope. */
export function withSentryRequest(
  options: CloudflareOptions | null,
  request: Request<unknown, IncomingRequestCfProperties<unknown>>,
  context: ExecutionContext | undefined,
  handler: () => Response | Promise<Response>,
): Promise<Response> {
  return SentryCore.withScope(async (currentScope) => {
    // Request-local current scope is essential: the Cloudflare SDK initializes its
    // client on the current scope, while its isolation scope is independently forked.
    currentScope.setClient(undefined);
    currentScope.setUser(null);
    return SentryCore.withIsolationScope(async (isolationScope) => {
      isolationScope.setClient(undefined);
      isolationScope.setUser(null);
      if (!options) return await handler();

      // The SDK runtime explicitly supports an absent execution context, although
      // its public declaration currently requires one. Keep that cast at the boundary.
      return await wrapRequestHandler({ options, request, context: context as ExecutionContext, captureErrors: false }, handler);
    });
  });
}

// Capture error helper
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  if (context) {
    SentryCore.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => { scope.setExtra(key, value); });
      SentryCore.captureException(error);
    });
  } else {
    SentryCore.captureException(error);
  }
};

// Capture message helper
export const captureMessage = (message: string, level: SentryCore.SeverityLevel = 'info') => {
  SentryCore.captureMessage(message, level);
};

// Do not attach explicit identity data; event hooks additionally remove SDK-derived PII.
export const setUserContext = (userId: string, _email?: string, role?: string) => {
  SentryCore.setUser({ id: userId, role });
};

export const clearUserContext = () => SentryCore.setUser(null);
export { SentryCore };
