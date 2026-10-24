import { describe, expect, it, vi } from 'vitest';
import { buildStimulusSignature, hasMarkdownTable, questionNeedsDiagram, resolveQuestionVisualStimulus } from '../src/routes/kisi';
import { describeImageFailure } from '../public/static/js/image-failure.js';

describe('questionNeedsDiagram', () => {
  it.each([
    'Perhatikan gambar lingkaran berikut! Berdasarkan gambar tersebut, luas lingkaran adalah ...',
    'Amatilah diagram di bawah ini dengan saksama.',
    'Gambar berikut menunjukkan bangun gabungan.',
    'Cermati grafik berikut sebelum menjawab.',
  ])('detects a required figure: %s', (soal) => {
    expect(questionNeedsDiagram(soal)).toBe(true);
  });

  it.each([
    'Perhatikan tabel perbandingan diameter dan luas dua lingkaran berikut!',
    'Sebuah lingkaran memiliki diameter 20 cm. Keliling lingkaran tersebut adalah ...',
    'Tuliskan hasil dari 2/5 + 1/3.',
    '',
  ])('ignores text that does not require a figure: %s', (soal) => {
    expect(questionNeedsDiagram(soal)).toBe(false);
  });
});

describe('markdown table questions', () => {
  const table = 'Perhatikan tabel kegiatan penggunaan air berikut!\n\n| No | Kegiatan |\n| :--- | :--- |\n| 1 | Menyiram tanaman |';

  it('detects markdown tables', () => {
    expect(hasMarkdownTable(table)).toBe(true);
    expect(hasMarkdownTable('Sebuah lingkaran memiliki diameter 20 cm.')).toBe(false);
    expect(hasMarkdownTable('')).toBe(false);
  });

  it('never asks a provider for an extra image when the question already has a table', async () => {
    const searchImage = vi.fn(async () => ({ url: 'https://cdn.example/x.jpg', creditName: 'Provider', source: 'vultr-ai' }));
    const question: any = {
      no: 4,
      soal: table,
      visual_stimulus: { type: 'siklus_air', params: { pointer: 'evaporasi' } },
      gambar_keyword: 'siklus air',
      gambar_prompt_en: 'water cycle diagram',
    };
    await resolveQuestionVisualStimulus(
      question, 'IPAS', 'Siklus Air', { searchImage } as any, new Set(), new Set(), new Set(), false,
    );
    expect(searchImage).not.toHaveBeenCalled();
    expect(question.gambar).toBeUndefined();
    expect(question.visual_stimulus).toBeUndefined();
    expect(question.gambar_keyword).toBeUndefined();
    expect(question.gambar_prompt_en).toBeUndefined();
  });
});

describe('duplicate SVG handling', () => {
  const circle = { type: 'lingkaran', params: { r: 14 } };
  const usedSignatures = () => new Set([buildStimulusSignature(circle)]);
  const providerImage = {
    searchImage: vi.fn(async () => ({ url: 'https://cdn.example/lingkaran-diagram.jpg', creditName: 'Provider AI', source: 'vultr-ai' })),
  };

  it('replaces a duplicated SVG with a provider image for Matematika', async () => {
    const question: any = {
      no: 2,
      soal: 'Perhatikan gambar lingkaran berikut! Luas lingkaran tersebut adalah ...',
      visual_stimulus: circle,
      gambar_keyword: 'diagram lingkaran diameter 28 cm',
    };
    await resolveQuestionVisualStimulus(question, 'Matematika', 'Luas Lingkaran', providerImage as any, usedSignatures(), new Set(), new Set(), false);
    expect(question.gambar.type).toBe('ai');
    expect(question.gambar.url).toBe('https://cdn.example/lingkaran-diagram.jpg');
    expect(question.gambar.svg).toBeFalsy();
    expect(question.visual_stimulus).toBeUndefined();
  });

  it('replaces a duplicated SVG with a provider image for IPAS', async () => {
    const diagram = { type: 'lingkaran', params: { r: 9 } };
    const question: any = {
      no: 4,
      soal: 'Perhatikan gambar berikut! Bagian yang ditunjuk X berfungsi untuk ...',
      visual_stimulus: diagram,
      gambar_keyword: 'diagram siklus air',
    };
    await resolveQuestionVisualStimulus(
      question, 'IPAS', 'Siklus Air', providerImage as any,
      new Set([buildStimulusSignature(diagram)]), new Set(), new Set(), false,
    );
    expect(question.gambar.type).toBe('ai');
    expect(question.gambar.svg).toBeFalsy();
  });

  it('marks a required diagram missing when no provider is available', async () => {
    const question: any = {
      no: 5,
      soal: 'Perhatikan gambar lingkaran berikut! Luas lingkaran tersebut adalah ...',
      visual_stimulus: circle,
    };
    await resolveQuestionVisualStimulus(question, 'Matematika', 'Luas Lingkaran', null, usedSignatures(), new Set(), new Set(), false);
    expect(question.gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'required_diagram_missing' });
    expect(question.gambar.svg).toBeFalsy();
  });

  it('does not use the provider fallback outside Matematika and IPAS', async () => {
    const searchImage = vi.fn(async () => ({ url: 'https://cdn.example/x.jpg', creditName: 'Provider', source: 'vultr-ai' }));
    const question: any = {
      no: 6,
      soal: 'Perhatikan diagram alur berikut! Urutan teks prosedur yang tepat adalah ...',
      visual_stimulus: { type: 'diagram_alur', params: { start: 1, end: 4 } },
    };
    await resolveQuestionVisualStimulus(
      question, 'Bahasa Indonesia', 'Teks Prosedur', { searchImage } as any,
      new Set([buildStimulusSignature(question.visual_stimulus)]), new Set(), new Set(), false,
    );
    expect(searchImage).not.toHaveBeenCalled();
    expect(question.gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'required_diagram_missing' });
  });

  it('does not request or flag an image when a data table already answers "Grafik berikut"', async () => {
    const searchImage = vi.fn(async () => ({ url: 'https://cdn.example/x.jpg', creditName: 'Provider', source: 'vultr-ai' }));
    const question: any = {
      no: 8,
      soal: 'Grafik berikut menunjukkan perubahan suhu udara.\n\n| Waktu | Suhu |\n| :--- | :--- |\n| 06.00 | 22 |',
      visual_stimulus: { type: 'grafik_garis', params: {} },
      gambar_keyword: 'grafik suhu',
    };
    await resolveQuestionVisualStimulus(
      question, 'IPAS', 'Suhu Udara', { searchImage } as any, new Set(), new Set(), new Set(), false,
    );
    expect(searchImage).not.toHaveBeenCalled();
    expect(question.gambar).toBeUndefined();
    expect(question.imageUnavailable).toBeUndefined();
  });

  it('still removes a decorative duplicate diagram without a provider', async () => {
    const question: any = {
      no: 7,
      soal: 'Hitung keliling lingkaran yang berjari-jari 14 cm.',
      visual_stimulus: circle,
    };
    await resolveQuestionVisualStimulus(question, 'Matematika', 'Keliling Lingkaran', null, usedSignatures(), new Set(), new Set(), false);
    expect(question.gambar?.svg).toBeFalsy();
  });
});

describe('describeImageFailure', () => {
  it('explains the reasons a teacher can act on', () => {
    expect(describeImageFailure({ imageUnavailableReason: 'duplicate_visual_rejected' }))
      .toContain('diagram ini sama dengan soal lain');
    expect(describeImageFailure({ imageUnavailableReason: 'required_diagram_missing' }))
      .toContain('membutuhkan gambar');
    expect(describeImageFailure({ imageWarningReason: 'expired_or_missing' }))
      .toContain('kedaluwarsa');
  });

  it('stays silent for unknown or missing reasons', () => {
    expect(describeImageFailure({ imageUnavailableReason: 'mystery' })).toBe('');
    expect(describeImageFailure(null)).toBe('');
    expect(describeImageFailure({})).toBe('');
  });
});
