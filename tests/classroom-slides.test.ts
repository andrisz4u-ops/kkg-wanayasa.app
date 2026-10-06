import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import { normalizeDeck, normalizeGeneratedDeck, normalizeSlide, deckIssues, slideIssues } from '../public/static/js/slides/lesson-model.js';
import { buildScene, sceneSvg } from '../public/static/js/slides/scene.js';
import { slideTemplates, resolveTemplateId } from '../public/static/js/slides/templates.js';
import { exampleDeck } from '../public/static/js/slides/examples.js';
import { exportScenes, populatePptx, htmlPresentation } from '../public/static/js/slides/export.js';
import { readDraft, writeDraft } from '../public/static/js/slides/draft.js';
import { state } from '../public/static/js/state.js';

describe('Classroom presentation output contracts', () => {
  it.each(Object.keys(slideTemplates).flatMap(template => ['16:9', '4:3'].map(aspectRatio => ({ template, aspectRatio }))))('fits meaningful $template examples on $aspectRatio with one shared scene', ({ template, aspectRatio }) => {
    const deck = normalizeDeck(exampleDeck(template));
    expect(deckIssues(deck, 8)).toEqual([]);
    const scenes = exportScenes(deck, template, { aspectRatio });
    for (const scene of scenes) {
      expect(scene.warnings).toEqual([]);
      for (const node of scene.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(0); expect(node.y).toBeGreaterThanOrEqual(0);
        if (node.w) expect(node.x + node.w).toBeLessThanOrEqual(scene.width + .1);
        if (node.h) expect(node.y + node.h).toBeLessThanOrEqual(scene.height + .1);
        if (node.kind === 'text') expect(node.y + node.lines.length * node.size * 1.23).toBeLessThanOrEqual(node.y + node.h + .1);
      }
    }
  });
  it('keeps quiz answers out of the student scene until the teacher reveals them', () => {
    const quiz = exampleDeck().slides[4];
    expect(sceneSvg(buildScene(quiz, 'matematika-visual'))).not.toContain(quiz.quizExplanation);
    const revealedText = sceneSvg(buildScene(quiz, 'matematika-visual', { reveal: true })).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(revealedText).toContain(quiz.quizExplanation);
    expect(buildScene(quiz, 'matematika-visual').notes).toContain(quiz.quizExplanation);
  });
  it('renders the diagram asked about in a quiz rather than leaving only its question and choices', () => {
    const slide = normalizeSlide({ layout: 'quiz', title: 'Baca gambar pecahan', question: 'Pecahan apa yang diwarnai?', quizOptions: ['1/4', '2/4', '3/4', '4/4'], quizAnswer: 'C', quizExplanation: 'Tiga dari empat bagian diwarnai.', visual: { type: 'fraction', numerator: 3, denominator: 4, label: 'Bagian yang diwarnai' } });
    const scene = buildScene(slide, 'matematika-visual', { aspectRatio: '4:3', reveal: true });
    expect(scene.warnings).toEqual([]); expect(sceneSvg(scene)).toContain('Bagian yang diwarnai');
    expect(scene.nodes.filter((node: any) => node.kind === 'rect' && node.fill === '#234fa0' && node.h > 20)).toHaveLength(3);
  });
  it('allocates space to real line lengths rather than rejecting short three-point comparison columns', () => {
    const slide = normalizeSlide({ layout: 'comparison', title: 'Mengenal bentuk dan keliling', leftTitle: 'Lingkaran', leftContent: ['Tidak memiliki sudut.', 'Kelilingnya disebut keliling lingkaran.', 'Semua titik tepi berjarak sama dari pusat.'], rightTitle: 'Persegi', rightContent: ['Memiliki empat sudut.', 'Keempat sisinya sama panjang.', 'Keliling adalah jumlah panjang semua sisi.'] });
    const before = JSON.stringify(slide);
    expect(slideIssues(slide)).toEqual([]);
    for (const template of Object.keys(slideTemplates)) for (const aspectRatio of ['16:9', '4:3']) {
      const scene = buildScene(slide, template, { aspectRatio });
      expect(scene.warnings, `${template} / ${aspectRatio}`).toEqual([]);
      for (const node of scene.nodes.filter((node: any) => node.kind === 'text')) {
        expect(node.y + node.lines.length * node.size * 1.23).toBeLessThanOrEqual(node.y + node.h + .1);
        if ([...slide.leftContent, ...slide.rightContent].includes(node.text)) expect(node.size).toBeGreaterThanOrEqual(26);
      }
    }
    expect(JSON.stringify(slide)).toBe(before);
  });
  it('imports old layout fields without manufacturing statistics, quiz answers or placeholder text', () => {
    const deck = normalizeDeck({ title: 'Arsip', slides: [{ layout: 'stats', title: 'Angka', stats: [null] }, { layout: 'quiz', title: 'Latihan', question: [{ text: 'Berapa?', quizOptions: ['Satu', 'Dua'] }] }] });
    expect(deck.slides[0].stats[0].value).toBe('');
    expect(deck.slides[1].quizAnswer).toBe('');
    expect(deckIssues(deck).length).toBeGreaterThan(0);
    expect(resolveTemplateId('aurora-cosmic')).toBe('jelajah-ipas');
  });
  it('recognizes material in common provider fields and strips objectives only from newly generated decks', () => {
    const rows = [
      { title: 'Tujuan pembelajaran hari ini', layout: 'content', content: [] },
      { title: 'Mengenal lingkaran', layout: 'content', content: [], points: [{ bullet: 'Lingkaran tidak mempunyai sudut.' }] },
      { title: 'Mengenal persegi', layout: 'content', content: { bulletPoints: [{ description: 'Persegi mempunyai empat sisi sama panjang.' }] } },
      { title: 'Keliling', layout: 'content', body: { items: ['Keliling adalah panjang seluruh tepi bentuk.'] } },
    ];
    const raw = { title: 'Bentuk', slides: rows }, before = JSON.stringify(raw);
    const generated = normalizeGeneratedDeck(raw);
    expect(generated.slides).toHaveLength(3); expect(generated.slides[0].content).toEqual(['Lingkaran tidak mempunyai sudut.']);
    expect(generated.slides[1].content).toEqual(['Persegi mempunyai empat sisi sama panjang.']);
    expect(generated.slides[2].content).toEqual(['Keliling adalah panjang seluruh tepi bentuk.']);
    expect(normalizeDeck(raw).slides).toHaveLength(4); expect(JSON.stringify(raw)).toBe(before);
  });
  it('rejects ambiguous quizzes, invalid fractions and unbounded diagram values', () => {
    expect(slideIssues({ ...exampleDeck().slides[4], quizAnswer: 'Z', quizOptions: ['Sama', 'Sama'] })).not.toEqual([]);
    expect(slideIssues({ ...exampleDeck().slides[1], visual: { type: 'fraction', numerator: 5, denominator: 4 } })).not.toEqual([]);
    expect(slideIssues({ ...exampleDeck().slides[1], visual: { type: 'numberLine', min: 0, max: 1 } })).not.toEqual([]);
  });
  it('blocks overflowing output rather than silently clipping or cutting the source material', () => {
    const deck = normalizeDeck(exampleDeck()); deck.slides[1].content = ['kata '.repeat(150)];
    expect(() => exportScenes(deck, 'matematika-visual', { aspectRatio: '16:9' })).toThrow('Perbaiki slide');
    expect(deck.slides[1].content[0]).toBe('kata '.repeat(150));
  });
  it('checks the revealed answer as well as the student side and requires a learning arc for new generations', () => {
    const deck = normalizeDeck(exampleDeck());
    deck.slides[4].quizExplanation = 'penjelasan '.repeat(150);
    expect(() => exportScenes(deck, 'matematika-visual', { aspectRatio: '4:3' })).toThrow('Perbaiki slide');
    const noActivity = normalizeDeck(exampleDeck()); noActivity.slides[3] = normalizeSlide({ layout: 'content', title: 'Membaca pecahan', content: ['Pembilang menunjukkan bagian yang dipilih.'] });
    expect(deckIssues(noActivity, 8)).toContain('Sertakan aktivitas konkret yang dapat dilakukan siswa.');
  });
  it('writes an actual editable PPTX with native diagrams, hidden quiz answers and stable teacher notes', async () => {
    const deck = normalizeDeck(exampleDeck()); const before = JSON.stringify(deck);
    const scenes = exportScenes(deck, 'matematika-visual', { aspectRatio: '16:9' });
    const pptx = populatePptx(new PptxGenJS(), scenes, deck.title, 'matematika-visual', '16:9');
    const buffer = await pptx.write({ outputType: 'nodebuffer' });
    const zip = await JSZip.loadAsync(buffer as any);
    expect(Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))).toHaveLength(8);
    const student = await zip.file('ppt/slides/slide5.xml')!.async('string');
    const notes = await zip.file('ppt/notesSlides/notesSlide5.xml')!.async('string');
    expect(student).not.toContain(deck.slides[4].quizExplanation);
    expect(notes).toContain(deck.slides[4].quizExplanation);
    expect((notes.match(/Pembilang menunjukkan/g) || [])).toHaveLength(1);
    const diagram = await zip.file('ppt/slides/slide2.xml')!.async('string');
    expect(diagram).toContain('Tiga perempat'); expect(diagram).toContain('<p:sp>'); expect(diagram).not.toContain('<p:pic>');
    expect(await zip.file('ppt/presentation.xml')!.async('string')).toContain('cy="6858000"');
    expect(JSON.stringify(deck)).toBe(before);
  });
  it('exports a standalone HTML player with safe text, local scene data and teacher-controlled answers', async () => {
    const deck = normalizeDeck(exampleDeck()); deck.title = '</script><img src=x onerror=alert(1)>';
    const html = await htmlPresentation(deck, 'matematika-visual', { aspectRatio: '16:9' });
    expect(html).not.toContain('<script src='); expect(html).not.toContain('cdn.');
    expect(html).toContain('Buka jawaban'); expect(html).toContain('aria-pressed');
    expect(html).toContain('&lt;/script&gt;'); expect(html.match(/<script>/g)).toHaveLength(1);
  });
  it('embeds a real raster image with cover cropping rather than stretching it in PPTX', async () => {
    const scene = buildScene(exampleDeck().slides[1], 'matematika-visual');
    scene.nodes.push({ kind: 'image', x: 700, y: 240, w: 430, h: 300, imageWidth: 1, imageHeight: 1, url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=' } as any);
    const pptx = populatePptx(new PptxGenJS(), [scene], 'Foto contoh', 'matematika-visual', '16:9');
    const zip = await JSZip.loadAsync(await pptx.write({ outputType: 'nodebuffer' }) as any);
    const xml = await zip.file('ppt/slides/slide1.xml')!.async('string');
    expect(xml).toContain('<p:pic>'); expect(xml).toMatch(/<a:srcRect[^>]+t="[1-9]/);
    expect(Object.keys(zip.files).some(name => name.startsWith('ppt/media/image'))).toBe(true);
  });
});
describe('Account-owned local slide drafts', () => {
  beforeEach(() => { localStorage.clear(); state.user = { id: 11 } as any; });
  afterEach(() => { state.user = null; vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('round-trips edits, keeps accounts separate, and reports quota failure honestly', () => {
    const draft = { deck: normalizeDeck(exampleDeck()), template: 'matematika-visual', config: { aiProvider: 'api' } };
    draft.deck.slides[1].title = 'Perubahan guru';
    expect(writeDraft(draft)).toBe(true); expect(readDraft()!.deck.slides[1].title).toBe('Perubahan guru');
    state.user = { id: 12 } as any; expect(readDraft()).toBeNull(); expect(writeDraft(draft, 11)).toBe(false);
    vi.stubGlobal('localStorage', { setItem() { throw new DOMException('Quota', 'QuotaExceededError'); } });
    expect(writeDraft(draft)).toBe(false);
  });
});
