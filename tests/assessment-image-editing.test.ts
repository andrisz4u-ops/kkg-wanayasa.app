import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { state } from '../public/static/js/state.js';
import { AssessmentPackageSync } from '../public/static/js/assessment-package-sync.js';

const { apiMock, toastMock, preflightMock, docxMock } = vi.hoisted(() => ({
  apiMock: vi.fn(), toastMock: vi.fn(), preflightMock: vi.fn(), docxMock: vi.fn(),
}));

vi.mock('../public/static/js/api.js', () => ({ api: apiMock, getCsrfToken: () => null }));
vi.mock('../public/static/js/asesmen-docx.js', () => ({
  prepareAssessmentExportImages: preflightMock,
  generateAsesmenDocx: docxMock,
  preloadAsesmenImages: vi.fn(),
}));
vi.mock('../public/static/js/utils.js', async importOriginal => ({
  ...await importOriginal<typeof import('../public/static/js/utils.js')>(),
  showToast: toastMock, showLoading: vi.fn(), hideLoading: vi.fn(), populateAiModelSelect: vi.fn(),
}));

import { initKisi, renderKisi, resolveRenderableImageSrc } from '../public/static/js/pages/kisi.js';

const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>23 cm</text></svg>';
const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const imageSpec = () => ({ type: 'kubus', params: { s: 23 }, caption: 'Rusuk kubus' });
const svgImage = () => ({ url: svgUrl, svg, type: 'svg', title: 'Kubus', credit: 'Visual Engine' });
const failures = () => ({ imageUnavailable: true, imageUnavailableReason: 'expired_or_missing', imageWarningReason: 'fetch_failed' });
const removedFields = ['gambar', 'visual_stimulus', 'svg', 'imageRequired', 'visual_required', 'gambar_keyword', 'image_keyword', 'imageUnavailable', 'imageUnavailableReason', 'imageWarningReason'];
const raster = { assetId: 'new-raster', url: '/api/assessment-assets/new-raster', mime: 'image/png', byteLength: 68 };
const rasterUrl = 'https://upload.wikimedia.org/fixture.png';

let nextPackageId = 300;
let packageId: number;
let revision: number;
let content: any;

function button(selector: string) {
  const element = document.querySelector<HTMLButtonElement>(selector);
  expect(element, selector).not.toBeNull();
  return element!;
}

function input(selector: string, value: string, event?: string) {
  const element = document.querySelector<HTMLInputElement>(selector)!;
  element.value = value;
  if (event) element.dispatchEvent(new Event(event, { bubbles: true }));
}

async function openAssessment() {
  document.body.innerHTML = await renderKisi();
  input('[name="mataPelajaran"]', 'Matematika');
  input('[name="topik"]', 'Kubus');
  initKisi();
  document.getElementById('asesmen-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(document.getElementById('asesmen-result-view')!.classList.contains('hidden')).toBe(false));
}

function puts() {
  return apiMock.mock.calls.filter(([path, options]) => path === `/banksoal/${packageId}` && options?.method === 'PUT');
}

async function savedQuestion(section = 'pg') {
  await vi.waitFor(() => expect(puts()).toHaveLength(1));
  const saved = puts()[0][1].body.content;
  return section === 'isian' ? saved.isian.data[0] : saved[section][0];
}

function openImageModal(section = 'pg') {
  button(`.btn-change-soal-image[data-type="${section}"][data-qindex="0"]`).click();
}

async function waitForParameters() {
  await vi.waitFor(() => expect(document.querySelector('[data-param-key="s"]')).not.toBeNull());
}

describe('assessment client image editing lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('kkg_ai_streaming_mode', 'false');
    state.user = { id: 7, role: 'user', nama: 'Guru', kelas: '5' } as any;
    vi.stubGlobal('confirm', () => true);
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); }));
    packageId = nextPackageId++;
    revision = 1;
    content = {
      pg: [{ no: 1, soal: 'Berapa volume kubus?', opsi: { A: 'a', B: 'b', C: 'c', D: 'd' }, kunci: 'A', gambar: svgImage(), visual_stimulus: imageSpec() }],
      isian: { type: 'Standard', data: [{ no: 2, soal: 'Dua tambah tiga adalah ...', kunci: '5' }] },
      uraian: [{ no: 3, soal: 'Jelaskan cara menjumlahkan.', kunci: 'Jawaban' }],
      _persistence: { packageId, revision, saveStatus: 'saved', imageWarnings: [] },
    };
    apiMock.mockReset();
    toastMock.mockReset();
    preflightMock.mockReset().mockResolvedValue({ ready: true, images: new Map(), failures: [] });
    docxMock.mockReset().mockResolvedValue(new Blob(['docx']));
    vi.spyOn(AssessmentPackageSync.prototype, 'uploadImageUrl').mockResolvedValue(raster);
    apiMock.mockImplementation(async (path: string, options: any = {}) => {
      if (path === '/banksoal/stats') return { success: true, data: { total_soal: 1, my_soal: 1, per_mapel: [], per_kelas: [] } };
      if (path === '/kisi/generate') return { success: true, data: structuredClone(content) };
      if (path === '/kisi/visual-catalog') return { data: [{ id: 'kubus', category: 'Geometri', name: 'Kubus', description: 'Rusuk' }] };
      if (path === '/kisi/visual-render') return { data: { dataUri: svgUrl, svg, title: 'Kubus' } };
      if (path === `/banksoal/${packageId}` && options.method === 'PUT') {
        expect(options.body.baseRevision).toBe(revision);
        return { success: true, data: { packageId, revision: ++revision, saveStatus: 'saved' } };
      }
      throw new Error(`Unexpected API call: ${options.method || 'GET'} ${path}`);
    });
  });

  afterEach(() => {
    document.querySelector<HTMLButtonElement>('.soal-editor-overlay .btn-editor-cancel')?.click();
    document.body.innerHTML = '';
    state.user = null;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(['url', 'svg', 'both'])('preserves the unchanged SVG descriptor (%s) and renderer spec on a text-only edit', async source => {
    if (source === 'url') delete content.pg[0].gambar.svg;
    if (source === 'svg') delete content.pg[0].gambar.url;
    const original = structuredClone(content.pg[0]);
    await openAssessment();
    button('.btn-edit-soal[data-type="pg"]').click();
    input('#edit-soal-text', 'Teks soal diperbarui saja.');
    button('.btn-editor-save').click();
    const question = await savedQuestion();
    expect(question.soal).toBe('Teks soal diperbarui saja.');
    expect(question.gambar).toEqual(original.gambar);
    expect(question.visual_stimulus).toEqual(original.visual_stimulus);
    expect(AssessmentPackageSync.prototype.uploadImageUrl).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the descriptor and spec when the image modal is saved without changing the image', async () => {
    const original = structuredClone(content.pg[0]);
    await openAssessment();
    openImageModal();
    await waitForParameters();
    button('#modal-btn-save-image').click();
    const question = await savedQuestion();
    expect(question.gambar).toEqual(original.gambar);
    expect(question.visual_stimulus).toEqual(original.visual_stimulus);
  });

  it.each(['editor', 'image modal'])('replaces an unavailable image with a clean durable raster from the %s', async editor => {
    Object.assign(content.pg[0], failures(), { svg: '<svg>legacy</svg>', imageRequired: true });
    content.pg[0].gambar = { ...svgImage(), ...failures(), assetId: 'old-asset', mime: 'image/jpeg', params: { stale: 9 } };
    await openAssessment();
    if (editor === 'editor') {
      button('.btn-edit-soal[data-type="pg"]').click();
      input('#editor-url-input', rasterUrl);
      button('#btn-editor-apply-url').click();
      button('.btn-editor-save').click();
    } else {
      openImageModal();
      await waitForParameters();
      input('#modal-url-input', rasterUrl);
      button('#modal-btn-apply-url').click();
      button('#modal-btn-save-image').click();
    }
    const question = await savedQuestion();
    expect(question.gambar).toMatchObject({ ...raster, type: 'photo' });
    for (const field of ['imageUnavailable', 'imageUnavailableReason', 'imageWarningReason', 'svg', 'visual_stimulus']) {
      expect(question).not.toHaveProperty(field);
      expect(question.gambar).not.toHaveProperty(field);
    }
    expect(question.gambar).not.toHaveProperty('params');
    expect(question.imageRequired).toBe(true);
    expect(AssessmentPackageSync.prototype.uploadImageUrl).toHaveBeenCalledOnce();
    expect(document.querySelector('.soal-image-container.image-load-failed')).toBeNull();
  });

  it.each(['editor', 'image modal'])('rejects newly pasted raw SVG in the %s even when an old raster asset exists', async editor => {
    content.pg[0].gambar = { ...raster, assetId: 'old-asset' };
    delete content.pg[0].visual_stimulus;
    await openAssessment();
    const raw = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg><script>untrusted()</script></svg>');
    if (editor === 'editor') {
      button('.btn-edit-soal[data-type="pg"]').click();
      input('#editor-url-input', raw);
      button('#btn-editor-apply-url').click();
      button('.btn-editor-save').click();
    } else {
      openImageModal();
      input('#modal-url-input', raw);
      button('#modal-btn-apply-url').click();
      button('#modal-btn-save-image').click();
    }
    await vi.waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.stringContaining('belum memiliki salinan permanen'), 'error'));
    expect(puts()).toHaveLength(0);
    expect(document.querySelector('.soal-editor-overlay')).not.toBeNull();
  });

  it.each([
    ['canvas', 'pg'], ['editor', 'isian'], ['image modal', 'uraian'],
  ])('clears obsolete aliases, requirements and failure flags on %s removal (%s) without rewriting text', async (control, section) => {
    const question = section === 'isian' ? content.isian.data[0] : content[section][0];
    Object.assign(question, {
      gambar: { ...svgImage(), ...failures() }, visual_stimulus: imageSpec(), svg: '<svg>legacy</svg>',
      imageRequired: true, visual_required: true, gambar_keyword: 'kubus', image_keyword: 'cube', ...failures(),
    });
    const text = question.soal;
    await openAssessment();
    if (control === 'canvas') button(`.btn-remove-soal-image[data-type="${section}"]`).click();
    else if (control === 'editor') {
      button(`.btn-edit-soal[data-type="${section}"]`).click();
      input('#edit-soal-text', 'Dua tambah tiga adalah ...');
      button('#btn-editor-remove-img').click();
      button('.btn-editor-save').click();
    } else {
      openImageModal(section);
      button('#modal-btn-remove-this-img').click();
      button('#modal-btn-save-image').click();
    }
    const saved = await savedQuestion(section);
    expect(saved.soal).toBe(text);
    for (const field of removedFields) expect(saved).not.toHaveProperty(field);
    expect(document.querySelector(`.soal-image-container[data-type="${section}"]`)).toBeNull();
  });

  it('preserves a missing-image marker and requirements on a text-only edit with no renderable source', async () => {
    content.pg[0].gambar = failures();
    Object.assign(content.pg[0], { imageRequired: true, visual_required: true, ...failures() });
    const original = structuredClone(content.pg[0]);
    await openAssessment();
    button('.btn-edit-soal[data-type="pg"]').click();
    input('#edit-soal-text', 'Perhatikan gambar berikut. Berapa volumenya?');
    button('.btn-editor-save').click();
    const question = await savedQuestion();
    expect(question.gambar).toEqual(original.gambar);
    expect(question.visual_stimulus).toEqual(original.visual_stimulus);
    expect(question.imageRequired).toBe(true);
    expect(question.visual_required).toBe(true);
    expect(question.imageUnavailable).toBe(true);
  });

  it('keeps an image-dependent stem intact after removal and honors the export preflight failure', async () => {
    const stem = 'Perhatikan gambar berikut. Berapa volumenya?';
    content.pg[0].soal = stem;
    await openAssessment();
    button('.btn-remove-soal-image[data-type="pg"]').click();
    expect((await savedQuestion()).soal).toBe(stem);
    preflightMock.mockResolvedValue({ ready: false, images: new Map(), failures: [{ section: 'pg', number: 1, category: 'missing-source' }] });
    button('#btn-download-doc').click();
    await vi.waitFor(() => expect(preflightMock).toHaveBeenCalled());
    expect(preflightMock.mock.calls[0][0].pg[0].soal).toBe(stem);
    await vi.waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.stringContaining('Soal pg nomor 1'), 'error'));
    expect(docxMock).not.toHaveBeenCalled();
  });

  it('renders and saves the same explicit SVG parameters', async () => {
    await openAssessment();
    openImageModal();
    await waitForParameters();
    input('[data-param-key="s"]', '31', 'input');
    button('#modal-btn-apply-svg').click();
    await vi.waitFor(() => expect(toastMock).toHaveBeenCalledWith('Diagram Kubus berhasil dipasang.', 'success'));
    const renders = apiMock.mock.calls.filter(([path]) => path === '/kisi/visual-render');
    expect(renders[0][1].body).toEqual({ type: 'kubus', params: { s: 31 } });
    button('#modal-btn-save-image').click();
    const question = await savedQuestion();
    expect(question.visual_stimulus).toEqual({ type: 'kubus', params: { s: 31 } });
    expect(question.gambar.params).toEqual({ s: 31 });
  });

  it.each(['apply', 'live tweak'])('ignores an obsolete SVG %s response after switching to a raster', async mode => {
    await openAssessment();
    openImageModal();
    await waitForParameters();
    let finish!: (value: any) => void;
    apiMock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    if (mode === 'apply') button('#modal-btn-apply-svg').click();
    else input('[data-param-key="s"]', '37', 'input');
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    input('#modal-url-input', rasterUrl);
    button('#modal-btn-apply-url').click();
    finish({ data: { dataUri: svgUrl, svg, title: 'Obsolete' } });
    await Promise.resolve();
    await Promise.resolve();
    expect(document.querySelector<HTMLImageElement>('#img-change-preview')!.getAttribute('src')).toBe(rasterUrl);
    button('#modal-btn-save-image').click();
    const question = await savedQuestion();
    expect(question.gambar).toMatchObject(raster);
    expect(question.gambar).not.toHaveProperty('svg');
    expect(question.gambar).not.toHaveProperty('params');
    expect(question).not.toHaveProperty('visual_stimulus');
    expect(AssessmentPackageSync.prototype.uploadImageUrl).toHaveBeenCalledOnce();
  });

  it('keeps the newest accepted live SVG and its parameter snapshot when responses arrive out of order', async () => {
    await openAssessment();
    openImageModal();
    await waitForParameters();
    let first!: (value: any) => void;
    let second!: (value: any) => void;
    apiMock.mockImplementationOnce(() => new Promise(resolve => { first = resolve; }));
    input('[data-param-key="s"]', '17', 'input');
    await vi.waitFor(() => expect(first).toBeTypeOf('function'));
    apiMock.mockImplementationOnce(() => new Promise(resolve => { second = resolve; }));
    input('[data-param-key="s"]', '29', 'input');
    await vi.waitFor(() => expect(second).toBeTypeOf('function'));
    const latestSvg = svg.replace('23', '29');
    const latestUrl = `data:image/svg+xml;utf8,${encodeURIComponent(latestSvg)}`;
    second({ data: { dataUri: latestUrl, svg: latestSvg, title: 'Latest' } });
    await vi.waitFor(() => expect(document.querySelector<HTMLImageElement>('#img-change-preview')!.getAttribute('src')).toContain('29'));
    first({ data: { dataUri: svgUrl, svg, title: 'Old' } });
    await Promise.resolve();
    await Promise.resolve();
    button('#modal-btn-save-image').click();
    const question = await savedQuestion();
    expect(question.gambar.svg).toBe(latestSvg);
    expect(resolveRenderableImageSrc(question.gambar)).toBe(resolveRenderableImageSrc(latestUrl));
    expect(question.visual_stimulus.params).toEqual({ s: 29 });
    expect(question.gambar.params).toEqual({ s: 29 });
  });
});
