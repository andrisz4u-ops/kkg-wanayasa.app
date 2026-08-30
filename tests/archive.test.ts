import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveDocArchive,
  getDocArchives,
  getDocArchiveById,
  deleteDocArchive,
  clearDocArchives
} from '../public/static/js/storage-archive.js';

describe('Document Storage Archive & Personal AI History', () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        localStorageMock[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      })
    });
  });

  it('should successfully save and retrieve archived RPP document', () => {
    const item = saveDocArchive({
      module: 'rpp',
      title: 'Matematika - Pecahan Desimal (Kelas 5)',
      subtitle: '2 Pertemuan | Ganjil',
      inputData: { mataPelajaran: 'Matematika', topik: 'Pecahan Desimal' },
      content: { identifikasi: {}, desain: {}, pertemuan: [] }
    });

    expect(item).toBeDefined();
    expect(item?.id).toMatch(/^doc_/);
    expect(item?.title).toBe('Matematika - Pecahan Desimal (Kelas 5)');

    const list = getDocArchives('rpp');
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(item?.id);
  });

  it('should prepend newer items and find by ID', () => {
    const doc1 = saveDocArchive({
      module: 'kisi',
      title: 'Soal STS IPAS',
      subtitle: 'Ulangan Harian',
      inputData: { topik: 'Tata Surya' },
      content: { pg: [] }
    });

    const doc2 = saveDocArchive({
      module: 'kisi',
      title: 'Soal SAS Bahasa Indonesia',
      subtitle: 'SAS',
      inputData: { topik: 'Teks Puisi' },
      content: { pg: [] }
    });

    const list = getDocArchives('kisi');
    expect(list.length).toBe(2);
    expect(list[0].id).toBe(doc2?.id); // newer is first

    const found = getDocArchiveById('kisi', doc1!.id);
    expect(found?.title).toBe('Soal STS IPAS');
  });

  it('should delete a specific document and clear all', () => {
    const doc = saveDocArchive({
      module: 'slide',
      title: 'Slide Ekosistem Hutan',
      subtitle: '6 Slide',
      inputData: { topik: 'Ekosistem' },
      content: { slides: [] }
    });

    expect(getDocArchives('slide').length).toBe(1);

    deleteDocArchive('slide', doc!.id);
    expect(getDocArchives('slide').length).toBe(0);

    saveDocArchive({ module: 'slide', title: 'Slide 1', subtitle: '', inputData: {}, content: {} });
    saveDocArchive({ module: 'slide', title: 'Slide 2', subtitle: '', inputData: {}, content: {} });
    expect(getDocArchives('slide').length).toBe(2);

    clearDocArchives('slide');
    expect(getDocArchives('slide').length).toBe(0);
  });
});
