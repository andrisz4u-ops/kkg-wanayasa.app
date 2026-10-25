import { describe, expect, it, vi } from 'vitest';
import { buildStimulusSignature, hasMarkdownTable, questionNeedsDiagram, resolveQuestionVisualStimulus, healUnselectedVisualQuestion, skipGeneratedQuestionImage } from '../src/routes/kisi';
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

  it('never replaces a duplicated SVG with a provider image for Matematika (100% SVG only)', async () => {
    const question: any = {
      no: 2,
      soal: 'Perhatikan gambar lingkaran berikut! Luas lingkaran tersebut adalah ...',
      visual_stimulus: circle,
      gambar_keyword: 'diagram lingkaran diameter 28 cm',
    };
    await resolveQuestionVisualStimulus(question, 'Matematika', 'Luas Lingkaran', providerImage as any, usedSignatures(), new Set(), new Set(), false);
    expect(providerImage.searchImage).not.toHaveBeenCalled();
    expect(question.gambar?.type).toBe('svg');
    expect(question.gambar?.svg).toContain('<svg');
    expect(question.gambar?.imageUnavailable).toBeUndefined();
  });

  it('reuses a duplicated SVG for IPAS without calling a photo provider', async () => {
    const diagram = { type: 'organ_pencernaan', params: { pointer: 'lambung', label: 'X' } };
    const question: any = {
      no: 4,
      soal: 'Perhatikan gambar berikut! Bagian yang ditunjuk X berfungsi untuk ...',
      visual_stimulus: diagram,
      gambar_keyword: 'diagram organ pencernaan',
    };
    await resolveQuestionVisualStimulus(
      question, 'IPAS', 'Organ Pencernaan', providerImage as any,
      new Set([buildStimulusSignature(diagram)]), new Set(), new Set(), false,
    );
    expect(question.gambar.type).toBe('svg');
    expect(question.gambar.svg).toContain('<svg');
    expect(providerImage.searchImage).not.toHaveBeenCalled();
  });

  it('renders a repeated required diagram without a provider', async () => {
    const question: any = {
      no: 5,
      soal: 'Perhatikan gambar lingkaran berikut! Luas lingkaran tersebut adalah ...',
      visual_stimulus: circle,
    };
    await resolveQuestionVisualStimulus(question, 'Matematika', 'Luas Lingkaran', null, usedSignatures(), new Set(), new Set(), false);
    expect(question.gambar.type).toBe('svg');
    expect(question.gambar.svg).toContain('<svg');
    expect(question.gambar.imageUnavailable).toBeUndefined();
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

  it('keeps a repeated optional SVG without a provider', async () => {
    const question: any = {
      no: 7,
      soal: 'Hitung keliling lingkaran yang berjari-jari 14 cm.',
      visual_stimulus: circle,
    };
    await resolveQuestionVisualStimulus(question, 'Matematika', 'Keliling Lingkaran', null, usedSignatures(), new Set(), new Set(), false);
    expect(question.gambar?.type).toBe('svg');
    expect(question.gambar?.svg).toContain('<svg');
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

describe('healUnselectedVisualQuestion & skipGeneratedQuestionImage', () => {
  it('heals organ questions where options are functions and removes diagram demands', () => {
    const q: any = {
      no: 4,
      soal: 'Perhatikan gambar penampang lambung berikut. Bagian yang ditunjuk oleh huruf X berfungsi untuk ....',
      visual_stimulus: { type: 'lambung_detail', params: { pointer: 'rugae', label: 'X' } },
      opsi: {
        A: 'Menyerap sari-sari makanan',
        B: 'Mengubah protein menjadi pepton',
        C: 'Mengatur keluarnya makanan ke usus halus',
        D: 'Menghasilkan lendir untuk melindungi dinding lambung',
      },
    };

    skipGeneratedQuestionImage(q, 'image_not_selected');

    expect(q.soal).toContain('dinding lambung (rugae)');
    expect(q.soal).not.toContain('Perhatikan gambar');
    expect(q.soal).not.toContain('huruf X');
    expect(questionNeedsDiagram(q.soal)).toBe(false);
    expect(q.gambar).toBeUndefined();
    expect(q.visual_stimulus).toBeUndefined();
    expect(q.imageUnavailable).toBeUndefined();
    expect(q.imageRequired).toBe(false);
  });

  it('heals vili usus halus and gigi questions without generating imageUnavailable', () => {
    const q8: any = {
      no: 8,
      soal: 'Perhatikan gambar penampang usus halus berikut. Bagian yang ditunjuk oleh huruf X memiliki fungsi untuk ....',
      visual_stimulus: { type: 'vili_usus', params: { pointer: 'vili', label: 'X' } },
      opsi: { A: 'Menyerap sari-sari makanan', B: 'Menghasilkan enzim' },
    };
    skipGeneratedQuestionImage(q8, 'image_not_selected');
    expect(q8.soal).toContain('vili (jonjot usus halus)');
    expect(questionNeedsDiagram(q8.soal)).toBe(false);
    expect(q8.gambar).toBeUndefined();
    expect(q8.imageUnavailable).toBeUndefined();

    const q10: any = {
      no: 10,
      soal: 'Perhatikan gambar struktur gigi manusia berikut. Gigi yang ditunjuk oleh huruf X memiliki fungsi untuk ....',
      visual_stimulus: { type: 'struktur_gigi', params: { pointer: 'seri', label: 'X' } },
      opsi: { A: 'Memotong makanan', B: 'Merobek makanan' },
    };
    skipGeneratedQuestionImage(q10, 'image_not_selected');
    expect(q10.soal).toContain('Gigi seri');
    expect(questionNeedsDiagram(q10.soal)).toBe(false);
    expect(q10.gambar).toBeUndefined();
    expect(q10.imageUnavailable).toBeUndefined();
  });

  it('heals identification questions with conceptual clues when entity is in the options', () => {
    const q: any = {
      no: 3,
      soal: 'Perhatikan diagram sistem pernapasan manusia berikut. Organ yang ditunjuk oleh huruf X adalah ....',
      visual_stimulus: { type: 'organ_pernapasan', params: { pointer: 'trakea', label: 'X' } },
      opsi: { A: 'Hidung', B: 'Trakea', C: 'Bronkus', D: 'Alveolus' },
    };

    skipGeneratedQuestionImage(q, 'image_not_selected');

    // Should not say "Organ trakea adalah ...." which leaks the answer
    expect(q.soal).toContain('Saluran pernapasan berbentuk pipa');
    expect(q.soal).not.toContain('huruf X');
    expect(questionNeedsDiagram(q.soal)).toBe(false);
    expect(q.gambar).toBeUndefined();
    expect(q.imageUnavailable).toBeUndefined();
  });
});
