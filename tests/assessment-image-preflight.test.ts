import { describe, expect, it, vi } from 'vitest';
import { collectExpectedAssessmentImages, preflightAssessmentImages } from '../public/static/js/assessment-image-preflight.js';
import type { AssessmentData } from '../public/static/js/assessment-image-preflight.js';

const VALID_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j50QAAAAASUVORK5CYII=';
const decodePng = () => Uint8Array.from(atob(VALID_PNG), char => char.charCodeAt(0)).buffer;
const decoder = async (buffer: ArrayBuffer, type: 'png' | 'jpeg') => {
  const bytes = new Uint8Array(buffer);
  const validPng = type === 'png' && bytes.length >= 30
    && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
    && bytes[12] === 73 && bytes[13] === 72 && bytes[14] === 68 && bytes[15] === 82;
  const validJpeg = type === 'jpeg' && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
  if (!validPng && !validJpeg) throw new Error('test decoder rejected invalid raster');
  return { width: 1, height: 1 };
};

describe('assessment image preflight', () => {
  it('collects only explicit image/model stimuli from PG, isian data, and uraian', () => {
    const pg = { no: 8, soal: 'Buat gambar lingkaran', gambar: { url: '/private/pg.png' } };
    const isian = { no: 3, gambar: { svg: '<svg></svg>' } };
    const uraian = { no: 12, gambar: { url: 'data:image/png;base64,AQID' } };
    const explicit = { no: 13, visual_stimulus: { type: 'sudut', params: { angle: 90 } } };
    const data = {
      pg: [pg, { no: 9, soal: 'Gambarkan pola berikut', opsi: {} }],
      isian: { data: [isian] },
      uraian: [uraian, explicit, { no: 14, visual_stimulus: { type: 'none' } }, { no: 15, visual_stimulus: {} }],
    };
    expect(collectExpectedAssessmentImages(data as unknown as AssessmentData).map(({ section, number }) => ({ section, number }))).toEqual([
      { section: 'pg', number: 8 }, { section: 'isian', number: 3 }, { section: 'uraian', number: 12 }, { section: 'uraian', number: 13 },
    ]);
  });

  it('reports required references without sources and loader errors without source details', async () => {
    const loadImage = vi.fn(async () => ({ buffer: decodePng(), type: 'png' as const }));
    const result = await preflightAssessmentImages({ pg: [{ no: 5, gambar: {} }] }, { loadImage, decodeImage: decoder });
    expect(result.ready).toBe(false);
    expect(loadImage).not.toHaveBeenCalled();
    expect(result.failures).toEqual([{ section: 'pg', number: 5, category: 'missing-source' }]);

    const signedUrl = 'https://private.example.test/image.png?token=secret';
    const failed = await preflightAssessmentImages({ isian: { data: [{ no: 6, gambar: { url: signedUrl } }] } }, {
      loadImage: async () => { throw new Error(`failed ${signedUrl}`); },
      decodeImage: decoder,
    });
    expect(failed.ready).toBe(false);
    expect(failed.failures).toEqual([{ section: 'isian', number: 6, category: 'load-failed' }]);
    expect(JSON.stringify(failed.failures)).not.toContain(signedUrl);
  });

  it('rejects empty, mismatched, truncated, and oversized output before marking ready', async () => {
    const invalidBuffers = [new ArrayBuffer(0), new Uint8Array([1, 2, 3]).buffer, decodePng().slice(0, 24)];
    for (const buffer of invalidBuffers) {
      const result = await preflightAssessmentImages({ pg: [{ gambar: { url: '/asset/image' } }] }, {
        loadImage: async () => ({ buffer, type: 'png' }),
        decodeImage: async buffer => {
          if (buffer.byteLength < 30) throw new Error('truncated image');
          return decoder(buffer, 'png');
        },
      });
      expect(result.ready).toBe(false);
    }
    const oversized = decodePng().slice(0);
    new DataView(oversized).setUint32(16, 4000);
    new DataView(oversized).setUint32(20, 3000);
    const result = await preflightAssessmentImages({ uraian: [{ gambar: { url: '/asset/huge' } }] }, {
      loadImage: async () => ({ buffer: oversized, type: 'png' }),
      decodeImage: decoder,
    });
    expect(result.failures[0].category).toBe('invalid-image');
  });

  it('fails closed when a valid signature has bytes the decoder cannot decode', async () => {
    const result = await preflightAssessmentImages({ pg: [{ no: 2, gambar: { url: '/asset/truncated' } }] }, {
      loadImage: async () => ({ buffer: decodePng(), type: 'png' }),
      decodeImage: async () => { throw new Error('decoder rejected truncation'); },
    });
    expect(result.ready).toBe(false);
    expect(result.failures[0].category).toBe('decode-failed');
  });

  it('limits global in-flight loads to two and deduplicates by complete source identity', async () => {
    let active = 0;
    let maximum = 0;
    const loadImage = vi.fn(async () => {
      active++;
      maximum = Math.max(maximum, active);
      await new Promise(resolve => setTimeout(resolve, 2));
      active--;
      return { buffer: decodePng(), type: 'png' as const };
    });
    const questions = Array.from({ length: 7 }, (_, index) => ({ no: index + 1, gambar: { url: `/bounded/${index}` } }));
    const result = await preflightAssessmentImages({ pg: questions }, { loadImage, decodeImage: decoder, maxConcurrency: 8 });
    expect(result.ready).toBe(true);
    expect(maximum).toBeLessThanOrEqual(2);

    const sameSourceLoader = vi.fn(async () => ({ buffer: decodePng(), type: 'png' as const }));
    const shared = await preflightAssessmentImages({ pg: [
      { no: 1, gambar: { url: '/shared/image', version: 'v1' } },
      { no: 2, gambar: { version: 'v1', url: '/shared/image' } },
    ] }, { loadImage: sameSourceLoader, decodeImage: decoder });
    expect(shared.ready).toBe(true);
    expect(sameSourceLoader).toHaveBeenCalledTimes(1);
    expect(shared.images.values().next().value?.sourceFingerprint).toBeDefined();
  });

  it('times out an abort-aware hanging loader and returns instead of leaving the gate pending', async () => {
    const result = await preflightAssessmentImages({ pg: [{ no: 9, gambar: { url: '/hanging' } }] }, {
      loadTimeoutMs: 20,
      loadImage: (_image, _expectation, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }),
      decodeImage: decoder,
    });
    expect(result.ready).toBe(false);
    expect(result.failures[0].category).toBe('timeout');
  });

  it('enforces the inline data URL budget before invoking the loader', async () => {
    const loadImage = vi.fn(async () => ({ buffer: decodePng(), type: 'png' as const }));
    const tooLarge = `data:image/png;base64,${'A'.repeat(700_000)}`;
    const result = await preflightAssessmentImages({ pg: [{ no: 1, gambar: { url: tooLarge } }] }, { loadImage, decodeImage: decoder });
    expect(result.ready).toBe(false);
    expect(result.failures[0].category).toBe('budget-exceeded');
    expect(loadImage).not.toHaveBeenCalled();
    expect(JSON.stringify(result.failures)).not.toContain(tooLarge);
  });

  it('evicts least-recently-used images at the bounded cache entry limit', async () => {
    const loadImage = vi.fn(async () => ({ buffer: decodePng(), type: 'png' as const }));
    const run = async (url: string) => preflightAssessmentImages({ pg: [{ gambar: { url } }] }, { loadImage, decodeImage: decoder });
    await run('/cache/first');
    for (let i = 0; i < 32; i++) await run(`/cache/${i}`);
    const before = loadImage.mock.calls.length;
    await run('/cache/first');
    expect(loadImage.mock.calls.length).toBe(before + 1);
  });

  it('fingerprints all image descriptor parameters and does not expose cache-owned bytes', async () => {
    const question = { gambar: { url: '/cache/parameterized', params: { crop: 'left' }, assetId: 'asset-A' } };
    const loadImage = vi.fn(async () => ({ buffer: decodePng(), type: 'png' as const }));
    const first = await preflightAssessmentImages({ pg: [question] }, { loadImage, decodeImage: decoder });
    expect(first.ready).toBe(true);
    const firstImage = first.images.get(question)!;
    new Uint8Array(firstImage.buffer).fill(0);

    const second = await preflightAssessmentImages({ pg: [question] }, { loadImage, decodeImage: decoder });
    expect(second.ready).toBe(true);
    expect(new Uint8Array(second.images.get(question)!.buffer)).toEqual(new Uint8Array(decodePng()));
    expect(loadImage).toHaveBeenCalledTimes(1);

    question.gambar.params.crop = 'right';
    const changed = await preflightAssessmentImages({ pg: [question] }, { loadImage, decodeImage: decoder });
    expect(changed.ready).toBe(true);
    expect(loadImage).toHaveBeenCalledTimes(2);
  });

  it.each(['url', 'svg', 'assetId'] as const)(
    'rejects a %s change while queued and never caches the old source under the changed descriptor',
    async changedField => {
      const held: Array<() => void> = [];
      const loadImage = vi.fn(async (image, expectation) => {
        if (image.url?.startsWith('/hold/')) {
          await new Promise<void>(resolve => held.push(resolve));
          return { buffer: decodePng(), type: 'png' as const };
        }
        return expectation.question.gambar && typeof expectation.question.gambar === 'object'
          && (expectation.question.gambar.assetId === 'asset-B'
            || expectation.question.gambar.url === '/queued/changed.png'
            || expectation.question.gambar.svg === '<svg>B</svg>')
          ? { buffer: decodeJpeg(), type: 'jpeg' as const }
          : { buffer: decodePng(), type: 'png' as const };
      });
      const queuedQuestion = {
        no: 3,
        gambar: { url: '/queued/image.png', svg: '<svg>A</svg>', assetId: 'asset-A' },
      };
      const pending = preflightAssessmentImages({ pg: [
        { gambar: { url: '/hold/1.png' } },
        { gambar: { url: '/hold/2.png' } },
        queuedQuestion,
      ] }, { loadImage, decodeImage: decoder });

      await vi.waitFor(() => expect(held).toHaveLength(2));
      if (changedField === 'url') queuedQuestion.gambar.url = '/queued/changed.png';
      if (changedField === 'svg') queuedQuestion.gambar.svg = '<svg>B</svg>';
      if (changedField === 'assetId') queuedQuestion.gambar.assetId = 'asset-B';
      for (const release of held) release();

      const result = await pending;
      expect(result.failures).toContainEqual({ section: 'pg', number: 3, category: 'source-changed' });
      expect(loadImage.mock.calls.some(([image]) => image.url === '/queued/image.png')).toBe(false);

      const currentQuestion = {
        no: 3,
        gambar: { ...queuedQuestion.gambar },
      };
      const current = await preflightAssessmentImages({ pg: [currentQuestion] }, { loadImage, decodeImage: decoder });
      expect(current.ready).toBe(true);
      expect(current.images.get(currentQuestion)?.type).toBe('jpeg');
      expect(new Uint8Array(current.images.get(currentQuestion)!.buffer)).toEqual(new Uint8Array(decodeJpeg()));
      expect(loadImage.mock.calls.filter(([image]) => image.url === currentQuestion.gambar.url)).toHaveLength(1);
    },
  );
});

const JPEG_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9k=';
const decodeJpeg = () => Uint8Array.from(atob(JPEG_BASE64), char => char.charCodeAt(0)).buffer;
