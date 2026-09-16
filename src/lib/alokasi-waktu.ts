/**
 * Standar Alokasi Waktu Resmi Sekolah Dasar (SD/MI)
 * Berdasarkan PERMENDIKDASMEN REPUBLIK INDONESIA NOMOR 13 TAHUN 2025
 * (Perubahan atas Permendikbudristek No. 12 Tahun 2024 tentang Kurikulum pada PAUD, Dikdas, dan Dikmen)
 * 
 * Ketentuan Utama:
 * 1. Durasi 1 JP = 35 menit.
 * 2. Asumsi 1 Tahun Ajaran = 36 minggu efektif (18 minggu/semester) untuk Kelas I-V.
 * 3. Asumsi 1 Tahun Ajaran = 32 minggu efektif (16 minggu/semester) untuk Kelas VI.
 * 4. P5 resmi berganti nomenklatur menjadi "Kokurikuler" (Pasal 16-19).
 * 5. Mata Pelajaran Pilihan Baru: "Koding dan Kecerdasan Artifisial" mulai Kelas V (Pasal 32A).
 */

export interface AlokasiWaktuMapel {
  mataPelajaranKey: string;
  namaResmi: string;
  kelas: number;
  fase: 'A' | 'B' | 'C';
  intrakurikulerPerTahun: number;
  kokurikulerPerTahun: number;
  totalPerTahun: number;
  jpPerMinggu: number;
  mingguPerTahun: number;
  mingguPerSemester: number;
  intrakurikulerPerSemester: number;
  keterangan?: string;
  dasarHukum: string;
}

// Master Tabel Alokasi Waktu Intrakurikuler & Kokurikuler (Permendikdasmen No. 13 Tahun 2025)
const DATA_ALOKASI_SD: Record<number, Record<string, { intra: number; koku: number; tot: number; wk: number; note?: string }>> = {
  // KELAS 1 (Fase A) - Asumsi 36 Minggu/Tahun, 18 Minggu/Smt
  1: {
    agama: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Agama dan Budi Pekerti' },
    pancasila: { intra: 144, koku: 36, tot: 180, wk: 4, note: 'Pendidikan Pancasila' },
    indonesia: { intra: 252, koku: 36, tot: 288, wk: 7, note: 'Bahasa Indonesia' },
    matematika: { intra: 144, koku: 36, tot: 180, wk: 4, note: 'Matematika' },
    pjok: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Jasmani Olahraga dan Kesehatan' },
    seni: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)' },
    inggris: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Bahasa Inggris (Pilihan)' },
    mulok: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Muatan Lokal (Maksimal 2 JP/minggu)' },
  },
  // KELAS 2 (Fase A) - Asumsi 36 Minggu/Tahun, 18 Minggu/Smt
  2: {
    agama: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Agama dan Budi Pekerti' },
    pancasila: { intra: 144, koku: 36, tot: 180, wk: 4, note: 'Pendidikan Pancasila' },
    indonesia: { intra: 288, koku: 36, tot: 324, wk: 8, note: 'Bahasa Indonesia' },
    matematika: { intra: 180, koku: 36, tot: 216, wk: 5, note: 'Matematika' },
    pjok: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Jasmani Olahraga dan Kesehatan' },
    seni: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)' },
    inggris: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Bahasa Inggris (Pilihan)' },
    mulok: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Muatan Lokal (Maksimal 2 JP/minggu)' },
  },
  // KELAS 3 (Fase B) - Asumsi 36 Minggu/Tahun, 18 Minggu/Smt
  3: {
    agama: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Agama dan Budi Pekerti' },
    pancasila: { intra: 144, koku: 36, tot: 180, wk: 4, note: 'Pendidikan Pancasila' },
    indonesia: { intra: 216, koku: 36, tot: 252, wk: 6, note: 'Bahasa Indonesia' },
    matematika: { intra: 180, koku: 36, tot: 216, wk: 5, note: 'Matematika' },
    ipas: { intra: 180, koku: 36, tot: 216, wk: 5, note: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)' },
    pjok: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Jasmani Olahraga dan Kesehatan' },
    seni: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)' },
    inggris: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Bahasa Inggris' },
    mulok: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Muatan Lokal (Maksimal 2 JP/minggu)' },
  },
  // KELAS 4 (Fase B) - Asumsi 36 Minggu/Tahun, 18 Minggu/Smt
  4: {
    agama: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Agama dan Budi Pekerti' },
    pancasila: { intra: 144, koku: 36, tot: 180, wk: 4, note: 'Pendidikan Pancasila' },
    indonesia: { intra: 216, koku: 36, tot: 252, wk: 6, note: 'Bahasa Indonesia' },
    matematika: { intra: 180, koku: 36, tot: 216, wk: 5, note: 'Matematika' },
    ipas: { intra: 180, koku: 36, tot: 216, wk: 5, note: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)' },
    pjok: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Jasmani Olahraga dan Kesehatan' },
    seni: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)' },
    inggris: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Bahasa Inggris' },
    mulok: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Muatan Lokal (Maksimal 2 JP/minggu)' },
  },
  // KELAS 5 (Fase C) - Asumsi 36 Minggu/Tahun, 18 Minggu/Smt
  5: {
    agama: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Agama dan Budi Pekerti' },
    pancasila: { intra: 144, koku: 36, tot: 180, wk: 4, note: 'Pendidikan Pancasila' },
    indonesia: { intra: 216, koku: 36, tot: 252, wk: 6, note: 'Bahasa Indonesia' },
    matematika: { intra: 180, koku: 36, tot: 216, wk: 5, note: 'Matematika' },
    ipas: { intra: 180, koku: 36, tot: 216, wk: 5, note: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)' },
    pjok: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Pendidikan Jasmani Olahraga dan Kesehatan' },
    seni: { intra: 108, koku: 36, tot: 144, wk: 3, note: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)' },
    inggris: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Bahasa Inggris' },
    koding: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Koding dan Kecerdasan Artifisial (Pilihan)' },
    mulok: { intra: 72, koku: 0, tot: 72, wk: 2, note: 'Muatan Lokal (Maksimal 2 JP/minggu)' },
  },
  // KELAS 6 (Fase C) - Asumsi 32 Minggu/Tahun, 16 Minggu/Smt
  6: {
    agama: { intra: 96, koku: 32, tot: 128, wk: 3, note: 'Pendidikan Agama dan Budi Pekerti' },
    pancasila: { intra: 128, koku: 32, tot: 160, wk: 4, note: 'Pendidikan Pancasila' },
    indonesia: { intra: 192, koku: 32, tot: 224, wk: 6, note: 'Bahasa Indonesia' },
    matematika: { intra: 160, koku: 32, tot: 192, wk: 5, note: 'Matematika' },
    ipas: { intra: 160, koku: 32, tot: 192, wk: 5, note: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)' },
    pjok: { intra: 96, koku: 32, tot: 128, wk: 3, note: 'Pendidikan Jasmani Olahraga dan Kesehatan' },
    seni: { intra: 96, koku: 32, tot: 128, wk: 3, note: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)' },
    inggris: { intra: 64, koku: 0, tot: 64, wk: 2, note: 'Bahasa Inggris' },
    koding: { intra: 64, koku: 0, tot: 64, wk: 2, note: 'Koding dan Kecerdasan Artifisial (Pilihan)' },
    mulok: { intra: 64, koku: 0, tot: 64, wk: 2, note: 'Muatan Lokal (Maksimal 2 JP/minggu)' },
  }
};

/**
 * Normalisasi nama mata pelajaran menjadi key standar
 */
export function normalizeMapelKey(mapelName: string = ''): string {
  const s = mapelName.toLowerCase();
  if (s.includes('agama') || s.includes('pai') || s.includes('budi pekerti')) return 'agama';
  if (s.includes('pancasila') || s.includes('ppkn') || s.includes('pkn')) return 'pancasila';
  if (s.includes('indonesia')) return 'indonesia';
  if (s.includes('matematika') || s.includes('mtk')) return 'matematika';
  if (s.includes('alam dan sosial') || s.includes('ipas') || s.includes('ipa') || s.includes('ips')) return 'ipas';
  if (s.includes('jasmani') || s.includes('olahraga') || s.includes('pjok') || s.includes('penjas')) return 'pjok';
  if (s.includes('seni') || s.includes('rupa') || s.includes('musik') || s.includes('tari') || s.includes('teater')) return 'seni';
  if (s.includes('inggris') || s.includes('english')) return 'inggris';
  if (s.includes('koding') || s.includes('coding') || s.includes('artifisial') || s.includes('kecerdasan') || s.includes('ai')) return 'koding';
  if (s.includes('sunda') || s.includes('lokal') || s.includes('mulok') || s.includes('tdba') || s.includes('tatanen') || s.includes('akpk')) return 'mulok';
  return 'ipas'; // Default fallback edukatif
}

/**
 * Normalisasi jenjang kelas menjadi angka 1 - 6
 */
export function normalizeKelasNum(jenjangKelas: string | number = 5): number {
  if (typeof jenjangKelas === 'number') {
    return (jenjangKelas >= 1 && jenjangKelas <= 6) ? jenjangKelas : 5;
  }
  const str = String(jenjangKelas);
  const match = str.match(/[1-6]/);
  return match ? parseInt(match[0], 10) : 5;
}

/**
 * Mengambil alokasi waktu resmi berdasarkan mata pelajaran dan kelas
 */
export function getAlokasiWaktuResmi(mapelName: string, jenjangKelas: string | number): AlokasiWaktuMapel {
  const k = normalizeKelasNum(jenjangKelas);
  const mapelKey = normalizeMapelKey(mapelName);
  const fase: 'A' | 'B' | 'C' = (k <= 2) ? 'A' : (k <= 4) ? 'B' : 'C';

  const classData = DATA_ALOKASI_SD[k] || DATA_ALOKASI_SD[5];
  let item = classData[mapelKey];

  // Fallback jika mapel tidak ada di kelas terkait (misal IPAS di kelas 1)
  if (!item) {
    if (mapelKey === 'ipas') {
      item = { intra: 180, koku: 36, tot: 216, wk: 5, note: 'IPAS (Standar Fase B/C)' };
    } else {
      item = { intra: 72, koku: 0, tot: 72, wk: 2, note: mapelName };
    }
  }

  const mingguPerTahun = (k === 6) ? 32 : 36;
  const mingguPerSemester = mingguPerTahun / 2;
  const intrakurikulerPerSemester = item.intra / 2;

  return {
    mataPelajaranKey: mapelKey,
    namaResmi: item.note || mapelName,
    kelas: k,
    fase,
    intrakurikulerPerTahun: item.intra,
    kokurikulerPerTahun: item.koku,
    totalPerTahun: item.tot,
    jpPerMinggu: item.wk,
    mingguPerTahun,
    mingguPerSemester,
    intrakurikulerPerSemester,
    dasarHukum: 'Permendikdasmen No. 13 Tahun 2025'
  };
}

/**
 * Algoritma Auto-Balance Alokasi Waktu Jam Pelajaran (JP) ke Bab & TP Items
 * Memastikan total penjumlahan JP tiap materi dalam 1 semester persis sama dengan kuota Permendikdasmen 13/2025.
 */
export function balanceSemesterJpItems(
  babs: any[],
  targetSemesterJp: number,
  jpPerMinggu: number
): void {
  if (!Array.isArray(babs) || babs.length === 0 || targetSemesterJp <= 0) return;

  // 1. Kumpulkan seluruh pointer items dalam semester ini
  const allItems: any[] = [];
  for (const bab of babs) {
    if (Array.isArray(bab.items) && bab.items.length > 0) {
      for (const item of bab.items) {
        allItems.push(item);
      }
    }
  }

  if (allItems.length === 0) return;

  // 2. Baca nilai awal JP atau tentukan bobot awal
  const currentJps = allItems.map(it => {
    if (typeof it.alokasi_waktu === 'string') {
      const match = it.alokasi_waktu.match(/\d+/);
      if (match) return parseInt(match[0], 10);
    }
    return jpPerMinggu || 4;
  });

  const currentTotal = currentJps.reduce((a, b) => a + b, 0);

  // 3. Hitung proporsi baru agar total persis sama dengan targetSemesterJp
  const newJps: number[] = [];
  let allocated = 0;

  for (let i = 0; i < allItems.length; i++) {
    const rawRatio = currentTotal > 0 ? (currentJps[i] / currentTotal) : (1 / allItems.length);
    let target = Math.round(rawRatio * targetSemesterJp);
    if (target < 1) target = 1;
    newJps.push(target);
    allocated += target;
  }

  // 4. Koreksi selisih pembulatan (rounding difference)
  let diff = targetSemesterJp - allocated;
  let guard = 0;
  while (diff !== 0 && guard < 100) {
    guard++;
    if (diff > 0) {
      // Tambahkan ke item dengan alokasi yang masih proporsional
      const idx = (guard - 1) % allItems.length;
      newJps[idx] += 1;
      diff--;
    } else {
      // Kurangi dari item terbesar yang masih > 1
      let maxIdx = -1;
      let maxVal = -1;
      for (let i = 0; i < newJps.length; i++) {
        if (newJps[i] > 1 && newJps[i] > maxVal) {
          maxVal = newJps[i];
          maxIdx = i;
        }
      }
      if (maxIdx !== -1) {
        newJps[maxIdx] -= 1;
        diff++;
      } else {
        break; // Tidak bisa dikurangi lagi
      }
    }
  }

  // 5. Tuliskan kembali ke objek item
  for (let i = 0; i < allItems.length; i++) {
    allItems[i].alokasi_waktu = `${newJps[i]} JP`;
  }
}
