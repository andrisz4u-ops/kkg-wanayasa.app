import { describe, it, expect } from 'vitest';
import {
  getAlokasiWaktuResmi,
  balanceSemesterJpItems,
  normalizeMapelKey,
  normalizeKelasNum
} from '../src/lib/alokasi-waktu';

describe('Standar Alokasi Waktu Permendikdasmen No. 13 Tahun 2025', () => {
  it('harus memuat struktur resmi IPAS Kelas 5 Fase C dengan benar', () => {
    const quota = getAlokasiWaktuResmi('Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Kelas 5 (Fase C)');
    expect(quota.kelas).toBe(5);
    expect(quota.fase).toBe('C');
    expect(quota.jpPerMinggu).toBe(5);
    expect(quota.intrakurikulerPerSemester).toBe(90);
    expect(quota.intrakurikulerPerTahun).toBe(180);
    expect(quota.kokurikulerPerTahun).toBe(36);
    expect(quota.totalPerTahun).toBe(216);
    expect(quota.dasarHukum).toBe('Permendikdasmen No. 13 Tahun 2025');
  });

  it('harus memuat struktur resmi Bahasa Indonesia Kelas 1 dan Kelas 2 Fase A', () => {
    const k1 = getAlokasiWaktuResmi('Bahasa Indonesia', 1);
    expect(k1.jpPerMinggu).toBe(7);
    expect(k1.intrakurikulerPerTahun).toBe(252);
    expect(k1.intrakurikulerPerSemester).toBe(126);

    const k2 = getAlokasiWaktuResmi('Bahasa Indonesia', 2);
    expect(k2.jpPerMinggu).toBe(8);
    expect(k2.intrakurikulerPerTahun).toBe(288);
    expect(k2.intrakurikulerPerSemester).toBe(144);
  });

  it('harus mengenali Mata Pelajaran Pilihan Baru Koding & Kecerdasan Artifisial di Kelas 5 dan 6', () => {
    const k5 = getAlokasiWaktuResmi('Koding dan Kecerdasan Artifisial', 5);
    expect(k5.jpPerMinggu).toBe(2);
    expect(k5.intrakurikulerPerTahun).toBe(72);
    expect(k5.intrakurikulerPerSemester).toBe(36);

    const k6 = getAlokasiWaktuResmi('Koding dan AI', 6);
    expect(k6.jpPerMinggu).toBe(2);
    expect(k6.intrakurikulerPerTahun).toBe(64); // 32 pekan
    expect(k6.intrakurikulerPerSemester).toBe(32);
  });

  it('harus menyeimbangkan total JP dalam semester agar pas 100% dengan kuota resmi', () => {
    // Simulasi 4 bab dengan JP acak
    const babs = [
      {
        no: 1,
        items: [
          { kode_tp: '5.1', alokasi_waktu: '2 JP' },
          { kode_tp: '5.2', alokasi_waktu: '2 JP' }
        ]
      },
      {
        no: 2,
        items: [
          { kode_tp: '5.3', alokasi_waktu: '2 JP' }
        ]
      },
      {
        no: 3,
        items: [
          { kode_tp: '5.4', alokasi_waktu: '3 JP' },
          { kode_tp: '5.5', alokasi_waktu: '2 JP' }
        ]
      },
      {
        no: 4,
        items: [
          { kode_tp: '5.6', alokasi_waktu: '2 JP' }
        ]
      }
    ];

    const targetSemesterJp = 90; // IPAS Smt 1
    balanceSemesterJpItems(babs, targetSemesterJp, 5);

    let sum = 0;
    for (const b of babs) {
      for (const it of b.items) {
        const match = it.alokasi_waktu.match(/\d+/);
        const val = match ? parseInt(match[0], 10) : 0;
        expect(val).toBeGreaterThan(0);
        sum += val;
      }
    }

    expect(sum).toBe(90); // Pastikan tepat 90 JP!
  });
});
