import { describe, it, expect } from 'vitest';
import {
  DIMENSI_PROFIL_LULUSAN,
  getDimensiProfilLulusanList,
  getDimensiById,
  getSubdimensiList,
  getIndikatorByJenjang,
  buildPromptProfilLulusanContext
} from '../src/lib/profil-lulusan';

describe('Master Data 8 Dimensi Profil Lulusan (SK BSKAP No. 058/H/KR/2025)', () => {
  it('should have exactly 8 dimensions matching the official SK BSKAP decree', () => {
    const list = getDimensiProfilLulusanList();
    expect(list).toHaveLength(8);

    const expectedNames = [
      'Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa',
      'Kewargaan',
      'Penalaran Kritis',
      'Kreativitas',
      'Kolaborasi',
      'Kemandirian',
      'Kesehatan',
      'Komunikasi'
    ];

    list.forEach((dim, idx) => {
      expect(dim.nomor).toBe(idx + 1);
      expect(dim.nama).toBe(expectedNames[idx]);
      expect(dim.subdimensi.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should include the two new official dimensions: Kesehatan and Komunikasi', () => {
    const kesehatan = getDimensiById('kesehatan');
    expect(kesehatan).toBeDefined();
    expect(kesehatan?.nomor).toBe(7);
    expect(kesehatan?.subdimensi.map(s => s.nama)).toEqual(
      expect.arrayContaining([
        'Hidup Bersih dan Sehat',
        'Kebugaran, Kesehatan Fisik, dan Kesehatan Mental',
        'Kesehatan Lingkungan'
      ])
    );

    const komunikasi = getDimensiById('komunikasi');
    expect(komunikasi).toBeDefined();
    expect(komunikasi?.nomor).toBe(8);
    expect(komunikasi?.subdimensi.map(s => s.nama)).toEqual([
      'Mendengarkan / Menyimak',
      'Berbicara',
      'Membaca',
      'Menulis'
    ]);
  });

  it('should provide complete 3-tier indicators (Berkembang, Cakap, Mahir) for SD level across all subdimensions', () => {
    const list = getDimensiProfilLulusanList();

    list.forEach(dim => {
      dim.subdimensi.forEach(sub => {
        const indSD = sub.indikator.SD;
        // K3 is khusus SMK, for others SD must be defined
        if (sub.id !== 'k3-dunia-kerja') {
          expect(indSD, `Missing SD indicators for ${dim.nama} -> ${sub.nama}`).toBeDefined();
          expect(indSD?.berkembang.length).toBeGreaterThan(15);
          expect(indSD?.cakap.length).toBeGreaterThan(15);
          expect(indSD?.mahir.length).toBeGreaterThan(15);
        }
      });
    });
  });

  it('should retrieve subdimensions and indicators accurately via helper utilities', () => {
    const penalaranSubs = getSubdimensiList('penalaran-kritis');
    expect(penalaranSubs).toHaveLength(3);
    expect(penalaranSubs[0].nama).toBe('Penyampaian Argumentasi');

    const indArgumenSD = getIndikatorByJenjang('penalaran-kritis', 'penyampaian-argumentasi', 'SD');
    expect(indArgumenSD).toBeDefined();
    expect(indArgumenSD?.cakap).toContain('runtut disertai alasan');

    const indArgumenSMP = getIndikatorByJenjang('penalaran-kritis', 'penyampaian-argumentasi', 'SMP');
    expect(indArgumenSMP).toBeDefined();
    expect(indArgumenSMP?.cakap).toContain('data pendukung');
  });

  it('should generate an informative prompt context containing all 8 dimensions', () => {
    const prompt = buildPromptProfilLulusanContext('SD');
    expect(prompt).toContain('SK BSKAP No. 058/H/KR/2025');
    expect(prompt).toContain('1. Dimensi Keimanan dan Ketakwaan');
    expect(prompt).toContain('7. Dimensi Kesehatan');
    expect(prompt).toContain('8. Dimensi Komunikasi');
    expect(prompt).toContain('Berkembang, Cakap (Standar Kelulusan/SKL), dan Mahir');
  });

  it('should strictly contain zero occurrences of "peserta didik" in the master data', () => {
    const jsonString = JSON.stringify(DIMENSI_PROFIL_LULUSAN).toLowerCase();
    expect(jsonString).not.toContain('peserta didik');
  });
});
