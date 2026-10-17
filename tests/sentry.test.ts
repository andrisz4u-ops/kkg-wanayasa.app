import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { captureError, getSentryOptions, setUserContext, withSentryRequest } from '../src/lib/sentry';
import * as SentryCore from '@sentry/core';
import type { CloudflareOptions } from '@sentry/cloudflare';

const request = (path = '/') => new Request(`https://example.test${path}`) as never;
const fakeContext = (promises: Promise<unknown>[]) => ({ waitUntil: (promise: Promise<unknown>) => { promises.push(promise); } }) as ExecutionContext;

function localTransport(envelopes: unknown[], throwOnCreate = false): NonNullable<CloudflareOptions['transport']> {
  return () => {
    if (throwOnCreate) throw new Error('local transport init failure');
    return {
      send: (envelope) => { envelopes.push(envelope); return Promise.resolve({ statusCode: 200 }); },
      flush: () => Promise.resolve(true),
    };
  };
}

function envelopeItemTypes(envelopes: unknown[]): string[] {
  return envelopes.flatMap((envelope) => {
    if (!Array.isArray(envelope) || !Array.isArray(envelope[1])) throw new Error('Unexpected Sentry envelope shape');
    return envelope[1].flatMap((item: unknown) => {
      if (!Array.isArray(item) || typeof item[0] !== 'object' || item[0] === null || !('type' in item[0])) {
        throw new Error('Unexpected Sentry envelope item shape');
      }
      return typeof item[0].type === 'string' ? [item[0].type] : [];
    });
  });
}

function fixture(options: ReturnType<typeof getSentryOptions>, context?: ExecutionContext) {
  const app = new Hono();
  app.use('*', async (c, next) => withSentryRequest(options, c.req.raw as never, context, async () => {
    await next();
    return c.res;
  }));
  app.onError((error, c) => {
    captureError(error, { route: c.req.path, requestMethod: c.req.method });
    return c.text('sanitized failure', 500);
  });
  return app;
}

describe('Sentry request boundary', () => {
  it('keeps Sentry disabled without a DSN and isolates that request scope', async () => {
    expect(getSentryOptions({})).toBeNull();
    let ran = 0;
    const app = fixture(null);
    app.get('/', (c) => {
      ran += 1;
      expect(SentryCore.getClient()).toBeUndefined();
      return c.text('ok');
    });
    const response = await app.fetch(request());
    expect(response.status).toBe(200);
    expect(ran).toBe(1);
  });

  it('uses reviewed options and redacts both error and transaction events', () => {
    const options = getSentryOptions({ SENTRY_DSN: 'https://public@example.test/1' })!;
    expect(options).toMatchObject({ environment: 'production', release: 'unknown', tracesSampleRate: 0.1, sampleRate: 1, sendDefaultPii: false });
    const event = {
      request: {
        url: 'https://example.test/path?ToKeN=secret&ok=yes',
        query_string: [['Session', 'private'], ['safe', 'visible']],
        headers: { Cookie: 'private', AUTHORIZATION: 'private', 'X-CSRF-Token': 'private', 'X-Session-Id': 'private' },
        data: { email: 'private@example.test' }, cookies: 'private',
      },
      contexts: {
        trace: {
          span_id: 'trace-span-1', trace_id: 'trace-id-1',
          data: {
            'url.full': 'https://example.test/trace?Password=trace-secret&ok=yes',
            'http.url': 'https://example.test/http?Authorization=http-secret&safe=visible',
            'http.target': '/target?Token=target-secret&keep=visible',
            'url.query': '?Session=query-secret&keep=visible',
            'http.response.status_code': 201,
          },
        },
      },
      spans: [{
        span_id: 'child-span-1', trace_id: 'trace-id-1', start_timestamp: 1,
        data: {
          'url.full': 'https://example.test/child?Cookie=child-secret&keep=visible',
          'http.url': 'https://example.test/child-http?Key=child-key-secret&keep=visible',
          'http.target': '/child-target?Email=child-email-secret&keep=visible',
          'url.query': '?Ip=child-ip-secret&keep=visible',
          'sentry.sample_rate': 0.1,
        },
      }],
      user: { email: 'private@example.test', ip_address: '192.0.2.1', id: 'user-1' },
    } as never;
    const sanitizedError = options.beforeSend!(event, {} as never);
    const sanitizedTransaction = options.beforeSendTransaction!(event, {} as never);
    for (const sanitized of [sanitizedError, sanitizedTransaction]) {
      expect(sanitized).not.toBeNull();
      if (!sanitized || 'then' in sanitized) throw new Error('Expected a sanitized event');
      expect(sanitized.request?.url).toContain('ToKeN=%5BFiltered%5D');
      expect(sanitized.request?.query_string).toEqual([['Session', '[Filtered]'], ['safe', 'visible']]);
      expect(sanitized.request?.headers).toEqual({});
      expect(sanitized.request?.data).toBeUndefined();
      expect(sanitized.request?.cookies).toBeUndefined();
      expect(sanitized.user).toEqual({ id: 'user-1' });
      const serialized = JSON.stringify(sanitized);
      for (const secret of ['trace-secret', 'http-secret', 'target-secret', 'query-secret', 'child-secret', 'child-key-secret', 'child-email-secret', 'child-ip-secret']) {
        expect(serialized).not.toContain(secret);
      }
      expect(serialized).toContain('ok=yes');
      expect(serialized).toContain('safe=visible');
      expect(serialized).toContain('trace-id-1');
      expect(serialized).toContain('http.response.status_code');
      expect(serialized).toContain('sentry.sample_rate');
    }
  });

  it('runs Hono error capture once with extras, redacts the sent envelope, and flushes through waitUntil', async () => {
    const envelopes: unknown[] = [];
    const waits: Promise<unknown>[] = [];
    const options = { ...getSentryOptions({ SENTRY_DSN: 'https://public@example.test/2' })!, tracesSampleRate: 0, transport: localTransport(envelopes) };
    const app = fixture(options, fakeContext(waits));
    app.get('/private', () => { throw new Error('private failure'); });
    const response = await app.fetch(request('/private?PASSWORD=very-secret'), {
      headers: { Cookie: 'session=secret', Authorization: 'Bearer secret', 'X-CSRF-Token': 'secret', 'X-Session-Id': 'secret' },
    });
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('sanitized failure');
    await Promise.all(waits);
    const itemTypes = envelopeItemTypes(envelopes);
    expect(itemTypes).toEqual(['event']);
    const serialized = JSON.stringify(envelopes);
    expect(serialized).toContain('requestMethod');
    expect(serialized).not.toContain('private@example.test');
    expect(serialized).not.toContain('very-secret');
    expect(serialized).not.toContain('session=secret');
    expect(serialized).not.toContain('Bearer secret');
    expect(serialized).not.toContain('192.0.2.1');
  });

  it('redacts URL query secrets from real SDK error and sampled transaction trace data', async () => {
    const envelopes: unknown[] = [];
    const waits: Promise<unknown>[] = [];
    const options = {
      ...getSentryOptions({ SENTRY_DSN: 'https://public@example.test/6' })!,
      tracesSampleRate: 1,
      transport: localTransport(envelopes),
    };
    const app = fixture(options, fakeContext(waits));
    app.get('/private', () => { throw new Error('private failure'); });
    const response = await app.fetch(request('/private?PASSWORD=very-secret&safe=visible'));
    expect(response.status).toBe(500);
    await Promise.all(waits);

    expect(envelopeItemTypes(envelopes).sort()).toEqual(['event', 'transaction']);
    const serialized = JSON.stringify(envelopes);
    expect(serialized).not.toContain('very-secret');
    expect(serialized).toContain('url.full');
    expect(serialized).toContain('safe=visible');
    expect(serialized).toContain('trace_id');
    expect(serialized).toContain('http.response.status_code');
  });

  it('isolates overlapping enabled requests, then prevents a disabled request inheriting client or user', async () => {
    const firstEnvelopes: unknown[] = [];
    const secondEnvelopes: unknown[] = [];
    const firstWaits: Promise<unknown>[] = [];
    const secondWaits: Promise<unknown>[] = [];
    const firstOptions = {
      ...getSentryOptions({ SENTRY_DSN: 'https://public@example.test/3', CF_PAGES_COMMIT_SHA: 'release-first' })!,
      transport: localTransport(firstEnvelopes),
    };
    const secondOptions = {
      ...getSentryOptions({ SENTRY_DSN: 'https://public@example.test/4', CF_PAGES_COMMIT_SHA: 'release-second' })!,
      transport: localTransport(secondEnvelopes),
    };
    let readyCount = 0;
    let signalReady!: () => void;
    let releaseRequests!: () => void;
    const bothReady = new Promise<void>((resolve) => { signalReady = resolve; });
    const holdRequests = new Promise<void>((resolve) => { releaseRequests = resolve; });
    const app = new Hono();
    app.use('*', async (c, next) => {
      const isFirst = c.req.path === '/first';
      const options = isFirst ? firstOptions : c.req.path === '/second' ? secondOptions : null;
      const context = isFirst ? fakeContext(firstWaits) : fakeContext(secondWaits);
      return withSentryRequest(options, c.req.raw as never, context, async () => {
        await next();
        return c.res;
      });
    });
    app.onError((error, c) => {
      captureError(error, { route: c.req.path });
      return c.text('failed', 500);
    });
    app.get('/first', async () => {
      setUserContext('user-first', 'must-not-send@example.test');
      if (++readyCount === 2) signalReady();
      await holdRequests;
      captureError(new Error('failure-first'));
      return new Response('done');
    });
    app.get('/second', async () => {
      setUserContext('user-second', 'must-not-send@example.test');
      if (++readyCount === 2) signalReady();
      await holdRequests;
      captureError(new Error('failure-second'));
      return new Response('done');
    });
    const firstRequest = app.fetch(request('/first'));
    const secondRequest = app.fetch(request('/second'));
    await bothReady;

    let disabledRuns = 0;
    const disabled = fixture(null);
    disabled.get('/', (c) => {
      disabledRuns += 1;
      expect(SentryCore.getClient()).toBeUndefined();
      expect(SentryCore.getIsolationScope().getClient()).toBeUndefined();
      expect(SentryCore.getIsolationScope().getUser()).toBeUndefined();
      captureError(new Error('disabled failure'));
      return c.text('disabled');
    });
    await disabled.fetch(request());
    expect(disabledRuns).toBe(1);
    releaseRequests();
    await Promise.all([firstRequest, secondRequest]);
    await Promise.all([...firstWaits, ...secondWaits]);
    await disabled.fetch(request());
    expect(disabledRuns).toBe(2);

    const firstSerialized = JSON.stringify(firstEnvelopes);
    const secondSerialized = JSON.stringify(secondEnvelopes);
    expect(firstSerialized).toContain('release-first');
    expect(firstSerialized).toContain('failure-first');
    expect(firstSerialized).not.toContain('release-second');
    expect(firstSerialized).not.toContain('failure-second');
    expect(secondSerialized).toContain('release-second');
    expect(secondSerialized).toContain('failure-second');
    expect(secondSerialized).not.toContain('release-first');
    expect(secondSerialized).not.toContain('failure-first');
    expect(`${firstSerialized}${secondSerialized}`).not.toContain('must-not-send@example.test');
    expect(`${firstSerialized}${secondSerialized}`).not.toContain('disabled failure');
  });

  it('supports contextless enabled requests and preserves SSE status, headers, and events', async () => {
    const envelopes: unknown[] = [];
    const options = { ...getSentryOptions({ SENTRY_DSN: 'https://public@example.test/4' })!, transport: localTransport(envelopes) };
    const app = fixture(options, undefined);
    let emitted = '';
    app.get('/', (c) => c.newResponse(new ReadableStream({ start(controller) { emitted = 'data: one\n\n'; controller.enqueue(emitted); controller.close(); } }), 206, { 'Content-Type': 'text/event-stream', 'X-Stream': 'kept' }));
    const response = await app.fetch(request());
    expect(response.status).toBe(206);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('X-Stream')).toBe('kept');
    expect(response.body).not.toBeNull();
    expect(emitted).toBe('data: one\n\n');
  });

  it('does not rerun downstream when SDK initialization fails', async () => {
    let downstreamRuns = 0;
    const options = { ...getSentryOptions({ SENTRY_DSN: 'https://public@example.test/5' })!, transport: localTransport([], true) };
    const app = new Hono();
    app.use('*', async (c, next) => withSentryRequest(options, c.req.raw as never, undefined, async () => {
      downstreamRuns += 1;
      await next();
      return c.res;
    }));
    app.onError((_error, c) => c.text('init failed', 500));
    app.get('/', (c) => c.text('should not run'));
    const response = await app.fetch(request());
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('init failed');
    expect(downstreamRuns).toBe(0);
  });
});
