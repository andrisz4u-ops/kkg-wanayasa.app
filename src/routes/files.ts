import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, errorResponse, ErrorCodes } from '../lib/response';
import { logger } from '../lib/logger';
import {
    UPLOAD_CONFIG,
    ALL_ALLOWED_MIME_TYPES,
    formatFileSize,
} from '../lib/upload';
import {
    createObjectKey,
    getFileMetadata,
    isManagedObjectKey,
    removeFileMetadata,
    saveFileMetadata,
    validateUpload,
    type ManagedFileMetadata,
} from '../lib/file-ownership';
import { DEFAULT_TENANT_ID } from '../lib/tenant';
import { StorageBindings } from '../lib/storage';
import { copyBytesToArrayBuffer } from '../lib/binary';

type Bindings = {
    DB: D1Database;
    /** Operator assertion: the backing bucket has no public origin/access path. */
    PRIVATE_STORAGE_NON_PUBLIC?: string;
} & StorageBindings;

const files = new Hono<{ Bindings: Bindings }>();
const MULTIPART_OVERHEAD_LIMIT = 64 * 1024;

async function parseBoundedMultipart(request: Request): Promise<FormData> {
    const maxBytes = UPLOAD_CONFIG.maxFileSize + MULTIPART_OVERHEAD_LIMIT;
    const reader = request.body?.getReader();
    if (!reader) throw new Error('Multipart request body is missing');

    const chunks: Uint8Array[] = [];
    let total = 0;
    let exceeded = false;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            // Do not cancel the in-process request stream: Node 24.21's undici
            // producer may enqueue after cancellation and raise an unhandled
            // ERR_INVALID_STATE. Drain without retaining oversized chunks.
            if (total > maxBytes) {
                exceeded = true;
                continue;
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }
    if (exceeded) throw new RangeError('Multipart request exceeds size limit');

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    const contentType = request.headers.get('content-type');
    if (!contentType?.toLowerCase().startsWith('multipart/form-data;')) {
        throw new TypeError('Expected multipart form data');
    }
    const boundary = /(?:^|;)\s*boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)?.slice(1).find(Boolean)?.trim();
    if (!boundary || !/^[-0-9A-Za-z'()+_,./:=?]{1,70}$/.test(boundary)) {
        throw new TypeError('Multipart boundary is invalid');
    }
    return decodeMultipart(bytes, boundary);
}

function findBytes(source: Uint8Array, pattern: Uint8Array, start: number): number {
    const prefix = new Uint32Array(pattern.length);
    for (let i = 1, matched = 0; i < pattern.length; i++) {
        while (matched > 0 && pattern[i] !== pattern[matched]) matched = prefix[matched - 1];
        if (pattern[i] === pattern[matched]) matched++;
        prefix[i] = matched;
    }
    for (let i = start, matched = 0; i < source.length; i++) {
        while (matched > 0 && source[i] !== pattern[matched]) matched = prefix[matched - 1];
        if (source[i] === pattern[matched]) matched++;
        if (matched === pattern.length) return i - pattern.length + 1;
    }
    return -1;
}

function decodeMultipart(bytes: Uint8Array, boundary: string): FormData {
    const form = new FormData();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const opening = encoder.encode(`--${boundary}\r\n`);
    const delimiter = encoder.encode(`\r\n--${boundary}`);
    const separator = encoder.encode('\r\n\r\n');
    if (findBytes(bytes, opening, 0) !== 0) throw new TypeError('Malformed multipart opening boundary');
    let cursor = opening.length;

    while (cursor < bytes.length) {
        const headerEnd = findBytes(bytes, separator, cursor);
        if (headerEnd < 0) throw new TypeError('Malformed multipart headers');
        const headerText = decoder.decode(bytes.subarray(cursor, headerEnd));
        const disposition = /^content-disposition:\s*form-data;([^\r\n]*)/im.exec(headerText)?.[1];
        const name = /(?:^|;)\s*name="([^"\r\n]*)"/i.exec(disposition || '')?.[1];
        if (!name) throw new TypeError('Multipart part name is missing');
        const filename = /(?:^|;)\s*filename="([^"\r\n]*)"/i.exec(disposition || '')?.[1];
        const mime = /^content-type:\s*([^\r\n]+)/im.exec(headerText)?.[1]?.trim() || 'application/octet-stream';
        const contentStart = headerEnd + separator.length;
        let contentEnd = -1;
        let nextCursor = -1;
        let closing = false;
        for (let candidate = findBytes(bytes, delimiter, contentStart); candidate >= 0; candidate = findBytes(bytes, delimiter, candidate + delimiter.length)) {
            const suffix = candidate + delimiter.length;
            if (bytes[suffix] === 13 && bytes[suffix + 1] === 10) {
                contentEnd = candidate;
                nextCursor = suffix + 2;
                break;
            }
            if (bytes[suffix] === 45 && bytes[suffix + 1] === 45 &&
                (suffix + 2 === bytes.length || (bytes[suffix + 2] === 13 && bytes[suffix + 3] === 10))) {
                contentEnd = candidate;
                nextCursor = suffix + 2;
                if (bytes[nextCursor] === 13) nextCursor += 2;
                closing = true;
                break;
            }
        }
        if (contentEnd < 0) throw new TypeError('Multipart closing boundary is missing');
        const content = bytes.subarray(contentStart, contentEnd);
        if (filename !== undefined) form.append(name, new File([copyBytesToArrayBuffer(content)], filename, { type: mime }));
        else form.append(name, decoder.decode(content));
        cursor = nextCursor;
        if (closing) {
            if (cursor !== bytes.length) throw new TypeError('Unexpected data after multipart closing boundary');
            return form;
        }
    }
    throw new TypeError('Multipart closing boundary is missing');
}

// ============================================
// Upload File
// ============================================
files.post('/upload', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const contentLengthHeader = c.req.header('content-length');
        const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;
        // Multipart framing is bounded too; the stream cap below is authoritative.
        if (Number.isFinite(contentLength) && contentLength > UPLOAD_CONFIG.maxFileSize + MULTIPART_OVERHEAD_LIMIT) {
            return errorResponse(c, ErrorCodes.VALIDATION_ERROR, `Ukuran file maksimal ${UPLOAD_CONFIG.maxFileSizeFormatted}`, 413);
        }
        let form: FormData;
        try {
            form = await parseBoundedMultipart(c.req.raw);
        } catch (parseError) {
            if (parseError instanceof RangeError) {
                return errorResponse(c, ErrorCodes.VALIDATION_ERROR, `Ukuran file maksimal ${UPLOAD_CONFIG.maxFileSizeFormatted}`, 413);
            }
            if (parseError instanceof TypeError) return Errors.validation(c, 'Format upload tidak valid');
            throw parseError;
        }

        const fileParts: File[] = [];
        let invalidPart = false;
        form.forEach((value, name) => {
            if (value instanceof File) {
                if (name !== 'file') invalidPart = true;
                fileParts.push(value);
            } else if (name !== 'visibility') {
                invalidPart = true;
            }
        });
        if (invalidPart || fileParts.length > 1) return Errors.validation(c, 'Upload hanya menerima satu file dan field visibility');
        const file = fileParts[0];

        if (!file || typeof file.arrayBuffer !== 'function') {
            return Errors.validation(c, 'Tidak ada file yang diupload');
        }

        // Check declared size and MIME before allocating the file buffer, then
        // validate the actual byte count and signature before storage.
        if (file.size > UPLOAD_CONFIG.maxFileSize) {
            return Errors.validation(c, `Ukuran file maksimal ${UPLOAD_CONFIG.maxFileSizeFormatted}`);
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const invalidReason = validateUpload(file, bytes);
        if (invalidReason) return Errors.validation(c, invalidReason);
        if (!c.env.STORAGE) return Errors.internal(c, 'Storage tidak dikonfigurasi');

        const key = createObjectKey();
        const visibility = form.get('visibility') === 'private' ? 'private' : 'public';
        if (visibility === 'private' && c.env.PRIVATE_STORAGE_NON_PUBLIC !== 'true') {
            return Errors.validation(c, 'Upload privat dinonaktifkan: storage belum dinyatakan non-publik');
        }
        const tenantId = String(user.tenant_id || DEFAULT_TENANT_ID);
        await c.env.STORAGE.put(key, bytes, {
            httpMetadata: {
                contentType: file.type.toLowerCase().split(';')[0].trim(),
                cacheControl: visibility === 'private' ? 'private, no-store' : 'public, max-age=86400',
            },
        });
        try {
            await saveFileMetadata(c.env.DB, {
                key, ownerId: Number(user.id), tenantId, visibility,
                contentType: file.type.toLowerCase().split(';')[0].trim(),
                size: bytes.byteLength, filename: file.name,
            });
        } catch (metadataError) {
            try { await c.env.STORAGE.delete(key); }
            catch (cleanupError) { logger.error('Failed to clean up orphaned upload', asError(cleanupError), { key }); }
            throw metadataError;
        }

        const urlBase = c.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '/api/files';
        const url = visibility === 'public' ? `${urlBase}/${key}` : `/api/files/${key}`;

        return successResponse(c, {
            key,
            url,
            filename: file.name,
            size: bytes.byteLength,
            sizeFormatted: formatFileSize(bytes.byteLength),
            contentType: file.type.toLowerCase().split(';')[0].trim(),
            visibility,
        }, 'File berhasil diupload', 201);


    } catch (e: any) {
        logger.error('File upload error', e, { userId: user.id });
        return Errors.internal(c);
    }
});

// ============================================
// Get File
// ============================================
// Register the literal route before the catch-all file key route.
files.get('/config', async (c) => {
    return successResponse(c, {
        maxFileSize: UPLOAD_CONFIG.maxFileSize,
        maxFileSizeFormatted: UPLOAD_CONFIG.maxFileSizeFormatted,
        allowedMimeTypes: ALL_ALLOWED_MIME_TYPES,
        allowedExtensions: {
            ...UPLOAD_CONFIG.allowedExtensions
        },
        isConfigured: !!c.env.STORAGE
    });
});

files.get('/:key{.+}', async (c) => {
    try {
        const key = c.req.param('key');
        if (!key) return Errors.validation(c, 'File key tidak valid');

        // A cascaded ownership row can disappear while its object remains.
        // The managed namespace must never be treated as a legacy public key.
        let metadata: ManagedFileMetadata | null;
        try { metadata = await getFileMetadata(c.env.DB, key); }
        catch (metadataError) {
            logger.error('File ownership lookup failed', asError(metadataError), { key });
            return Errors.internal(c);
        }
        if (!metadata && isManagedObjectKey(key)) return Errors.notFound(c, 'File tidak ditemukan');
        if (metadata?.visibility === 'private') {
            const sessionId = getCookie(c.req.header('Cookie'), 'session');
            const user: any = await getCurrentUser(c.env.DB, sessionId);
            if (!user) return Errors.unauthorized(c);
            if (Number(user.id) !== Number(metadata.ownerId) || String(user.tenant_id || DEFAULT_TENANT_ID) !== metadata.tenantId) {
                return Errors.notFound(c, 'File tidak ditemukan');
            }
        }

        // Priority 1: Cloudflare R2 (Direct Serve)
        if (c.env.STORAGE) {
            try {
                const object = await (c.env.STORAGE as R2Bucket).get(key);
                if (object) {
                    const headers = new Headers();
                    try {
                        object.writeHttpMetadata(headers);
                    } catch {
                        // In local dev proxy, passing Headers to ProxyStub throws DevalueError
                        if (object.httpMetadata?.contentType) {
                            headers.set('content-type', object.httpMetadata.contentType);
                        }
                    }
                    if (!headers.get('content-type') && object.httpMetadata?.contentType) {
                        headers.set('content-type', object.httpMetadata.contentType);
                    }
                    if (object.httpEtag) {
                        headers.set('etag', object.httpEtag);
                    }
                    headers.set('cache-control', metadata?.visibility === 'private' ? 'private, no-store' : 'public, max-age=86400');
                    return new Response(object.body, { headers });
                }
            } catch (r2Err: any) {
                logger.warn('R2 get file failed or threw proxy error', { key, error: r2Err?.message });
            }
        }

        // Missing private objects must never redirect to a public fallback.
        if (metadata?.visibility === 'private') return Errors.notFound(c, 'File tidak ditemukan');

        // Graceful fallback for logo images if file is missing
        if (key.startsWith('logos/') || key.includes('logo')) {
            return c.redirect('/static/img/logo-kkg.png');
        }

        return Errors.notFound(c, 'File tidak ditemukan');

    } catch (e: any) {
        logger.error('Get file error', e);
        const key = c.req.param('key');
        if (key && (key.startsWith('logos/') || key.includes('logo'))) {
            return c.redirect('/static/img/logo-kkg.png');
        }
        return Errors.internal(c);
    }
});

// ============================================
// Delete File
// ============================================
files.delete('/:key{.+}', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) return Errors.unauthorized(c);

    try {
        const key = c.req.param('key');
        if (!key) return Errors.validation(c, 'File key tidak valid');

        const metadata = await getFileMetadata(c.env.DB, key);
        if (!metadata) return Errors.notFound(c, 'File tidak ditemukan atau tidak dapat dikelola');
        if (Number(user.id) !== Number(metadata.ownerId) || String(user.tenant_id || DEFAULT_TENANT_ID) !== metadata.tenantId) {
            return Errors.notFound(c, 'File tidak ditemukan');
        }
        if (!c.env.STORAGE) return Errors.internal(c, 'Storage tidak dikonfigurasi');
        await c.env.STORAGE.delete(key);
        await removeFileMetadata(c.env.DB, key);

        logger.info('Managed file deleted', { userId: user.id, key });
        return successResponse(c, null, 'File berhasil dihapus');

    } catch (e: any) {
        logger.error('Delete file error', e, { userId: user.id });
        return Errors.internal(c);
    }
});

export default files;

function asError(value: unknown): Error {
    return value instanceof Error ? value : new Error(String(value));
}
