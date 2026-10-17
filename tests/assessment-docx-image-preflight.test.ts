import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssessmentData, AssessmentImageQuestion, AssessmentImagePreflightResult } from '../public/static/js/assessment-image-preflight.js';

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j50QAAAAASUVORK5CYII=';
const JPEG_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9k=';
const WEBP_BASE64 = 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v89WAAAAA==';
const validPng = () => Uint8Array.from(atob(PNG_BASE64), char => char.charCodeAt(0)).buffer;
const validJpeg = () => Uint8Array.from(atob(JPEG_BASE64), char => char.charCodeAt(0)).buffer;
const validWebp = () => Uint8Array.from(atob(WEBP_BASE64), char => char.charCodeAt(0)).buffer;
const pngDataUrl = `data:image/png;base64,${PNG_BASE64}`;
const enumValues = new Proxy({}, { get: (_target, key) => String(key) });
const imageRunOptions: Array<{ data: ArrayBuffer; type: string }> = [];
const toBlob = vi.fn(async () => new Blob(['docx'])) as ReturnType<typeof vi.fn>;

class FakeNode {
  options: Record<string, unknown>;
  constructor(options: Record<string, unknown> = {}) { this.options = options; }
}
class FakeImageRun {
  options: { data: ArrayBuffer; type: string };
  constructor(options: { data: ArrayBuffer; type: string }) { this.options = options; imageRunOptions.push(options); }
}

function installDocxRuntime() {
  imageRunOptions.length = 0;
  toBlob.mockClear();
  Object.assign(window, {
    docx: {
      TextRun: FakeNode, Paragraph: FakeNode, Table: FakeNode, TableRow: FakeNode, TableCell: FakeNode,
      ImageRun: FakeImageRun, Document: FakeNode, Header: FakeNode, Footer: FakeNode, PageBreak: FakeNode,
      Packer: { toBlob }, AlignmentType: enumValues, BorderStyle: enumValues, VerticalAlign: enumValues,
      WidthType: enumValues, TabStopType: enumValues, TabStopPosition: enumValues, PageNumber: enumValues,
      UnderlineType: enumValues, HeightRule: enumValues, TableLayoutType: enumValues,
    },
    state: { settings: {} },
  });
}

function installBitmapDecoder() {
  vi.stubGlobal('createImageBitmap', async (blob: Blob) => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const png = blob.type === 'image/png' && bytes.length >= 30
      && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
      && bytes[12] === 73 && bytes[13] === 72 && bytes[14] === 68 && bytes[15] === 82;
    const jpeg = blob.type === 'image/jpeg' && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
    const webp = blob.type === 'image/webp' && bytes.length >= 16
      && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (!png && !jpeg && !webp) throw new Error('test decoder rejected invalid raster');
    return { width: 1, height: 1, close: vi.fn() };
  });
}

describe('asesmen DOCX strict image preflight', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
    installDocxRuntime();
    installBitmapDecoder();
  });

  it('does not pack when a required authenticated image fails to load', async () => {
    const fetchMock = vi.fn(async () => new Response('unavailable', { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);
    const { generateAsesmenDocx } = await import('../public/static/js/asesmen-docx.js');
    const data: AssessmentData = { pg: [{ no: 7, soal: 'Soal dengan ilustrasi', gambar: { url: '/api/files/private/7' } }] };
    await expect(generateAsesmenDocx(data, {})).rejects.toMatchObject({
      name: 'AssessmentImagePreflightError', failures: [{ section: 'pg', number: 7, category: 'load-failed' }],
    });
    expect(toBlob).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/files/private/7', { credentials: 'same-origin', signal: expect.any(AbortSignal) });
  });

  it('rejects prepared maps missing a required question instead of trusting ready=true', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { generateAsesmenDocx } = await import('../public/static/js/asesmen-docx.js');
    const data: AssessmentData = { uraian: [{ no: 4, soal: 'Required image', gambar: { url: '/private/4.png' } }] };
    await expect(generateAsesmenDocx(data, {}, undefined, {
      preparedImages: { ready: true, images: new Map(), failures: [] },
    })).rejects.toMatchObject({
      name: 'AssessmentImagePreflightError', failures: [{ section: 'uraian', number: 4, category: 'invalid-image' }],
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(toBlob).not.toHaveBeenCalled();
  });

  it('reuses verified prepared bytes across PG, isian, and uraian without a second download', async () => {
    const png = validPng();
    const fetchMock = vi.fn(async () => new Response(png.slice(0), { headers: { 'content-type': 'image/png' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { generateAsesmenDocx, prepareAssessmentExportImages } = await import('../public/static/js/asesmen-docx.js');
    const pg = { no: 1, soal: 'PG visual', opsi: { A: 'a', B: 'b', C: 'c', D: 'd' }, gambar: { url: '/api/private/pg.png', sha256: 'one' } };
    const isian = { no: 2, soal: 'Isian visual', kunci: 'jawaban', gambar: { url: '/api/private/isian.png', assetId: 'two' } };
    const uraian = { no: 3, soal: 'Uraian visual', kunci: 'jawaban', gambar: { url: '/api/private/uraian.png', version: 3 } };
    const data: AssessmentData = { pg: [pg], isian: { type: 'Standard', data: [isian] }, uraian: [uraian] };
    const prepared = await prepareAssessmentExportImages(data);
    expect(prepared.ready).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const pgBytes = prepared.images.get(pg)!.buffer;
    const blob = await generateAsesmenDocx(data, {}, undefined, { preparedImages: prepared });
    expect(blob).toBeInstanceOf(Blob);
    expect(toBlob).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(imageRunOptions).toHaveLength(3);
    expect(imageRunOptions[0].data).not.toBe(pgBytes);
    expect(imageRunOptions.map(({ data: bytes }) => Array.from(new Uint8Array(bytes)))).toEqual(
      Array.from({ length: 3 }, () => Array.from(new Uint8Array(png))),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/private/pg.png', { credentials: 'same-origin', signal: expect.any(AbortSignal) });
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/private/isian.png', { credentials: 'same-origin', signal: expect.any(AbortSignal) });
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'http://localhost:3000/api/private/uraian.png', { credentials: 'same-origin', signal: expect.any(AbortSignal) });
  });

  it('decodes valid inline raster data locally and rejects invalid base64 raster bytes', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { generateAsesmenDocx } = await import('../public/static/js/asesmen-docx.js');
    await generateAsesmenDocx({ uraian: [{ no: 11, soal: 'Uraian', gambar: { url: pngDataUrl } }] }, {});
    expect(fetchMock).not.toHaveBeenCalled();
    expect(imageRunOptions).toHaveLength(1);
    expect(new Uint8Array(imageRunOptions[0].data)).toEqual(new Uint8Array(validPng()));
  });

  it('accepts a valid JPEG fixture only as decoded JPEG bytes', async () => {
    const jpeg = validJpeg();
    const fetchMock = vi.fn(async () => new Response(jpeg.slice(0), { headers: { 'content-type': 'image/jpeg' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { generateAsesmenDocx } = await import('../public/static/js/asesmen-docx.js');
    await generateAsesmenDocx({ uraian: [{ no: 7, soal: 'JPEG', gambar: { url: '/asset/image.jpg' } }] }, {});
    expect(imageRunOptions).toHaveLength(1);
    expect(imageRunOptions[0].type).toBe('jpeg');
    expect(new Uint8Array(imageRunOptions[0].data)).toEqual(new Uint8Array(jpeg));
  });

  it.each([
    ['empty response', new ArrayBuffer(0)],
    ['bad signature', Uint8Array.from([1, 2, 3, 4]).buffer],
    ['truncated raster', validPng().slice(0, 24)],
  ])('does not pack invalid image bytes (%s)', async (_label, imageBytes) => {
    const fetchMock = vi.fn(async () => new Response(imageBytes, { headers: { 'content-type': 'image/png' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { generateAsesmenDocx } = await import('../public/static/js/asesmen-docx.js');
    await expect(generateAsesmenDocx({ pg: [{ no: 1, soal: 'bad', gambar: { url: '/invalid.png' } }] }, {})).rejects.toMatchObject({
      name: 'AssessmentImagePreflightError',
    });
    expect(toBlob).not.toHaveBeenCalled();
  });

  it('rejects zero and over-limit dimensions before DOCX packing', async () => {
    const fetchMock = vi.fn(async () => new Response(validPng(), { headers: { 'content-type': 'image/png' } }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('createImageBitmap', async () => ({ width: 0, height: 1, close: vi.fn() }));
    const { generateAsesmenDocx } = await import('../public/static/js/asesmen-docx.js');
    const invalidDims = await generateAsesmenDocx({ pg: [{ no: 1, soal: 'zero', gambar: { url: '/zero.png' } }] }, {}).catch(error => error);
    expect(invalidDims.name).toBe('AssessmentImagePreflightError');
    expect(toBlob).not.toHaveBeenCalled();

    vi.resetModules();
    installDocxRuntime();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('createImageBitmap', async () => ({ width: 4000, height: 3000, close: vi.fn() }));
    const { generateAsesmenDocx: generateAgain } = await import('../public/static/js/asesmen-docx.js');
    await expect(generateAgain({ pg: [{ no: 2, soal: 'too large', gambar: { url: '/pixels.png' } }] }, {})).rejects.toMatchObject({
      name: 'AssessmentImagePreflightError',
    });
    expect(toBlob).not.toHaveBeenCalled();
  });

  it('rasterizes valid inline SVG and rejects active/external SVG constructs, including encoded data URLs', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      if (tagName.toLowerCase() === 'canvas') return {
        width: 0, height: 0,
        getContext: () => ({ fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }),
        toDataURL: () => pngDataUrl,
      } as unknown as HTMLCanvasElement;
      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);
    class MockImage {
      naturalWidth = 1;
      naturalHeight = 1;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) { queueMicrotask(() => this.onload?.()); }
    }
    vi.stubGlobal('Image', MockImage);
    const objectUrls: string[] = [];
    Object.assign(URL, {
      createObjectURL: vi.fn(() => { const key = `blob:assessment-svg-${objectUrls.length}`; objectUrls.push(key); return key; }),
      revokeObjectURL: vi.fn((key: string) => { expect(objectUrls).toContain(key); }),
    });
    const { generateAsesmenDocx } = await import('../public/static/js/asesmen-docx.js');
    const validSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/></linearGradient></defs><rect width="10" height="10" fill="url(#g)"/><text x="1" y="8">Sudut</text></svg>';
    await generateAsesmenDocx({ uraian: [{ no: 1, soal: 'Trusted', gambar: { svg: validSvg } }] }, {});
    expect(imageRunOptions).toHaveLength(1);
    expect(new Uint8Array(imageRunOptions[0].data)).toEqual(new Uint8Array(validPng()));
    expect(fetchMock).not.toHaveBeenCalled();

    const attacks = [
      '<!DOCTYPE svg [<!ENTITY x SYSTEM "https://bad.test/x">]><svg xmlns="http://www.w3.org/2000/svg"/>',
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><rect onload="alert(1)"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><use href="https://bad.test/x#shape"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://bad.test/x"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(https://bad.test/x)"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><iframe/></foreignObject></svg>',
    ];
    for (const svg of attacks) {
      vi.resetModules();
      installDocxRuntime();
      vi.stubGlobal('Image', MockImage);
      vi.stubGlobal('createImageBitmap', async () => ({ width: 1, height: 1, close: vi.fn() }));
      const { generateAsesmenDocx: generateAttack } = await import('../public/static/js/asesmen-docx.js');
      await expect(generateAttack({ uraian: [{ no: 2, soal: 'Untrusted', gambar: { svg } }] }, {})).rejects.toMatchObject({
        name: 'AssessmentImagePreflightError',
      });
      expect(toBlob).not.toHaveBeenCalled();
    }

    const encodedAttack = `data:image/svg+xml,${encodeURIComponent(attacks[1])}`;
    vi.resetModules();
    installDocxRuntime();
    vi.stubGlobal('Image', MockImage);
    const { generateAsesmenDocx: generateEncodedAttack } = await import('../public/static/js/asesmen-docx.js');
    await expect(generateEncodedAttack({ uraian: [{ no: 3, soal: 'Encoded', gambar: { url: encodedAttack } }] }, {})).rejects.toMatchObject({
      name: 'AssessmentImagePreflightError',
    });
    expect(toBlob).not.toHaveBeenCalled();
  });

  it('converts WebP to validated PNG before embedding', async () => {
    const fetchMock = vi.fn(async () => new Response(validWebp(), { headers: { 'content-type': 'image/webp' } }));
    vi.stubGlobal('fetch', fetchMock);
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      if (tagName.toLowerCase() === 'canvas') return {
        width: 0, height: 0,
        getContext: () => ({ fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }),
        toDataURL: () => pngDataUrl,
      } as unknown as HTMLCanvasElement;
      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);
    const { generateAsesmenDocx } = await import('../public/static/js/asesmen-docx.js');
    await generateAsesmenDocx({ uraian: [{ no: 8, soal: 'WebP', gambar: { url: '/asset/image.webp', sha256: 'webp-1' } }] }, {});
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/asset/image.webp', { credentials: 'same-origin', signal: expect.any(AbortSignal) });
    expect(imageRunOptions).toHaveLength(1);
    expect(imageRunOptions[0].type).toBe('png');
    expect(new Uint8Array(imageRunOptions[0].data)).toEqual(new Uint8Array(validPng()));
  });

  it('aborts stale URL, SVG, asset, hash, and in-flight mutations before Packer', async () => {
    const fetchMock = vi.fn(async () => new Response(validPng(), { headers: { 'content-type': 'image/png' } }));
    vi.stubGlobal('fetch', fetchMock);
    for (const mutate of [
      (q: MutableImageQuestion) => { q.gambar.url = '/asset/B.png'; },
      (q: MutableImageQuestion) => { q.gambar.svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="3"/></svg>'; },
      (q: MutableImageQuestion) => { q.gambar.assetId = 'asset-B'; },
      (q: MutableImageQuestion) => { q.gambar.sha256 = 'hash-B'; },
      (q: MutableImageQuestion) => { if (q.visual_stimulus) q.visual_stimulus.params.angle = 45; },
    ]) {
      vi.resetModules();
      installDocxRuntime();
      vi.stubGlobal('fetch', fetchMock);
      vi.stubGlobal('createImageBitmap', async () => ({ width: 1, height: 1, close: vi.fn() }));
      const module = await import('../public/static/js/asesmen-docx.js');
      const question: MutableImageQuestion = {
        no: 1, soal: 'mutate', gambar: { url: '/asset/A.png', assetId: 'asset-A', sha256: 'hash-A' },
        visual_stimulus: { type: 'sudut', params: { angle: 90 } },
      };
      const data: AssessmentData = { pg: [question] };
      const prepared = await module.prepareAssessmentExportImages(data);
      expect(prepared.ready).toBe(true);
      mutate(question);
      await expect(module.generateAsesmenDocx(data, {}, undefined, { preparedImages: prepared })).rejects.toMatchObject({
        name: 'AssessmentImagePreflightError',
      });
      expect(toBlob).not.toHaveBeenCalled();
    }

    vi.resetModules();
    installDocxRuntime();
    let releaseKop: ((response: Response) => void) | undefined;
    const delayedFetch = vi.fn((url: string) => url.includes('kop.png')
      ? new Promise<Response>(resolve => { releaseKop = resolve; })
      : Promise.resolve(new Response(validPng(), { headers: { 'content-type': 'image/png' } })));
    vi.stubGlobal('fetch', delayedFetch);
    const module = await import('../public/static/js/asesmen-docx.js');
    const question = { no: 5, soal: 'change during await', gambar: { url: '/asset/stable.png', assetId: 'one' } };
    const data: AssessmentData = { uraian: [question] };
    const prepared = await module.prepareAssessmentExportImages(data);
    const pendingExport = module.generateAsesmenDocx(data, {}, '/kop.png', { preparedImages: prepared });
    await vi.waitFor(() => expect(releaseKop).toBeDefined());
    question.gambar.assetId = 'two';
    releaseKop!(new Response(validPng(), { headers: { 'content-type': 'image/png' } }));
    await expect(pendingExport).rejects.toMatchObject({ name: 'AssessmentImagePreflightError' });
    expect(toBlob).not.toHaveBeenCalled();
  });

  it('enforces streamed response byte caps and aborts a hanging request', async () => {
    const chunked = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(512 * 1024)); controller.enqueue(new Uint8Array([1])); controller.close(); },
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(chunked, { headers: { 'content-type': 'image/png' } })));
    const { generateAsesmenDocx } = await import('../public/static/js/asesmen-docx.js');
    await expect(generateAsesmenDocx({ pg: [{ no: 1, soal: 'oversize', gambar: { url: '/large.png' } }] }, {})).rejects.toMatchObject({
      name: 'AssessmentImagePreflightError',
    });
    expect(toBlob).not.toHaveBeenCalled();

    vi.useFakeTimers();
    try {
      vi.resetModules();
      installDocxRuntime();
      const hangingFetch = vi.fn((_url: string, { signal }: { signal: AbortSignal }) => new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }));
      vi.stubGlobal('fetch', hangingFetch);
      const { generateAsesmenDocx: generateHanging } = await import('../public/static/js/asesmen-docx.js');
      const pending = generateHanging({ pg: [{ no: 2, soal: 'timeout', gambar: { url: '/hanging.png' } }] }, {});
      const settled = pending.then(value => ({ value } as const), (error: unknown) => ({ error } as const));
      await vi.waitFor(() => expect(hangingFetch).toHaveBeenCalledTimes(1));
      await vi.advanceTimersByTimeAsync(10_001);
      const outcome = await settled;
      expect('error' in outcome ? outcome.error : undefined).toMatchObject({ name: 'AssessmentImagePreflightError' });
      expect(hangingFetch.mock.calls[0][1].signal.aborted).toBe(true);
      expect(toBlob).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
});

interface MutableImageQuestion extends AssessmentImageQuestion {
  no: number;
  soal: string;
  gambar: { url: string; assetId: string; sha256: string; svg?: string };
  visual_stimulus?: { type: string; params: Record<string, number> };
}
