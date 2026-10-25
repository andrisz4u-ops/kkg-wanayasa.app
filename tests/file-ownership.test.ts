// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import files from '../src/routes/files';
import { getCurrentUser } from '../src/lib/auth';
import { validateUpload } from '../src/lib/file-ownership';
import { copyBytesToArrayBuffer } from '../src/lib/binary';
import { SqliteD1 } from './helpers/sqlite-d1';
import { readFileSync } from 'node:fs';

vi.mock('../src/lib/auth', async original => ({ ...await original<typeof import('../src/lib/auth')>(), getCurrentUser: vi.fn() }));

let db: SqliteD1;
let app: Hono;
let objects: Map<string, Uint8Array>;
let storage: { put: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

beforeEach(() => {
  db = new SqliteD1();
  db.sqlite.exec('CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1), (2);');
  db.sqlite.exec(readFileSync('migrations/0033_file_ownership.sql', 'utf8'));
  objects = new Map();
  storage = {
    put: vi.fn(async (key: string, bytes: Uint8Array) => { objects.set(key, bytes); }),
    get: vi.fn(async (key: string) => {
      const bytes = objects.get(key);
      return bytes ? ({ body: new Response(copyBytesToArrayBuffer(bytes)).body, httpMetadata: { contentType: 'image/png' }, writeHttpMetadata: (headers: Headers) => headers.set('content-type', 'image/png') }) : null;
    }),
    delete: vi.fn(async (key: string) => { objects.delete(key); }),
  };
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, tenant_id: 'kkg-gugus-3-wanayasa' } as any);
  app = new Hono().route('/api/files', files);
});

afterEach(() => { db.close(); vi.clearAllMocks(); });
const env = () => ({ DB: db, STORAGE: storage as any });
const req = (url: string, init?: RequestInit) => app.request(url, init, env());

describe('Managed file access and validation', () => {
  it('serves upload readiness from the R2 binding before matching file keys', async () => {
    const response = await req('/api/files/config');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { isConfigured: true } });
    expect(storage.get).not.toHaveBeenCalled();

    const unavailable = await app.request('/api/files/config', {}, { DB: db });
    expect(unavailable.status).toBe(200);
    expect(await unavailable.json()).toMatchObject({ data: { isConfigured: false } });
  });

  it('returns 404 for missing legacy files without fetching an external provider', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      const response = await req('/api/files/materi/missing.pdf');
      expect(response.status).toBe(404);
      expect(response.headers.get('location')).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { fetchSpy.mockRestore(); }
  });

  it('prevents user A from deleting user B file, even with its key', async () => {
    db.sqlite.prepare(`INSERT INTO file_ownership(key, owner_id, tenant_id, visibility, content_type, size, filename) VALUES (?, 2, ?, 'public', 'image/png', 8, 'b.png')`).run('uploads/known', 'kkg-gugus-3-wanayasa');
    objects.set('uploads/known', new Uint8Array([1]));
    const response = await req('/api/files/uploads/known', { method: 'DELETE', headers: { Cookie: 'session=a' } });
    expect(response.status).toBe(404);
    expect(storage.delete).not.toHaveBeenCalled();
    expect(objects.has('uploads/known')).toBe(true);
  });

  it('rejects MIME/signature mismatch', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'fake.png', { type: 'image/png' });
    expect(validateUpload(file, new Uint8Array([1, 2, 3]))).toContain('Isi file');
  });

  it('rejects invalid upload before writing to object storage', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array([1, 2, 3])], 'fake.png', { type: 'image/png' }));
    const response = await req('/api/files/upload', { method: 'POST', headers: { Cookie: 'session=owner' }, body: form });
    expect(response.status).toBe(400);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('requires owner authentication for private reads and disables public cache', async () => {
    db.sqlite.prepare(`INSERT INTO file_ownership(key, owner_id, tenant_id, visibility, content_type, size, filename) VALUES (?, 1, ?, 'private', 'image/png', 8, 'private.png')`).run('uploads/private', 'kkg-gugus-3-wanayasa');
    objects.set('uploads/private', new Uint8Array([1]));
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await req('/api/files/uploads/private')).status).toBe(401);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, tenant_id: 'kkg-gugus-3-wanayasa' } as any);
    const response = await req('/api/files/uploads/private', { headers: { Cookie: 'session=owner' } });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('fails closed for an orphaned managed object after owner deletion', async () => {
    db.sqlite.exec('PRAGMA foreign_keys = ON;');
    db.sqlite.prepare(`INSERT INTO file_ownership(key, owner_id, tenant_id, visibility, content_type, size, filename) VALUES (?, 1, ?, 'private', 'image/png', 8, 'orphan.png')`).run('managed/files/orphan', 'kkg-gugus-3-wanayasa');
    objects.set('managed/files/orphan', new Uint8Array([1, 2, 3]));
    db.sqlite.prepare('DELETE FROM users WHERE id = 1').run();

    const response = await req('/api/files/managed/files/orphan');
    expect(response.status).toBe(404);
    expect(storage.get).not.toHaveBeenCalled();
    expect(objects.has('managed/files/orphan')).toBe(true);
  });

  it('rejects private uploads unless storage is explicitly asserted non-public', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'private.png', { type: 'image/png' }));
    form.append('visibility', 'private');
    const response = await app.request('/api/files/upload', { method: 'POST', headers: { Cookie: 'session=owner' }, body: form }, { ...env() });
    expect(response.status).toBe(400);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('keeps the file-only upload contract public and returns its public URL', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'public.png', { type: 'image/png' }));
    const response = await app.request('/api/files/upload', { method: 'POST', headers: { Cookie: 'session=owner' }, body: form }, { ...env(), R2_PUBLIC_URL: 'https://cdn.example.test' });
    const payload = await response.json() as any;
    expect(response.status).toBe(201);
    expect(payload.data.visibility).toBe('public');
    expect(payload.data.url).toMatch(/^https:\/\/cdn\.example\.test\/managed\/files\//);
  });

  it('bounds multipart bodies without Content-Length, including extra fields', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'small.png', { type: 'image/png' }));
    form.append('extra', 'x'.repeat(UPLOAD_BODY_LIMIT));
    const response = await req('/api/files/upload', { method: 'POST', headers: { Cookie: 'session=owner' }, body: form });
    expect(response.status).toBe(413);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejects unexpected additional file parts', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'one.png', { type: 'image/png' }));
    form.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'two.png', { type: 'image/png' }));
    const response = await req('/api/files/upload', { method: 'POST', headers: { Cookie: 'session=owner' }, body: form });
    expect(response.status).toBe(400);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('handles repeated-prefix multipart boundaries within the bounded body', async () => {
    const boundary = `${'-'.repeat(68)}X`;
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="bad.png"\r\nContent-Type: image/png\r\n\r\n${'-'.repeat(10 * 1024 * 1024)}\r\n--${boundary}--\r\n`;
    const response = await req('/api/files/upload', {
      method: 'POST',
      headers: {
        Cookie: 'session=owner',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });
    expect(response.status).toBe(400);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('round-trips binary file bytes containing boundary-like sequences', async () => {
    const boundary = 'B';
    const encoder = new TextEncoder();
    const original = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ...encoder.encode('prefix--B--remaining\r\n--B-X\r\n---B--still-file\r\n--BBBBBBBBBBBBBBBB'),
    ]);
    const body = concatBytes(
      encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="binary.png"\r\nContent-Type: image/png\r\n\r\n`),
      original,
      encoder.encode(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="visibility"\r\n\r\npublic\r\n--${boundary}--\r\n`),
    );

    const response = await app.request('/api/files/upload', {
      method: 'POST',
      headers: { Cookie: 'session=owner', 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: copyBytesToArrayBuffer(body),
    }, { ...env(), R2_PUBLIC_URL: 'https://cdn.example.test' });
    const payload = await response.json() as any;

    expect(response.status).toBe(201);
    expect(objects.get(payload.data.key)).toEqual(original);
    expect(payload.data.contentType).toBe('image/png');
  });

  it('returns a controlled bad request for a missing multipart closing delimiter', async () => {
    const boundary = 'broken';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="bad.png"\r\nContent-Type: image/png\r\n\r\n\x89PNG\r\n\x1a\n\r\n--${boundary}`;
    const response = await req('/api/files/upload', {
      method: 'POST',
      headers: { Cookie: 'session=owner', 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('returns 413 for an oversized chunked multipart body before storage writes', async () => {
    const contentType = 'multipart/form-data; boundary=chunked';
    const chunk = new Uint8Array(64 * 1024);
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent >= UPLOAD_BODY_LIMIT + 1) {
          controller.close();
          return;
        }
        const next = Math.min(chunk.byteLength, UPLOAD_BODY_LIMIT + 1 - sent);
        sent += next;
        controller.enqueue(next === chunk.byteLength ? chunk : chunk.subarray(0, next));
      },
    });
    const request = new Request('http://localhost/api/files/upload', {
      method: 'POST',
      headers: { Cookie: 'session=owner', 'Content-Type': contentType },
      body: stream,
      duplex: 'half',
    } as RequestInit);

    const response = await app.fetch(request, env());

    expect(response.status).toBe(413);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('cleans up stored bytes if persistent metadata insertion fails', async () => {
    const failingDb = {
      prepare: (query: string) => {
        if (query.includes('INSERT INTO file_ownership')) throw new Error('metadata unavailable');
        return db.prepare(query);
      },
    } as any;
    const form = new FormData();
    form.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'failure.png', { type: 'image/png' }));
    const response = await app.request('/api/files/upload', { method: 'POST', headers: { Cookie: 'session=owner' }, body: form }, { DB: failingDb, STORAGE: storage as any });
    expect(response.status).toBe(500);
    expect(storage.put).toHaveBeenCalledOnce();
    expect(storage.delete).toHaveBeenCalledOnce();
    expect(objects.size).toBe(0);
  });
});

const UPLOAD_BODY_LIMIT = 10 * 1024 * 1024 + 64 * 1024;

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}
