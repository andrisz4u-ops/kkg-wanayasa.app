// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASSESSMENT_ASSET_MAX_BYTES, fetchTrustedAssessmentImage } from '../src/lib/assessment-assets';
import { UnsplashService } from '../src/services/unsplash';

const apiKey = 'fixture-vultr-key';
const providerUrl = 'https://ewr1.vultrobjects.com/generated.png?token=fixture-url-token';
const query = 'fotosintesis tumbuhan';
const alt = 'Proses fotosintesis';
const png = readFileSync(new URL('../public/static/screenshots/home-mobile.png', import.meta.url)).toString('base64');
const jpeg = readFileSync(new URL('../public/static/img/gallery-2.jpg', import.meta.url)).toString('base64');
const webpLossy = 'UklGRjoAAABXRUJQVlA4IC4AAADQAQCdASoBAAEAAUAmJaACdLoB+AADsAD+8Por/0mzxNnibPkkf/NgVzXPuaAA';
const webpLossless = 'UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAdQsGKUtv+BiOh/AAA=';
const images = [
    { name: 'PNG', mime: 'image/png', base64: png },
    { name: 'JPEG', mime: 'image/jpeg', base64: jpeg },
    { name: 'lossy WebP', mime: 'image/webp', base64: webpLossy },
    { name: 'lossless WebP', mime: 'image/webp', base64: webpLossless }
];

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ query: { pages: {} } }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function service() {
    return new UnsplashService({ VULTR_API_KEY: apiKey });
}

function respondWith(image: unknown) {
    fetchMock.mockResolvedValueOnce(Response.json({ data: [image] }));
}

function expectNoSensitiveLogs() {
    const logs = [console.log, console.warn, console.error]
        .flatMap(logger => vi.mocked(logger).mock.calls)
        .flat().map(String).join('\n');
    for (const value of [apiKey, providerUrl, webpLossless]) {
        expect(logs).not.toContain(value);
    }
}

describe('assessment provider image results', () => {
    it.each(images)('labels $name base64 with its actual MIME and passes trusted ingestion', async ({ mime, base64 }) => {
        respondWith({ b64_json: base64 });

        const image = await service().searchImage(query, alt);

        expect(image?.url.split(',')[0]).toBe(`data:${mime};base64`);
        expect(image).toMatchObject({ source: 'vultr-ai', url: `data:${mime};base64,${base64}`, alt, query });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await expect(fetchTrustedAssessmentImage(1, image!.url)).resolves.toMatchObject({
            mime,
            byteLength: Buffer.from(base64, 'base64').byteLength
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expectNoSensitiveLogs();
    });

    it('accepts valid unpadded base64', async () => {
        const base64 = webpLossless.replace(/=+$/, '');
        respondWith({ b64_json: base64 });

        expect(await service().searchImage(query, alt)).toMatchObject({ url: `data:image/webp;base64,${base64}` });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('decodes only bounded base64 fragments to identify the MIME', async () => {
        respondWith({ b64_json: png });
        const decode = vi.spyOn(globalThis, 'atob');

        expect(await service().searchImage(query, alt)).toMatchObject({ source: 'vultr-ai' });
        expect(decode.mock.calls.length).toBeGreaterThan(0);
        expect(decode.mock.calls.every(([value]) => value.length <= 16)).toBe(true);
    });

    it.each([
        { name: 'missing value', value: undefined },
        { name: 'null', value: null },
        { name: 'number', value: 123 },
        { name: 'object', value: { encoded: png } },
        { name: 'array', value: [png] },
        { name: 'empty string', value: '' },
        { name: 'invalid alphabet', value: 'not-base64?!' },
        { name: 'invalid suffix after a valid prefix', value: `${png}!!!!` },
        { name: 'embedded whitespace', value: `${png.slice(0, 40)}\n${png.slice(40)}` },
        { name: 'misplaced padding', value: `${png.slice(0, 40)}=${png.slice(41)}` },
        { name: 'excess padding', value: `${webpLossless}===` },
        { name: 'invalid base64 length', value: 'A' },
        { name: 'nonzero padding bits', value: `${webpLossless.slice(0, -2)}B=` },
        { name: 'truncated PNG signature', value: Buffer.from([137, 80, 78, 71]).toString('base64') },
        { name: 'truncated JPEG signature', value: Buffer.from([255, 216]).toString('base64') },
        { name: 'truncated WebP signature', value: Buffer.from('RIFF\0\0\0\0WEB').toString('base64') },
        { name: 'GIF', value: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' },
        { name: 'SVG', value: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>').toString('base64') },
        { name: 'non-WebP RIFF', value: Buffer.from('RIFF\0\0\0\0WAVE').toString('base64') },
        { name: 'data URL instead of raw base64', value: `data:image/png;base64,${png}` }
    ])('rejects $name and continues to the Wikimedia fallback', async ({ value }) => {
        respondWith({ b64_json: value });

        const image = await service().searchImage(query, alt);
        expect(image?.source).toBeUndefined();
        expect(image).toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(String(fetchMock.mock.calls[1][0])).toContain('https://id.wikipedia.org/');
        expect(String(fetchMock.mock.calls[2][0])).toContain('https://commons.wikimedia.org/');
        expectNoSensitiveLogs();
    });

    it('rejects oversized base64 before decoding', async () => {
        const bytes = Buffer.alloc(ASSESSMENT_ASSET_MAX_BYTES + 1);
        Buffer.from(png, 'base64').copy(bytes);
        respondWith({ b64_json: bytes.toString('base64') });
        const decode = vi.spyOn(globalThis, 'atob');

        const image = await service().searchImage(query, alt);
        expect(image?.source).toBeUndefined();
        expect(image).toBeNull();
        expect(decode).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('preserves the URL result, gives it precedence over base64, and still requests URL format', async () => {
        respondWith({ url: providerUrl, b64_json: 'malformed-base64!' });
        const decode = vi.spyOn(globalThis, 'atob');

        expect(await service().searchImage(query, alt)).toMatchObject({ source: 'vultr-ai', url: providerUrl });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [endpoint, init] = fetchMock.mock.calls[0];
        expect(endpoint).toBe('https://api.vultrinference.com/v1/images/generations');
        expect(init?.method).toBe('POST');
        expect(JSON.parse(init?.body as string)).toMatchObject({ model: 'z-image-turbo', size: '512x512', response_format: 'url' });
        expect(decode).not.toHaveBeenCalled();
        expectNoSensitiveLogs();
    });

    it('does not return a malformed URL field as an image URL', async () => {
        respondWith({ url: { unexpected: true } });

        expect(await service().searchImage(query, alt)).toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it.each([
        { name: 'URL', item: { url: providerUrl }, excluded: providerUrl },
        { name: 'base64', item: { b64_json: webpLossless }, excluded: `data:image/webp;base64,${webpLossless}` }
    ])('preserves exclusions for $name results', async ({ item, excluded }) => {
        respondWith(item);

        expect(await service().searchImage(query, alt, undefined, undefined, new Set([excluded]))).toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('returns a Wikimedia image when the provider base64 is unsupported', async () => {
        respondWith({ b64_json: Buffer.from('unsupported image').toString('base64') });
        const wikiUrl = 'https://upload.wikimedia.org/plant.png';
        fetchMock.mockResolvedValueOnce(Response.json({ query: { pages: { 1: { title: 'Fotosintesis', thumbnail: { source: wikiUrl } } } } }));

        expect(await service().searchImage(query, alt)).toMatchObject({ source: 'unsplash', url: wikiUrl });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});

describe('assessment image provider discovery', () => {
    it('prefers environment configuration over stored providers', async () => {
        const db = { prepare: vi.fn() };
        const configured = new UnsplashService({
            VULTR_API_KEY: `  ${apiKey}  `,
            VULTR_BASE_URL: 'https://provider.example.test/v1/',
            VULTR_IMAGE_MODEL: 'configured-image-model'
        }, db);
        respondWith({ url: providerUrl });

        expect(await configured.searchImage(query, alt)).toMatchObject({ source: 'vultr-ai' });
        expect(db.prepare).not.toHaveBeenCalled();
        const [endpoint, init] = fetchMock.mock.calls[0];
        expect(endpoint).toBe('https://provider.example.test/v1/images/generations');
        expect(init?.headers).toMatchObject({ Authorization: `Bearer ${apiKey}` });
        expect(JSON.parse(init?.body as string)).toMatchObject({ model: 'configured-image-model', response_format: 'url' });
    });

    it('uses the first key and configured endpoint/model from the active image provider', async () => {
        const db = { prepare: vi.fn(() => ({ first: vi.fn(async () => ({
            api_key: JSON.stringify([apiKey, 'unused-fixture-key']),
            base_url: 'https://provider.example.test/v1/images/generations///',
            model: 'z-image-turbo'
        })) })) };
        respondWith({ b64_json: webpLossless });

        expect(await new UnsplashService({}, db).searchImage(query, alt)).toMatchObject({ url: `data:image/webp;base64,${webpLossless}` });
        expect(db.prepare).toHaveBeenCalledTimes(1);
        const [endpoint, init] = fetchMock.mock.calls[0];
        expect(endpoint).toBe('https://provider.example.test/v1/images/generations');
        expect(init?.headers).toMatchObject({ Authorization: `Bearer ${apiKey}` });
        expect(JSON.parse(init?.body as string)).toMatchObject({ model: 'z-image-turbo', response_format: 'url' });
    });

    it('falls back to settings when there is no active image provider', async () => {
        const first = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ value: apiKey });
        const db = { prepare: vi.fn((_sql: string) => ({ first })) };
        respondWith({ url: providerUrl });

        expect(await new UnsplashService({}, db).searchImage(query, alt)).toMatchObject({ url: providerUrl });
        expect(db.prepare).toHaveBeenCalledTimes(2);
        expect(db.prepare.mock.calls[0][0]).toContain('ai_providers');
        expect(db.prepare.mock.calls[1][0]).toContain('settings');
        expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: `Bearer ${apiKey}` });
    });
});

describe('assessment provider diagnostics', () => {
    const sensitiveDetails = `${apiKey} ${providerUrl} ${webpLossless}`;

    it.each(['HTTP error', 'fetch exception', 'JSON exception'])('does not log sensitive provider details on %s', async failure => {
        if (failure === 'HTTP error') {
            fetchMock.mockResolvedValueOnce(new Response(sensitiveDetails, { status: 502 }));
        } else if (failure === 'fetch exception') {
            fetchMock.mockRejectedValueOnce(new Error(sensitiveDetails));
        } else {
            const response = Response.json({});
            vi.spyOn(response, 'json').mockRejectedValueOnce(new Error(sensitiveDetails));
            fetchMock.mockResolvedValueOnce(response);
        }

        expect(await service().searchImage(query, alt)).toBeNull();
        expect(console.warn).toHaveBeenCalled();
        expectNoSensitiveLogs();
    });

    it('keeps settings discovery working without logging a provider lookup exception', async () => {
        const db = { prepare: vi.fn((sql: string) => {
            if (sql.includes('ai_providers')) throw new Error(sensitiveDetails);
            return { first: vi.fn(async () => ({ value: apiKey })) };
        }) };
        respondWith({ url: providerUrl });

        expect(await new UnsplashService({}, db).searchImage(query, alt)).toMatchObject({ url: providerUrl });
        expect(db.prepare).toHaveBeenCalledTimes(2);
        expectNoSensitiveLogs();
    });

    it('does not log settings lookup or Wikimedia fetch exceptions', async () => {
        const db = { prepare: vi.fn((sql: string) => {
            if (sql.includes('settings')) throw new Error(sensitiveDetails);
            return { first: vi.fn(async () => null) };
        }) };
        fetchMock.mockRejectedValueOnce(new Error(sensitiveDetails));

        expect(await new UnsplashService({}, db).searchImage(query, alt)).toBeNull();
        expectNoSensitiveLogs();
    });
});
