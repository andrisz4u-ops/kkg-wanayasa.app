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

  it('harus menyeimbangkan Seni Rupa Kelas 5 ke 54 JP per semester (bukan 90 JP)', async () => {
    const { validateAndRepairAnalysisResult } = await import('../src/routes/analisis-cp');
    const rawResult = {
      metadata: {
        mata_pelajaran: 'Seni Rupa',
        kelas: '5'
      },
      semesters: [
        {
          semester: 1,
          semester_label: 'SEMESTER 1',
          babs: [
            {
              no: 1,
              bab: 'Bab 1: Mengenal Unsur',
              items: [
                { kode_tp: '5.1', materi_pokok: 'Unsur', alokasi_waktu: '4 JP' }
              ]
            }
          ]
        }
      ]
    };

    const res = validateAndRepairAnalysisResult(rawResult, [], {
      namaSekolah: 'SDN 1 Wanayasa',
      namaGuru: 'Guru Seni',
      mataPelajaran: 'Seni Rupa',
      jenjangKelas: 'Kelas 5 (Fase C)',
      fase: 'C',
      tahunAjaran: '2025/2026'
    });

    const sem1Total = res.semesters[0].babs.reduce((acc: number, b: any) => {
      return acc + b.items.reduce((s: number, it: any) => s + parseInt(it.alokasi_waktu), 0);
    }, 0);

    console.log('DEBUG sem1Total Seni Rupa:', sem1Total);
    expect(sem1Total).toBe(54);
  });

  it('harus menyeimbangkan seluruh mata pelajaran Kelas 5 sesuai kuota resmi masing-masing', async () => {
    const { validateAndRepairAnalysisResult } = await import('../src/routes/analisis-cp');

    const testCases = [
      { mapel: 'Pendidikan Agama dan Budi Pekerti', expectedSmtJp: 54, expectedWk: 3 },
      { mapel: 'Pendidikan Pancasila', expectedSmtJp: 72, expectedWk: 4 },
      { mapel: 'Bahasa Indonesia', expectedSmtJp: 108, expectedWk: 6 },
      { mapel: 'Matematika', expectedSmtJp: 90, expectedWk: 5 },
      { mapel: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', expectedSmtJp: 90, expectedWk: 5 },
      { mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', expectedSmtJp: 54, expectedWk: 3 },
      { mapel: 'Seni Rupa', expectedSmtJp: 54, expectedWk: 3 },
      { mapel: 'Bahasa Inggris', expectedSmtJp: 36, expectedWk: 2 },
      { mapel: 'Koding dan Kecerdasan Artifisial', expectedSmtJp: 36, expectedWk: 2 },
      { mapel: 'B.Sunda', expectedSmtJp: 36, expectedWk: 2 },
      { mapel: 'Tatanen di Bale Atikan', expectedSmtJp: 36, expectedWk: 2 },
      { mapel: 'AKPK', expectedSmtJp: 36, expectedWk: 2 }
    ];

    for (const tc of testCases) {
      const rawResult = {
        metadata: { mata_pelajaran: tc.mapel, kelas: '5' },
        semesters: [
          {
            semester: 1,
            semester_label: 'SEMESTER 1',
            babs: [
              {
                no: 1,
                bab: 'Bab 1',
                items: [{ kode_tp: '5.1', alokasi_waktu: '2 JP' }]
              },
              {
                no: 2,
                bab: 'Bab 2',
                items: [{ kode_tp: '5.2', alokasi_waktu: '2 JP' }]
              }
            ]
          }
        ]
      };

      const res = validateAndRepairAnalysisResult(rawResult, [], {
        namaSekolah: 'SDN 1 Wanayasa',
        namaGuru: 'Guru Penguji',
        mataPelajaran: tc.mapel,
        jenjangKelas: 'Kelas 5 (Fase C)',
        fase: 'C',
        tahunAjaran: '2025/2026'
      });

      const actualSum = res.semesters[0].babs.reduce((acc: number, b: any) => {
        return acc + b.items.reduce((s: number, it: any) => s + parseInt(it.alokasi_waktu), 0);
      }, 0);

      expect(actualSum, `${tc.mapel} semester 1 harus pas ${tc.expectedSmtJp} JP`).toBe(tc.expectedSmtJp);
      expect(res.metadata.alokasi_waktu_standar.jp_per_minggu).toBe(tc.expectedWk);
    }
  });

  it('harus memvalidasi distribusi matriks Promes waterfall untuk seluruh mata pelajaran', () => {
    // Simulasi mapel dengan beban mingguan berbeda: 2 JP, 3 JP, 4 JP, 5 JP, 6 JP
    const mapels = [
      { name: 'Bahasa Inggris', wk: 2, totalJp: 36 },
      { name: 'Seni Rupa', wk: 3, totalJp: 54 },
      { name: 'Pendidikan Pancasila', wk: 4, totalJp: 72 },
      { name: 'Matematika', wk: 5, totalJp: 90 },
      { name: 'Bahasa Indonesia', wk: 6, totalJp: 108 }
    ];

    const activeKbmWeeks = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    for (const m of mapels) {
      // 8 topik dalam 1 semester
      const itemJp = Math.floor(m.totalJp / 8);
      const items = Array.from({ length: 8 }, (_, i) => ({
        jp: (i === 7) ? (m.totalJp - itemJp * 7) : itemJp
      }));

      const itemWeekAllocations = new Map<number, Record<number, number>>();
      let kbmIdx = 0;
      let weekRemainingJp = m.wk;

      items.forEach((it, rowIdx) => {
        let neededJp = it.jp;
        while (neededJp > 0 && kbmIdx < activeKbmWeeks.length) {
          const currentWeek = activeKbmWeeks[kbmIdx];
          const canTake = Math.min(neededJp, weekRemainingJp);
          if (canTake > 0) {
            if (!itemWeekAllocations.has(rowIdx)) itemWeekAllocations.set(rowIdx, {});
            const rowAlloc = itemWeekAllocations.get(rowIdx)!;
            rowAlloc[currentWeek] = (rowAlloc[currentWeek] || 0) + canTake;
            neededJp -= canTake;
            weekRemainingJp -= canTake;
          }
          if (weekRemainingJp === 0) {
            kbmIdx++;
            weekRemainingJp = m.wk;
          }
        }
      });

      // 1. Pastikan Juli Minggu 1 dan 2 (w=1, w=2) selalu 0 JP (sekolah belum masuk)
      for (const [_, allocs] of itemWeekAllocations.entries()) {
        expect(allocs[1] || 0).toBe(0);
        expect(allocs[2] || 0).toBe(0);
      }

      // 2. Pastikan di setiap kolom minggu manapun, total JP guru tidak melebihi kapasitas mingguan (wk)
      const weekTotals: Record<number, number> = {};
      let totalAllocated = 0;
      for (const [_, allocs] of itemWeekAllocations.entries()) {
        for (const [wStr, jpVal] of Object.entries(allocs)) {
          const w = parseInt(wStr, 10);
          weekTotals[w] = (weekTotals[w] || 0) + jpVal;
          totalAllocated += jpVal;
        }
      }

      for (const [w, sum] of Object.entries(weekTotals)) {
        expect(sum, `Total JP di minggu ke-${w} untuk ${m.name} tidak boleh melebihi ${m.wk}`).toBeLessThanOrEqual(m.wk);
      }

      // 3. Pastikan total yang terdistribusi pas 100% dengan total semester
      expect(totalAllocated, `Total JP ${m.name} harus teralokasi utuh`).toBe(m.totalJp);

      // 4. Pastikan pembelajaran mulai di minggu ke-3 Juli (w=3) dan merata hingga akhir semester
      expect(weekTotals[3]).toBeGreaterThan(0);
    }
  });
});
