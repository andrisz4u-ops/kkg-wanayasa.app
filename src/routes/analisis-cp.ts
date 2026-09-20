import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import { getOfficialCP, getOfficialCPElements, cpElementsData, getDynamicCP, getDynamicCPElements, getFaseFromKelas } from '../lib/cp-data';
import { getCookie, getCurrentUser } from '../lib/auth';
import { recordAIGeneration } from '../lib/telemetry';
import { generateAnalisisCpDocxBuffer, type AnalisisCpDocxInput } from '../lib/docx/analisis-cp';
import { generateProtaDocxBuffer } from '../lib/docx/prota';
import { generatePromesDocxBuffer } from '../lib/docx/promes';
import { generateKktpDocxBuffer } from '../lib/docx/kktp';
import { generateRpeDocxBuffer } from '../lib/docx/rpe';
import { generateAtpElemenDocxBuffer, groupAnalysisDataByElements } from '../lib/docx/atp-elemen';
import { generateCapaianPembelajaranDocxBuffer } from '../lib/docx/capaian-pembelajaran';
import { getOfficialCpDocumentData } from '../lib/cp-document-data';
import { getAlokasiWaktuResmi, balanceSemesterJpItems } from '../lib/alokasi-waktu';
import { type AppBindings } from '../types/env';

export { groupAnalysisDataByElements, getOfficialCpDocumentData };

const analisisCp = new Hono<{ Bindings: AppBindings }>();

// Helper kalkulasi pembagian bab antar semester:
// - Jika targetSemester/bookCoverage === '1' (Semester 1 Saja): Semua bab 100% masuk Semester 1 (TIDAK dibagi 2).
// - Jika targetSemester/bookCoverage === '2' (Semester 2 Saja): Semua bab 100% masuk Semester 2 (TIDAK dibagi 2).
// - Jika setahun penuh: genap dibagi 2 sama rata, ganjil semester 1 lebih banyak 1 bab.
export function distributeChaptersToSemesters(
  chapters: any[],
  targetSemester?: string | number,
  bookCoverage?: string
): any[] {
  if (!Array.isArray(chapters) || chapters.length === 0) return [];
  const targetStr = String(bookCoverage || targetSemester || 'all').toLowerCase();

  // Jika semester 1 saja: semua bab 100% masuk Semester 1 (tidak dibagi 2)
  if (targetStr === '1' || targetStr === 'sem1' || targetStr === 'semester 1') {
    return chapters.map((ch, idx) => ({
      ...ch,
      no: ch.no || idx + 1,
      semester: 1
    }));
  }

  // Jika semester 2 saja: semua bab 100% masuk Semester 2 (tidak dibagi 2)
  if (targetStr === '2' || targetStr === 'sem2' || targetStr === 'semester 2') {
    return chapters.map((ch, idx) => ({
      ...ch,
      no: ch.no || idx + 1,
      semester: 2
    }));
  }

  // Jika tiap bab sudah punya nilai semester eksplisit (misal diset manual dari UI): pertahankan!
  const hasExplicitSemesters = chapters.some(ch => ch.semester === 1 || ch.semester === 2);
  if (hasExplicitSemesters) {
    return chapters.map((ch, idx) => ({
      ...ch,
      no: ch.no || idx + 1,
      semester: ch.semester ? Number(ch.semester) : (idx < Math.ceil(chapters.length / 2) ? 1 : 2)
    }));
  }

  // Default: bagi 2 secara proporsional (genap dibagi 2, ganjil semester 1 lebih banyak 1)
  const total = chapters.length;
  const sem1Count = Math.ceil(total / 2);

  return chapters.map((ch, idx) => ({
    ...ch,
    no: ch.no || idx + 1,
    semester: ch.semester ? Number(ch.semester) : (idx < sem1Count ? 1 : 2)
  }));
}

// Helper untuk mengganti seluruh variasi kata 'Peserta didik' menjadi 'Murid'
export function replacePesertaDidik<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    return data
      .replace(/lembar\s+kerja\s+peserta\s+didik\s*\((?:lkpd|lkm)\)/gi, 'Lembar Kerja Murid (LKM)')
      .replace(/lembar\s+kerja\s+peserta\s+didik/gi, 'Lembar Kerja Murid')
      .replace(/peserta\s+didik/gi, (match) => {
        if (match === 'PESERTA DIDIK') return 'MURID';
        if (match === 'peserta didik') return 'murid';
        return 'Murid';
      }) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => replacePesertaDidik(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const res: any = {};
    for (const key of Object.keys(data)) {
      res[key] = replacePesertaDidik((data as any)[key]);
    }
    return res as T;
  }
  return data;
}

import { standardCurriculumDatabase, type CurriculumChapter, type CurriculumPreset } from '../lib/curriculum-database';
export { standardCurriculumDatabase, type CurriculumChapter, type CurriculumPreset };

// Helper mengambil bab standar dari D1 database dengan fallback ke standardCurriculumDatabase
export async function getStandardCurriculumChaptersFromDb(
  db: D1Database | undefined,
  mataPelajaran: string,
  jenjangKelas: string
): Promise<{ judul: string; chapters: any[] } | null> {
  if (!db) return null;
  try {
    const normMapel = (mataPelajaran || '').trim();
    const kelasMatch = (jenjangKelas || '').match(/\d+/);
    const kelasKey = kelasMatch ? `Kelas ${kelasMatch[0]}` : 'Kelas 5';

    const row: any = await db.prepare(`
      SELECT buku_judul, chapters_json 
      FROM curriculum_standard_chapters 
      WHERE (LOWER(mata_pelajaran) = LOWER(?) OR LOWER(mata_pelajaran) LIKE LOWER(?)) 
        AND (jenjang_kelas = ? OR jenjang_kelas = ?)
      ORDER BY COALESCE(tahun_terbit, 2024) DESC, created_at DESC
      LIMIT 1
    `).bind(normMapel, `%${normMapel}%`, kelasKey, kelasMatch ? kelasMatch[0] : '5').first();

    if (row && row.chapters_json) {
      const parsed = JSON.parse(row.chapters_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          judul: row.buku_judul,
          chapters: parsed
        };
      }
    }
  } catch (_) {
    // Graceful fallback to static database
  }
  return null;
}

// Helper mengambil seluruh profil buku yang tersedia untuk mapel dan kelas (DB + Preset Standar)
export async function getAllBookProfiles(
  db: D1Database | undefined,
  mataPelajaran: string,
  jenjangKelas: string
): Promise<any[]> {
  const normMapel = (mataPelajaran || '').trim();
  const kelasMatch = (jenjangKelas || '').match(/\d+/);
  const kelasKey = kelasMatch ? `Kelas ${kelasMatch[0]}` : 'Kelas 5';
  const rawNum = kelasMatch ? kelasMatch[0] : '5';

  const profiles: any[] = [];

  // 1. Ambil dari DB jika koneksi D1 tersedia
  if (db) {
    try {
      const rows: any = await db.prepare(`
        SELECT id, mata_pelajaran, jenjang_kelas, buku_judul, tahun_terbit, penerbit, total_babs, chapters_json, created_at
        FROM curriculum_standard_chapters
        WHERE (LOWER(mata_pelajaran) = LOWER(?) OR LOWER(mata_pelajaran) LIKE LOWER(?))
          AND (jenjang_kelas = ? OR jenjang_kelas = ?)
        ORDER BY COALESCE(tahun_terbit, 2024) DESC, created_at DESC
      `).bind(normMapel, `%${normMapel}%`, kelasKey, rawNum).all();

      if (rows?.results && Array.isArray(rows.results)) {
        for (const r of rows.results) {
          try {
            const chs = JSON.parse(r.chapters_json);
            if (Array.isArray(chs) && chs.length > 0) {
              let rowYear = r.tahun_terbit;
              if (!rowYear) {
                const ym = String(r.buku_judul || '').match(/\b(202[0-9])\b/);
                rowYear = ym ? parseInt(ym[1], 10) : 2025;
              }
              profiles.push({
                id: String(r.id),
                buku_judul: r.buku_judul,
                tahun_terbit: rowYear,
                penerbit: r.penerbit || 'Kemendikbudristek / Guru Pengunggah',
                total_babs: chs.length,
                chapters: chs,
                is_custom: true
              });
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  // 2. Sertakan preset standar resmi dari standardCurriculumDatabase
  const staticPreset = getStandardCurriculumChapters(mataPelajaran, jenjangKelas);
  if (staticPreset && Array.isArray(staticPreset.chapters)) {
    let year = 2024;
    const yearMatch = staticPreset.judul.match(/\b(202[0-9])\b/);
    if (yearMatch) year = parseInt(yearMatch[1], 10);

    const cleanStaticTitle = staticPreset.judul.toLowerCase().trim();
    const alreadyExists = profiles.some(p => p.buku_judul.toLowerCase().trim() === cleanStaticTitle);

    if (!alreadyExists) {
      profiles.push({
        id: `preset_${normMapel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${rawNum}`,
        buku_judul: staticPreset.judul,
        tahun_terbit: year,
        penerbit: 'Kemendikbudristek',
        total_babs: staticPreset.chapters.length,
        chapters: staticPreset.chapters,
        is_custom: false
      });
    }
  }

  // 3. Urutkan berdasarkan tahun terbit terbaru secara descending
  profiles.sort((a, b) => (b.tahun_terbit || 0) - (a.tahun_terbit || 0));

  // 4. Tandai buku tahun paling baru sebagai default
  if (profiles.length > 0) {
    profiles[0].is_default = true;
    for (let i = 1; i < profiles.length; i++) {
      profiles[i].is_default = false;
    }
  }

  return profiles;
}


// Helper mendapatkan daftar bab standar kurikulum resmi jika ekstraksi PDF terpotong
export function getStandardCurriculumChapters(mataPelajaran: string, jenjangKelas: string) {
  const normMapel = (mataPelajaran || '').toLowerCase().trim();
  const kelasMatch = (jenjangKelas || '').match(/\d+/);
  const kelasKey = kelasMatch ? kelasMatch[0] : '5';

  let subjectKey = Object.keys(standardCurriculumDatabase).find(k => normMapel.includes(k) || k.includes(normMapel));
  if (!subjectKey) {
    if (normMapel.includes('indonesia')) subjectKey = 'bahasa indonesia';
    else if (normMapel.includes('ipas') || normMapel.includes('ipa') || normMapel.includes('ips') || normMapel.includes('ilmu pengetahuan alam')) subjectKey = 'ipas';
    else if (normMapel.includes('matematika')) subjectKey = 'matematika';
    else if (normMapel.includes('pancasila') || normMapel.includes('pkn')) subjectKey = 'pendidikan pancasila';
    else if (normMapel.includes('agama') || normMapel.includes('paibp') || normMapel.includes('pai') || normMapel.includes('islam')) subjectKey = 'pendidikan agama dan budi pekerti';
    else if (normMapel.includes('pjok') || normMapel.includes('jasmani') || normMapel.includes('olahraga')) subjectKey = 'pendidikan jasmani, olahraga, dan kesehatan (pjok)';
    else if (normMapel.includes('inggris')) subjectKey = 'bahasa inggris';
    else if (normMapel.includes('seni') || normMapel.includes('rupa')) subjectKey = 'seni rupa';
    else if (normMapel.includes('koding') || normMapel.includes('artifisial')) subjectKey = 'koding dan kecerdasan artifisial';
    else if (normMapel.includes('sunda')) subjectKey = 'b.sunda';
    else if (normMapel.includes('tatanen') || normMapel.includes('tdba')) subjectKey = 'tatanen di bale atikan';
    else if (normMapel.includes('akpk')) subjectKey = 'akpk';
  }

  if (subjectKey && standardCurriculumDatabase[subjectKey]?.[kelasKey]) {
    return standardCurriculumDatabase[subjectKey][kelasKey];
  }

  return null;
}

// Helper ekstraksi struktur Bab & Materi Pokok dari teks buku/daftar isi
export function buildStructurePrompt(rawText: string, mataPelajaran: string, jenjangKelas: string, targetSemester: string = 'all') {
  // Bersihkan teks: hilangkan deretan titik daftar isi (...), spasi berlebih, dan baris kosong beruntun
  const cleanedText = (rawText || '')
    .replace(/\.{3,}/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/(\r?\n\s*){3,}/g, '\n\n')
    .slice(0, 16000);

  const isSem1 = String(targetSemester) === '1' || String(targetSemester).toLowerCase().includes('sem1');
  const isSem2 = String(targetSemester) === '2' || String(targetSemester).toLowerCase().includes('sem2');

  const semesterRule = isSem1
    ? '- BUKU KHUSUS SEMESTER 1: Seluruh bab yang ada di buku ini adalah materi SEMESTER 1. Wajib tetapkan SEMUA bab ke "semester": 1 (DILARANG KERAS membagi bab ke Semester 2!).'
    : isSem2
    ? '- BUKU KHUSUS SEMESTER 2: Seluruh bab yang ada di buku ini adalah materi SEMESTER 2. Wajib tetapkan SEMUA bab ke "semester": 2 (DILARANG KERAS membagi bab ke Semester 1!).'
    : '- BUKU 1 TAHUN PENUH: Jika jumlah bab total genap (misal 8 bab): Bagi rata (Bab 1-4 = Semester 1, Bab 5-8 = Semester 2). Jika ganjil (misal 9 bab): Semester 1 lebih banyak (Bab 1-5 = Semester 1, Bab 6-9 = Semester 2).';

  return `Anda adalah Asisten Pakar Kurikulum Merdeka Sekolah Dasar Kemendikbudristek RI.
Tugas Anda adalah membaca teks Daftar Isi buku teks pelajaran berikut, lalu mengekstrak SELURUH BAB dan Materi Pokok/sub-bab secara akurat, lengkap, dan tanpa ada bab yang tertinggal.

Mata Pelajaran: ${mataPelajaran || 'Umum'}
Jenjang/Kelas: ${jenjangKelas || 'SD'}
Target Semester: ${isSem1 ? 'Khusus Semester 1' : isSem2 ? 'Khusus Semester 2' : 'Setahun Penuh'}

TEKS DAFTAR ISI BUKU:
"""
${cleanedText}
"""

ATURAN WAJIB & KRITIS (SANGAT PENTING):
1. WAJIB EKSTRAK SEMUA BAB:
   - Periksa seluruh teks dari awal hingga akhir, dan temukan Bab 1, Bab 2, Bab 3, Bab 4, Bab 5, Bab 6, Bab 7, Bab 8, dst.
   - DILARANG KERAS HANYA MENGELUARKAN 1 BAB!
2. FORMAT JUDUL BAB:
   - Tuliskan nomor bab dan judul lengkapnya secara jelas sesuai teks daftar isi, contoh: "Bab 1: [Judul Bab Pertama]", "Bab 2: [Judul Bab Kedua]".
3. MATERI POKOK:
   - Tuliskan 2 sampai 4 submateri/topik pokok penting dalam setiap bab secara padat dan ringkas (contoh: ["Kata sifat", "Sinonim dan Antonim", "Makna awalan pe-", "Teks Deskripsi"]).
   - JANGAN membuat uraian penjelasan panjang agar respons tidak terpotong oleh limit token AI.
4. PEMBAGIAN SEMESTER:
   ${semesterRule}
5. FORMAT OUTPUT JSON:
   Keluarkan HANYA JSON valid tanpa teks pembuka/penutup dan tanpa penalaran bertele-tele:
{
  "buku_judul": "Nama Buku Siswa / Penerbit yang Teridentifikasi",
  "total_babs": 8,
  "chapters": [
    {
      "no": 1,
      "bab": "Bab 1: Judul Bab Pertama",
      "materi_pokok": ["Topik 1", "Topik 2", "Topik 3"],
      "semester": 1
    },
    {
      "no": 2,
      "bab": "Bab 2: Judul Bab Kedua",
      "materi_pokok": ["Topik 1", "Topik 2"],
      "semester": 1
    },
    {
      "no": 3,
      "bab": "Bab 3: Judul Bab Ketiga",
      "materi_pokok": ["Topik 1", "Topik 2"],
      "semester": 1
    }
  ]
}`;
}

// Helper pembuatan Prompt Analisis CP, TP, dan ATP
export function buildAnalisisCpPrompt(params: {
  namaSekolah: string;
  mataPelajaran: string;
  jenjangKelas: string;
  fase: string;
  tahunAjaran: string;
  chapters: any[];
  targetSemester: string;
  baseCP: string | null;
  elementsCP: any;
}) {
  const { namaSekolah, mataPelajaran, jenjangKelas, fase, tahunAjaran, chapters, targetSemester, baseCP, elementsCP } = params;

  const kelasNum = (jenjangKelas.match(/\d+/) || ['5'])[0];
  const filteredChapters = chapters.filter(ch => {
    if (targetSemester === '1') return ch.semester === 1;
    if (targetSemester === '2') return ch.semester === 2;
    return true; // 'all'
  });

  const quota = getAlokasiWaktuResmi(mataPelajaran, jenjangKelas);

  const normMapel = (mataPelajaran || '').toLowerCase();
  const isIpas = normMapel.includes('ipas') || normMapel.includes('ilmu pengetahuan alam') || normMapel.includes('sains');

  const elemenRule = isIpas
    ? `2. [KOLOM ELEMEN / CAPAIAN PEMBELAJARAN - WAJIB FORMAT DWI-ELEMEN UNTUK IPAS]:
   Dalam Kurikulum Merdeka resmi Kemendikbudristek RI, mata pelajaran IPAS memiliki 2 Elemen yang SALING MELENGKAPI dan TIDAK BOLEH dipisahkan:
   - Elemen 1: [Pemahaman IPAS] (konten sains alam dan sosial)
   - Elemen 2: [Keterampilan Proses] (kerja ilmiah dan penyelidikan)
   Setiap bab IPAS WAJIB mencantumkan KEDUA Elemen tersebut secara lengkap:

   a. [Pemahaman IPAS]:
      - Pilih dan petakan kalimat resmi CP Pemahaman IPAS yang SPESIFIK dan TEPAT menaungi materi bab ini!
      - PERINGATAN KERAS: DILARANG KERAS MENYALIN ULANG KALIMAT CP YANG SAMA KE SEMUA BAB!
      - PANDUAN PEMETAAN KLAUSUL RESMI IPAS FASE C KELAS 5 (Kemendikbudristek):
        * Bab 1 (Di Mana Indonesia Berada / Geografi): "Menjelaskan letak dan kondisi geografis negara Indonesia dengan menggunakan peta konvensional/digital."
        * Bab 2 (Majulah Daerahku / Kegiatan Ekonomi): "Menerapkan kegiatan ekonomi masyarakat di lingkungan sekitar dan menjelaskan pengelolaan keuangan/kebutuhan hidup secara bijak."
        * Bab 3 (Harmoni dalam Ekosistem / Rantai Makanan): "Menganalisis hubungan antar komponen biotik dan abiotik, serta pengaruhnya terhadap ekosistem."
        * Bab 4 (Air Sumber Kehidupan / Siklus Air & Energi): "Menghasilkan upaya penghematan energi, serta pemanfaatan sumber energi alternatif dari sumber daya yang ada di sekitarnya sebagai upaya mitigasi perubahan iklim, serta memahami siklus air dan kaitannya dengan upaya menjaga ketersediaan air."
        * Bab 5 (Daerahku yang Bersejarah / Pahlawan & Budaya): "Meninjau sejarah perjuangan para pahlawan di lingkungan sekitar tempat tinggalnya dan menemukan keragaman budaya nasional dalam konteks kebinekaan."
        * Bab 6 (Perubahan pada Diriku / Pubertas & Kesehatan): "Merefleksikan sistem organ tubuh manusia yang dikaitkan dengan cara menjaga kesehatan tubuhnya (masa puber)."
        * Bab 7 (Bermain dengan Cahaya / Sifat Cahaya): "Menjelaskan fenomena gelombang cahaya dalam kehidupan sehari-hari melalui penyelidikan sederhana."
        * Bab 8 (Ramai karena Bunyi / Sifat Bunyi): "Menjelaskan fenomena gelombang bunyi dalam kehidupan sehari-hari melalui penyelidikan sederhana."
        * Jika ada bab lain (misal Tata Surya/Bumi): "Menjelaskan sistem tata surya, serta kaitannya dengan rotasi dan revolusi bumi."

   b. [Keterampilan Proses]:
      - Cantumkan keterampilan proses ilmiah yang DILATIHKAN pada bab tersebut secara spesifik dan relevan dari 6 pilar BSKAP:
        (1) Mengamati, (2) Mempertanyakan & Memprediksi, (3) Merencanakan & Melakukan Penyelidikan,
        (4) Memproses serta Menganalisis Data dan Informasi, (5) Mengevaluasi dan Refleksi, (6) Mengomunikasikan Hasil.
      - Sesuaikan kata-kata kegiatan dengan aktivitas bab (contoh: pada bab geografi sebutkan pengamatan peta; pada bab ekonomi sebutkan observasi pasar/wawancara; pada bab ekosistem sebutkan pengamatan rantai makanan; pada bab air/cahaya/bunyi sebutkan penyelidikan eksperimen).

   Contoh format Kolom Elemen/CP IPAS yang benar:
   "[Pemahaman IPAS]
   Menjelaskan letak dan kondisi geografis negara Indonesia dengan menggunakan peta konvensional/digital.

   [Keterampilan Proses]
   Mengamati fenomena geografis pada peta, memproses serta menyajikan data luas daratan/lautan dalam bentuk tabel, dan mengomunikasikan hasil analisis."`
    : `2. [KOLOM ELEMEN / CAPAIAN PEMBELAJARAN]: Pilih dan petakan kalimat Capaian Pembelajaran RESMI pemerintah di atas yang paling selaras menaungi materi bab ini. Wajib awali dengan nama Elemen resminya secara jelas dalam tanda kurung siku [Nama Elemen], contoh:
   "[Al-Qur’an Hadis] Murid mampu membaca, menghafal, menulis, dan memahami surah-surah pendek atau ayat Al-Qur'an serta hadis..."
   "[Geometri] Mengkonstruksi dan mengurai bangun ruang dan mengenali visualisasi spasial..."
   "[Akidah] Mengenal rukun iman dan mengimani sifat-sifat Allah SWT..."
   DILARANG MENGARANG teks CP baru di luar substansi resmi pemerintah.`;

  const tpRule = isIpas
    ? `5. [KOLOM TP (TUJUAN PEMBELAJARAN)]:
   Rumuskan Tujuan Pembelajaran yang operasional, jelas, terukur, dan berbasis kompetensi (Taksonomi Bloom/Anderson).
   Khusus IPAS: Rumuskan TP yang memadukan penguasaan konsep esensial (Pemahaman IPAS) sekaligus melatih keterampilan kerja ilmiah (Keterampilan Proses, seperti mengamati objek/peta secara cermat, menyelidiki fenomena/bereksperimen, menganalisis data, atau merancang simulasi/kampanye pelestarian).`
    : `5. [KOLOM TP (TUJUAN PEMBELAJARAN)]:
   Rumuskan Tujuan Pembelajaran yang operasional, jelas, terukur, dan berbasis kompetensi (Taksonomi Bloom/Anderson: Mendesain, Menjelaskan, Mengidentifikasi, Menganalisis, Menyajikan, dll).
   Contoh: "Mendesain percobaan sederhana untuk membuktikan sifat cahaya dan menjelaskan hasilnya."`;

  return `Anda adalah Pakar Analisis Kurikulum Merdeka Terverifikasi BSKAP Kemendikbudristek RI.
Tugas Anda adalah menyusun dokumen resmi:
\"ANALISIS CP, TP, DAN ATP\"
Standar Dokumen Mutu Pendidikan Sekolah Dasar Berbasis Buku Ajar.

STANDAR ALOKASI WAKTU RESMI (PERMENDIKDASMEN NO. 13 TAHUN 2025):
- Dasar Regulasi: Permendikdasmen RI No. 13 Tahun 2025 (Perubahan atas Permendikbudristek No. 12/2024)
- Mata Pelajaran: ${quota.namaResmi} (${jenjangKelas} / Fase ${quota.fase})
- Beban Intrakurikuler per Minggu: ${quota.jpPerMinggu} JP/minggu (1 JP = 35 menit)
- Target Intrakurikuler per Semester: ${quota.intrakurikulerPerSemester} JP (${quota.mingguPerSemester} pekan efektif)
- Target Intrakurikuler per Tahun: ${quota.intrakurikulerPerTahun} JP (${quota.mingguPerTahun} pekan efektif)
- Beban Kokurikuler (Lintas Disiplin / 7 Kebiasaan Anak Indonesia Hebat): ${quota.kokurikulerPerTahun} JP/tahun

IDENTITAS DOKUMEN:
- Satuan Pendidikan: ${namaSekolah || 'SDN'}
- Mata Pelajaran: ${mataPelajaran}
- Fase / Kelas: ${fase}/${kelasNum} (${jenjangKelas})
- Tahun Pembelajaran: ${tahunAjaran || '2025/2026'}
- Target Analisis: ${targetSemester === '1' ? 'Semester 1 Saja' : targetSemester === '2' ? 'Semester 2 Saja' : 'Setahun Penuh (Semester 1 dan 2)'}

CAPAIAN PEMBELAJARAN (CP) RESMI PEMERINTAH (${(mataPelajaran?.toLowerCase().includes('agama') || mataPelajaran?.toLowerCase().includes('paibp')) ? 'Kepka BKPDM No. 020 Tahun 2026' : (mataPelajaran?.toLowerCase().includes('sunda') || mataPelajaran?.toLowerCase().includes('tatanen') || mataPelajaran?.toLowerCase().includes('akpk')) ? 'Muatan Lokal Kurikulum Merdeka' : 'BSKAP No. 046 Tahun 2025'}):
${baseCP || 'Gunakan Capaian Pembelajaran standar resmi untuk mata pelajaran dan fase ini.'}

DETAIL ELEMEN CP RESMI:
${elementsCP ? JSON.stringify(elementsCP, null, 2) : 'Gunakan elemen kurikulum resmi yang sesuai.'}

DAFTAR BAB & MATERI POKOK BUKU TEKS YANG DIAJARKAN:
${JSON.stringify(filteredChapters, null, 2)}

PETUNJUK ANALISIS KEDINASAN (SANGAT KETAT):
1. [KOLOM BAB]: Tuliskan nama bab secara lengkap sesuai data buku di atas.
${elemenRule}
3. [KOLOM MATERI POKOK]: Rincikan 2 sampai 4 submateri/topik pokok penting dalam bab tersebut dengan nomor urut (contoh: \"1. Sifat Cahaya\", \"2. Indra Penglihatan (Mata)\", \"3. Sifat Bunyi\", \"4. Indra Pendengaran (Telinga)\").
4. [KOLOM KODE TP]: Wajib menggunakan format kelas.nomor_urut.
   Untuk ${jenjangKelas} (Kelas ${kelasNum}):
   Gunakan: ${kelasNum}.1, ${kelasNum}.2, ${kelasNum}.3, ${kelasNum}.4, ${kelasNum}.5, dst secara berurutan dan TIDAK BOLEH reset/mengulang dari 1 di tiap bab baru. Urutan nomor terus berlanjut hingga akhir semester/tahun!
${tpRule}
6. [KOLOM ATP (ALUR TUJUAN PEMBELAJARAN)]:
   Rumuskan langkah kegiatan/alur konkret yang dijalani murid di kelas untuk mencapai TP tersebut.
   Gunakan kegiatan nyata murid (contoh: murid mengamati fenomena, melakukan percobaan dengan alat sederhana, mengolah data tabel/grafik, berdiskusi kelompok, dan mempresentasikan hasil penyelidikan).
7. [KOLOM ALOKASI WAKTU - PERMENDIKDASMEN 13/2025]:
   Cantumkan alokasi waktu Jam Pelajaran (JP) yang realistis per item/materi (contoh: \"2 JP\", \"3 JP\", \"4 JP\", atau \"5 JP\"). Total penjumlahan seluruh alokasi_waktu materi pada semester harus proporsional mendekati atau pas dengan kuota resmi intrakurikuler (${quota.intrakurikulerPerSemester} JP per semester).
8. [PENGELOMPOKKAN SEMESTER]:
   Kelompokkan bab-bab ke dalam \"SEMESTER 1\" dan \"SEMESTER 2\" sesuai nilai 'semester' pada masing-masing bab.
9. [STANDARDISASI KATA MURID]:
   DILARANG KERAS menggunakan istilah 'Peserta Didik' atau 'peserta didik'. Selalu gunakan kata 'Murid' atau 'murid' dalam seluruh perumusan CP, TP, dan ATP!

FORMAT OUTPUT:
Keluarkan HANYA JSON valid dengan struktur berikut:
{
  "metadata": {
    "satuan_pendidikan": "${namaSekolah || 'SDN'}",
    "mata_pelajaran": "${mataPelajaran}",
    "fase": "${fase}",
    "kelas": "${kelasNum}",
    "fase_kelas": "${fase}/${kelasNum}",
    "tahun_pembelajaran": "${tahunAjaran || '2025/2026'}"
  },
  "semesters": [
    {
      "semester": 1,
      "semester_label": "SEMESTER 1",
      "babs": [
        {
          "no": 1,
          "bab": "Judul Bab",
          "cp": "Elemen: Kalimat CP resmi pemerintah",
          "materi_list": ["1. Topik A", "2. Topik B"],
          "items": [
            {
              "kode_tp": "${kelasNum}.1",
              "materi_pokok": "1. Topik A",
              "tp": "Rumusan TP operasional",
              "atp": "Alur aktivitas pencapaian siswa di kelas",
              "alokasi_waktu": "2 JP"
            }
          ]
        }
      ]
    }
  ]
}`;
}

// 1. Ekstraksi Struktur Bab dari Teks Buku
analisisCp.post('/extract-structure', async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
    const { text, mataPelajaran, jenjangKelas, aiProvider, targetSemester, bookCoverage } = body;
    const effectiveTarget = bookCoverage || targetSemester || 'all';

    if (!text || !String(text).trim()) {
      return Errors.badRequest(c, 'Teks daftar isi atau materi buku tidak boleh kosong');
    }

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    const prompt = buildStructurePrompt(text, mataPelajaran, jenjangKelas, effectiveTarget);
    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash'
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;
    const result = await ai.generateJSON(prompt, preferredSlug);

    const standardData = getStandardCurriculumChapters(mataPelajaran, jenjangKelas);

    if (result && Array.isArray(result.chapters)) {
      // Jika AI hanya mengembalikan 1 atau 2 bab saat target setahun penuh, verifikasi kecocokan dengan kurikulum resmi kelas yang sedang aktif
      if (effectiveTarget === 'all' && result.chapters.length <= 2 && standardData && Array.isArray(standardData.chapters)) {
        const firstExtracted = (result.chapters[0]?.bab || '').toLowerCase();
        const stdFirst = (standardData.chapters[0]?.bab || '').toLowerCase();
        const cleanStdFirst = stdFirst.replace(/^bab\s*\d+\s*[:.-]?\s*/i, '').trim();
        
        // Hanya sinkronkan dengan standar resmi jika judul bab pertama yang diekstrak terbukti cocok dengan kurikulum resmi kelas ini
        const isMatchFirst = cleanStdFirst.length >= 4 && firstExtracted.includes(cleanStdFirst.slice(0, 10));
        
        if (isMatchFirst) {
          result.chapters = standardData.chapters;
          result.is_enriched = true;
          if (!result.buku_judul) result.buku_judul = standardData.judul;
        }
      }

      result.chapters = distributeChaptersToSemesters(result.chapters, effectiveTarget);
    }

    if (result && Array.isArray(result.chapters) && result.chapters.length > 0) {
      let tahunTerbit = 2025;
      const yearMatch = (result.buku_judul || '').match(/\b(202[0-9])\b/) || (text || '').slice(0, 1500).match(/\b(202[0-9])\b/);
      if (yearMatch) {
        tahunTerbit = parseInt(yearMatch[1], 10);
      }
      result.tahun_terbit = tahunTerbit;

      if (c.env?.DB && result.buku_judul) {
        try {
          await ensureAnalisisCpTables(c.env.DB);
          const fase = getFaseFromKelas(jenjangKelas) || 'Fase C';
          const existing: any = await c.env.DB.prepare(
            `SELECT id FROM curriculum_standard_chapters 
             WHERE LOWER(TRIM(mata_pelajaran)) = LOWER(TRIM(?)) 
               AND LOWER(TRIM(jenjang_kelas)) = LOWER(TRIM(?)) 
               AND LOWER(TRIM(buku_judul)) = LOWER(TRIM(?))`
          ).bind(mataPelajaran, jenjangKelas, result.buku_judul).first();

          if (existing?.id) {
            await c.env.DB.prepare(
              `UPDATE curriculum_standard_chapters 
               SET chapters_json = ?, total_babs = ?, tahun_terbit = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE id = ?`
            ).bind(JSON.stringify(result.chapters), result.chapters.length, tahunTerbit, existing.id).run();
            result.profile_id = String(existing.id);
          } else {
            const insRes = await c.env.DB.prepare(
              `INSERT INTO curriculum_standard_chapters (mata_pelajaran, jenjang_kelas, fase, buku_judul, chapters_json, total_babs, tahun_terbit, penerbit) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(mataPelajaran, jenjangKelas, fase, result.buku_judul, JSON.stringify(result.chapters), result.chapters.length, tahunTerbit, 'Ekstraksi PDF / E-Book').run();
            result.profile_id = String(insRes?.meta?.last_row_id);
          }
        } catch (dbErr) {
          console.error('Auto-save extracted book profile error:', dbErr);
        }
      }
    }

    // Selalu sertakan saran bab standar kurikulum jika tersedia
    if (standardData) {
      result.standard_preset = standardData;
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Extract Structure Error:', e);
    // Jika AI gagal total atau timeout, kembalikan bab standar resmi kurikulum kelas yang bersangkutan
    const standardData = getStandardCurriculumChapters(body?.mataPelajaran || c.req.query('mataPelajaran') || '', body?.jenjangKelas || c.req.query('jenjangKelas') || '');
    if (standardData) {
      return successResponse(c, {
        buku_judul: standardData.judul,
        total_babs: standardData.chapters.length,
        chapters: distributeChaptersToSemesters(standardData.chapters),
        is_fallback: true
      });
    }
    return Errors.internal(c, e.message);
  }
});

// Endpoint mandiri untuk mengambil struktur BAB standar resmi Kemendikbudristek
analisisCp.get('/standard-chapters', async (c) => {
  const mapel = c.req.query('mataPelajaran') || 'IPAS';
  const kelas = c.req.query('jenjangKelas') || 'Kelas 5';
  
  let standardData: { judul: string; chapters: any[] } | null = null;
  if (c.env?.DB) {
    standardData = await getStandardCurriculumChaptersFromDb(c.env.DB, mapel, kelas);
  }
  if (!standardData) {
    standardData = getStandardCurriculumChapters(mapel, kelas);
  }

  if (!standardData) {
    return Errors.notFound(c, `Struktur bab standar untuk ${mapel} ${kelas} belum tersedia.`);
  }

  return successResponse(c, {
    buku_judul: standardData.judul,
    total_babs: standardData.chapters.length,
    chapters: distributeChaptersToSemesters(standardData.chapters)
  });
});

// Endpoint untuk mengambil data awal Capaian Pembelajaran (CP) resmi sesuai mapel dan kelas
analisisCp.get('/official-cp', async (c) => {
  const mapel = c.req.query('mataPelajaran') || c.req.query('mapel') || 'Matematika';
  const kelas = c.req.query('jenjangKelas') || c.req.query('kelas') || '5';

  const cpDoc = getOfficialCpDocumentData(mapel, kelas);
  return successResponse(c, cpDoc);
});

// Endpoint untuk mengambil seluruh profil buku yang tersedia (Preset Resmi + DB Kustom)
analisisCp.get('/book-profiles', async (c) => {
  const mapel = c.req.query('mataPelajaran') || 'IPAS';
  const kelas = c.req.query('jenjangKelas') || 'Kelas 5';
  const targetSemester = c.req.query('targetSemester') || 'all';

  if (c.env?.DB) {
    try {
      await ensureAnalisisCpTables(c.env.DB);
    } catch (_) {}
  }

  const profiles = await getAllBookProfiles(c.env?.DB, mapel, kelas);

  const formattedProfiles = profiles.map(p => {
    const chapters = distributeChaptersToSemesters(p.chapters, targetSemester);
    return {
      ...p,
      chapters,
      total_babs: chapters.length
    };
  });

  const defaultProfile = formattedProfiles.find(p => p.is_default) || formattedProfiles[0] || null;

  return successResponse(c, {
    profiles: formattedProfiles,
    default_profile: defaultProfile,
    total: formattedProfiles.length
  });
});

// Endpoint untuk menyimpan profil struktur buku baru atau kustom
analisisCp.post('/save-book-profile', async (c) => {
  const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie');
  const authHeader = c.req.header('Authorization') || c.req.header('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
  const user = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return Errors.unauthorized(c, 'Silakan login terlebih dahulu');

  if (!c.env?.DB) {
    return Errors.internal(c, 'Database tidak tersedia');
  }

  await ensureAnalisisCpTables(c.env.DB);

  const body = await c.req.json();
  const { mataPelajaran, jenjangKelas, bukuJudul, tahunTerbit, penerbit, chapters } = body;

  if (!mataPelajaran || !jenjangKelas || !bukuJudul || !Array.isArray(chapters) || chapters.length === 0) {
    return Errors.badRequest(c, 'Data buku tidak lengkap. Pastikan Mata Pelajaran, Kelas, Judul Buku, dan Daftar Bab terisi.');
  }

  let year = Number(tahunTerbit);
  if (!year || isNaN(year)) {
    const ym = String(bukuJudul).match(/\b(202[0-9])\b/);
    year = ym ? parseInt(ym[1], 10) : new Date().getFullYear();
  }

  const fase = getFaseFromKelas(jenjangKelas) || 'Fase C';
  const cleanPenerbit = (penerbit || 'Kemendikbudristek / Guru Pengunggah').trim();

  // Cek apakah sudah ada buku dengan judul yang sama persis untuk mapel dan kelas ini
  const existing: any = await c.env.DB.prepare(
    `SELECT id FROM curriculum_standard_chapters 
     WHERE LOWER(TRIM(mata_pelajaran)) = LOWER(TRIM(?)) 
       AND LOWER(TRIM(jenjang_kelas)) = LOWER(TRIM(?)) 
       AND LOWER(TRIM(buku_judul)) = LOWER(TRIM(?))`
  ).bind(mataPelajaran, jenjangKelas, bukuJudul).first();

  let savedId: number;
  if (existing?.id) {
    await c.env.DB.prepare(
      `UPDATE curriculum_standard_chapters 
       SET chapters_json = ?, total_babs = ?, tahun_terbit = ?, penerbit = ?, fase = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(JSON.stringify(chapters), chapters.length, year, cleanPenerbit, fase, existing.id).run();
    savedId = existing.id;
  } else {
    const insertRes = await c.env.DB.prepare(
      `INSERT INTO curriculum_standard_chapters (mata_pelajaran, jenjang_kelas, fase, buku_judul, chapters_json, total_babs, tahun_terbit, penerbit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(mataPelajaran, jenjangKelas, fase, bukuJudul, JSON.stringify(chapters), chapters.length, year, cleanPenerbit).run();
    savedId = Number(insertRes?.meta?.last_row_id);
  }

  return successResponse(c, {
    id: String(savedId),
    buku_judul: bukuJudul,
    tahun_terbit: year,
    penerbit: cleanPenerbit,
    total_babs: chapters.length,
    chapters,
    is_custom: true,
    message: 'Profil struktur buku berhasil disimpan dan siap digunakan guru lain.'
  });
});

// Endpoint untuk menghapus profil buku kustom
analisisCp.delete('/book-profiles/:id', async (c) => {
  const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie');
  const authHeader = c.req.header('Authorization') || c.req.header('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
  const user = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return Errors.unauthorized(c, 'Silakan login terlebih dahulu');

  const id = c.req.param('id');
  if (!id || id.startsWith('preset_')) {
    return Errors.badRequest(c, 'Profil standar kurikulum resmi tidak dapat dihapus');
  }

  if (!c.env?.DB) return Errors.internal(c, 'Database tidak tersedia');
  await ensureAnalisisCpTables(c.env.DB);

  await c.env.DB.prepare('DELETE FROM curriculum_standard_chapters WHERE id = ?').bind(Number(id)).run();

  return successResponse(c, { success: true, message: 'Profil buku berhasil dihapus' });
});

// Helper resolve CP
async function resolveOfficialCP(mataPelajaran: string, jenjangKelas: string, db?: any) {
  const official = db ? await getDynamicCP(db, mataPelajaran, jenjangKelas) : getOfficialCP(mataPelajaran, jenjangKelas);
  const elements = db ? await getDynamicCPElements(db, mataPelajaran, jenjangKelas) : null;
  const fase = getFaseFromKelas(jenjangKelas) || 'Fase C';
  const faseCode = fase.replace('Fase ', '').trim();

  let finalElements = elements;
  if (!finalElements) {
    const normalizedSubject = (mataPelajaran || '').toLowerCase().trim();
    const subjectKeys = Object.keys(cpElementsData);
    const matchedKey = subjectKeys.find(key => {
      const lk = key.toLowerCase();
      return normalizedSubject === lk ||
             normalizedSubject.includes(lk) || lk.includes(normalizedSubject) ||
             ((lk.includes('agama') || lk.includes('paibp')) && (normalizedSubject.includes('agama') || normalizedSubject.includes('paibp') || normalizedSubject.includes('pai') || normalizedSubject.includes('islam'))) ||
             (lk.includes('pancasila') && normalizedSubject.includes('pancasila')) ||
             (lk.includes('ipas') && (normalizedSubject.includes('ipas') || normalizedSubject.includes('ilmu pengetahuan alam'))) ||
             (lk.includes('matematika') && normalizedSubject.includes('matematika')) ||
             (lk.includes('inggris') && normalizedSubject.includes('inggris')) ||
             (lk.includes('jasmani') && (normalizedSubject.includes('pjok') || normalizedSubject.includes('jasmani') || normalizedSubject.includes('olahraga'))) ||
             (lk.includes('seni') && (normalizedSubject.includes('seni') || normalizedSubject.includes('rupa'))) ||
             (lk.includes('koding') && normalizedSubject.includes('koding')) ||
             (lk.includes('sunda') && normalizedSubject.includes('sunda')) ||
             ((lk.includes('tatanen') || lk.includes('tdba')) && (normalizedSubject.includes('tatanen') || normalizedSubject.includes('tdba'))) ||
             (lk.includes('akpk') && normalizedSubject.includes('akpk'));
    });
    finalElements = matchedKey && cpElementsData[matchedKey]?.[fase] ? cpElementsData[matchedKey][fase] : null;
  }

  return { officialCP: official, elementsCP: finalElements, faseCode, fase };
}

// Helper: Perbaikan dan Pengayaan Elemen IPAS (Pemahaman IPAS + Keterampilan Proses)
export function repairAndEnrichIpasBabCp(bab: any, fase: string = 'C'): string {
  let cpText = (bab?.cp || '').trim();
  const babTitle = (bab?.bab || '').toLowerCase();
  const allMateri = (Array.isArray(bab?.materi_list) ? bab.materi_list.join(' ') : '') + ' ' + (Array.isArray(bab?.items) ? bab.items.map((i: any) => (i.materi_pokok || '') + ' ' + (i.tp || '') + ' ' + (i.atp || '')).join(' ') : '');
  const combinedContext = (babTitle + ' ' + allMateri).toLowerCase();

  // 1. Tentukan kalimat Pemahaman IPAS yang akurat berdasarkan materi bab (urutan spesifik per-bab presisi)
  let pemahamanContent = '';

  if ((combinedContext.includes('geografis') && !combinedContext.includes('sejarah') && !combinedContext.includes('pahlawan')) || combinedContext.includes('daratan') || combinedContext.includes('lautan') || combinedContext.includes('maritim') || combinedContext.includes('agraris') || combinedContext.includes('khatulistiwa') || (combinedContext.includes('peta') && !combinedContext.includes('sejarah') && !combinedContext.includes('pahlawan')) || combinedContext.includes('letak indonesia')) {
    pemahamanContent = 'Menjelaskan letak dan kondisi geografis negara Indonesia dengan menggunakan peta konvensional/digital.';
  } else if (combinedContext.includes('ekonomi') || combinedContext.includes('kebutuhan') || combinedContext.includes('pasar') || combinedContext.includes('jual beli') || (/\buang\b/.test(combinedContext) && !combinedContext.includes('perjuangan') && !combinedContext.includes('berjuang') && !combinedContext.includes('peluang') && !combinedContext.includes('terbuang')) || combinedContext.includes('keuangan') || combinedContext.includes('konsumsi') || combinedContext.includes('produksi') || combinedContext.includes('distribusi') || combinedContext.includes('pelaku ekonomi') || combinedContext.includes('majulah daerahku')) {
    pemahamanContent = 'Menerapkan kegiatan ekonomi masyarakat di lingkungan sekitar dan menjelaskan pengelolaan keuangan/kebutuhan hidup secara bijak.';
  } else if (combinedContext.includes('ekosistem') || combinedContext.includes('rantai makanan') || combinedContext.includes('jaring') || combinedContext.includes('biotik') || combinedContext.includes('abiotik') || combinedContext.includes('harmoni dalam ekosistem') || combinedContext.includes('harmoni') || combinedContext.includes('habitat') || combinedContext.includes('populasi')) {
    pemahamanContent = 'Menganalisis hubungan antar komponen biotik dan abiotik, serta pengaruhnya terhadap ekosistem.';
  } else if (combinedContext.includes('siklus air') || combinedContext.includes('air sumber') || combinedContext.includes('air bersih') || combinedContext.includes('daur air') || combinedContext.includes('hidrologi') || combinedContext.includes('penghematan energi') || combinedContext.includes('energi alternatif') || (/\bair\b/.test(combinedContext) && !combinedContext.includes('tanah air') && !combinedContext.includes('mata pencaharian') && !combinedContext.includes('cair'))) {
    pemahamanContent = 'Menghasilkan upaya penghematan energi, serta pemanfaatan sumber energi alternatif dari sumber daya yang ada di sekitarnya sebagai upaya mitigasi perubahan iklim, serta memahami siklus air dan kaitannya dengan upaya menjaga ketersediaan air.';
  } else if (combinedContext.includes('sejarah') || combinedContext.includes('pahlawan') || combinedContext.includes('perjuangan') || combinedContext.includes('penjajahan') || combinedContext.includes('kemerdekaan') || combinedContext.includes('masa lalu') || combinedContext.includes('warisan budaya') || combinedContext.includes('kearifan') || combinedContext.includes('kebhinekaan')) {
    pemahamanContent = 'Meninjau sejarah perjuangan para pahlawan di lingkungan sekitar tempat tinggalnya dan menemukan keragaman budaya nasional dalam konteks kebinekaan.';
  } else if (combinedContext.includes('puber') || combinedContext.includes('perubahan pada diriku') || combinedContext.includes('privasi') || (/\borgan\b/.test(combinedContext) && !combinedContext.includes('organisasi')) || combinedContext.includes('pernapasan') || combinedContext.includes('pencernaan') || combinedContext.includes('darah') || combinedContext.includes('tubuh manusia') || combinedContext.includes('tulang') || combinedContext.includes('otot') || combinedContext.includes('kesehatan diri') || combinedContext.includes('sehat tubuh')) {
    pemahamanContent = 'Merefleksikan sistem organ tubuh manusia yang dikaitkan dengan cara menjaga kesehatan tubuhnya (masa puber).';
  } else if (combinedContext.includes('cahaya') || combinedContext.includes('penglihatan') || combinedContext.includes('bayangan') || combinedContext.includes('cermin') || combinedContext.includes('lensa') || combinedContext.includes('warna') || combinedContext.includes('dispersi') || combinedContext.includes('indra penglihatan') || (/\bmata\b/.test(combinedContext) && !combinedContext.includes('pencaharian') && !combinedContext.includes('uang') && !combinedContext.includes('matahari') && !combinedContext.includes('angin'))) {
    pemahamanContent = 'Menjelaskan fenomena gelombang cahaya dalam kehidupan sehari-hari melalui penyelidikan sederhana.';
  } else if (combinedContext.includes('bunyi') || combinedContext.includes('pendengaran') || combinedContext.includes('telinga') || combinedContext.includes('getaran') || combinedContext.includes('akustik') || combinedContext.includes('suara') || combinedContext.includes('merambat bunyi')) {
    pemahamanContent = 'Menjelaskan fenomena gelombang bunyi dalam kehidupan sehari-hari melalui penyelidikan sederhana.';
  } else if (combinedContext.includes('tata surya') || combinedContext.includes('planet') || combinedContext.includes('rotasi') || combinedContext.includes('revolusi') || combinedContext.includes('bumi') || combinedContext.includes('bulan') || combinedContext.includes('matahari')) {
    pemahamanContent = 'Menjelaskan sistem tata surya, serta kaitannya dengan rotasi dan revolusi bumi.';
  } else if (combinedContext.includes('budaya') || combinedContext.includes('kearifan') || combinedContext.includes('adat') || combinedContext.includes('tradisi')) {
    pemahamanContent = 'Menemukan keragaman budaya nasional dalam konteks kebhinekaan berdasarkan pemahaman terhadap nilai-nilai kearifan lokal yang berlaku di wilayah tempat tinggal.';
  } else if (combinedContext.includes('pancaindra') || combinedContext.includes('indra')) {
    pemahamanContent = 'Menjelaskan bentuk dan fungsi pancaindra dalam kehidupan sehari-hari.';
  } else if (combinedContext.includes('gaya') || combinedContext.includes('gerak') || combinedContext.includes('magnet')) {
    pemahamanContent = 'Membedakan jenis gaya dan pengaruhnya terhadap arah, gerak, dan bentuk benda.';
  } else if (combinedContext.includes('wujud zat') || combinedContext.includes('perubahan wujud') || combinedContext.includes('padat') || combinedContext.includes('cair') || combinedContext.includes('gas')) {
    pemahamanContent = 'Menyimpulkan proses perubahan wujud zat dalam kehidupan sehari-hari.';
  }

  // 2. Tentukan Keterampilan Proses yang relevan dengan aktivitas bab
  let prosesContent = '';
  if ((combinedContext.includes('peta') && !combinedContext.includes('sejarah') && !combinedContext.includes('pahlawan')) || (combinedContext.includes('geografis') && !combinedContext.includes('sejarah') && !combinedContext.includes('pahlawan')) || combinedContext.includes('daratan') || combinedContext.includes('lautan') || (combinedContext.includes('indonesia') && (combinedContext.includes('maritim') || combinedContext.includes('agraris') || combinedContext.includes('letak') || combinedContext.includes('kondisi')))) {
    prosesContent = 'Mengamati fenomena geografis pada peta konvensional/digital, mengidentifikasi pola wilayah daratan/lautan, memproses data tabel informasi, dan mengomunikasikan hasil analisis.';
  } else if (combinedContext.includes('sejarah') || combinedContext.includes('pahlawan') || combinedContext.includes('warisan') || combinedContext.includes('budaya') || combinedContext.includes('perjuangan')) {
    prosesContent = 'Mengamati peninggalan sejarah dan kearifan lokal, menggali informasi dari narasumber/literatur, menyusun garis waktu peristiwa (timeline), serta mengomunikasikan nilai-nilai perjuangan.';
  } else if (combinedContext.includes('ekonomi') || combinedContext.includes('kebutuhan') || combinedContext.includes('pasar') || combinedContext.includes('jual beli') || (/\buang\b/.test(combinedContext) && !combinedContext.includes('perjuangan') && !combinedContext.includes('berjuang') && !combinedContext.includes('peluang') && !combinedContext.includes('terbuang')) || combinedContext.includes('keuangan')) {
    prosesContent = 'Melakukan observasi dan wawancara sederhana aktivitas ekonomi di lingkungan sekitar, mengolah data kebutuhan dan keinginan, serta merefleksikan pengelolaan keuangan secara bijak.';
  } else if (combinedContext.includes('ekosistem') || combinedContext.includes('rantai makanan') || combinedContext.includes('harmoni')) {
    prosesContent = 'Mengamati interaksi antar komponen ekosistem di lingkungan sekitar, mempertanyakan dan memprediksi dampak perubahan rantai makanan, serta menyajikan hasil penyelidikan.';
  } else if (combinedContext.includes('siklus air') || combinedContext.includes('daur air') || (/\bair\b/.test(combinedContext) && !combinedContext.includes('tanah air')) || combinedContext.includes('energi')) {
    prosesContent = 'Merencanakan dan melakukan penyelidikan siklus air/energi menggunakan model percobaan sederhana, mencatat data observasi, dan mengomunikasikan kampanye pelestarian.';
  } else if (combinedContext.includes('cahaya') || combinedContext.includes('bayangan') || combinedContext.includes('lensa') || combinedContext.includes('cermin')) {
    prosesContent = 'Merencanakan dan melakukan penyelidikan sifat-sifat cahaya dan pembentukan bayangan menggunakan alat bantu sederhana, membandingkan data pengamatan dengan prediksi, serta mengevaluasi hasil percobaan.';
  } else if (combinedContext.includes('bunyi') || combinedContext.includes('suara') || combinedContext.includes('getaran') || combinedContext.includes('akustik')) {
    prosesContent = 'Merencanakan dan melakukan penyelidikan ilmiah perambatan dan peredaman bunyi menggunakan alat sederhana, membandingkan data pengamatan dengan prediksi, serta mengomunikasikan hasil penyelidikan.';
  } else if (combinedContext.includes('organ') || combinedContext.includes('tubuh') || combinedContext.includes('puber') || combinedContext.includes('diriku') || combinedContext.includes('pancaindra')) {
    prosesContent = 'Mengamati model/diagram struktur organ tubuh dan perubahan fisik secara cermat, mencatat karakteristik fungsi organ, serta mengomunikasikan panduan pola hidup sehat dan privasi diri.';
  } else {
    prosesContent = 'Menerapkan keterampilan proses sains: mengamati fenomena, membuat prediksi, merencanakan penyelidikan sederhana, mengolah data, dan mengomunikasikan hasil secara lisan maupun tertulis.';
  }

  // Cek apakah cpText yang ada sudah punya [Pemahaman IPAS] dan [Keterampilan Proses]
  const hasPemahaman = /\[(Elemen\s*:\s*)?Pemahaman\s*IPAS\]/i.test(cpText) || /^Pemahaman\s*IPAS\s*:/i.test(cpText);
  const hasProses = /\[(Elemen\s*:\s*)?Keterampilan\s*Proses\]/i.test(cpText) || /Keterampilan\s*Proses\s*:/i.test(cpText);

  let existingPemahaman = '';
  if (hasPemahaman) {
    const match = cpText.match(/\[(?:Elemen\s*:\s*)?Pemahaman\s*IPAS\]\s*([\s\S]*?)(?=\[(?:Elemen\s*:\s*)?Keterampilan\s*Proses\]|$)/i);
    if (match && match[1].trim()) {
      existingPemahaman = match[1].trim();
    } else {
      const colonMatch = cpText.match(/^Pemahaman\s*IPAS\s*:\s*([\s\S]*?)(?=Keterampilan\s*Proses|$)/i);
      if (colonMatch && colonMatch[1].trim()) {
        existingPemahaman = colonMatch[1].trim();
      }
    }
  }

  // Deteksi ketidaksesuaian topik (topic mismatch) pada existingPemahaman
  const isMismatched = (() => {
    if (!existingPemahaman || !pemahamanContent) return false;
    const lower = existingPemahaman.toLowerCase();

    // 1. Bab Ekonomi tapi CP berisi geografi/daratan, bunyi, cahaya, atau energi
    if ((combinedContext.includes('ekonomi') || combinedContext.includes('kebutuhan') || combinedContext.includes('pasar') || (/\buang\b/.test(combinedContext) && !combinedContext.includes('perjuangan') && !combinedContext.includes('berjuang'))) &&
        (lower.includes('geografis') || lower.includes('daratan') || lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('penghematan energi') || lower.includes('sejarah'))) {
      return true;
    }
    // 2. Bab Ekosistem tapi CP berisi geografi, ekonomi, bunyi, cahaya, atau energi
    if ((combinedContext.includes('ekosistem') || combinedContext.includes('rantai makanan') || combinedContext.includes('harmoni')) &&
        (lower.includes('geografis') || lower.includes('ekonomi') || lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('penghematan energi') || lower.includes('sejarah'))) {
      return true;
    }
    // 3. Bab Air/Siklus Air tapi CP berisi geografi, ekonomi, bunyi, atau cahaya
    if ((combinedContext.includes('air') || combinedContext.includes('siklus')) &&
        (lower.includes('geografis') || lower.includes('ekonomi') || lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('organ tubuh') || lower.includes('sejarah'))) {
      return true;
    }
    // 4. Bab Sejarah tapi CP berisi bunyi, cahaya, geografi, ekonomi, atau organ
    if ((combinedContext.includes('sejarah') || combinedContext.includes('pahlawan') || combinedContext.includes('warisan') || combinedContext.includes('perjuangan')) &&
        (lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('geografis') || lower.includes('ekonomi') || lower.includes('organ tubuh') || lower.includes('siklus air'))) {
      return true;
    }
    // 5. Bab Puber/Organ/Diriku tapi CP berisi bunyi, cahaya, geografi, ekonomi, atau sejarah
    if ((combinedContext.includes('puber') || combinedContext.includes('organ') || combinedContext.includes('diriku')) &&
        (lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('geografis') || lower.includes('ekonomi') || lower.includes('sejarah'))) {
      return true;
    }
    // 6. Bab Cahaya tapi CP berisi bunyi (tanpa cahaya), geografi, sejarah, atau ekonomi
    if (combinedContext.includes('cahaya') &&
        ((lower.includes('bunyi') && !lower.includes('cahaya')) || lower.includes('geografis') || lower.includes('sejarah') || lower.includes('ekonomi'))) {
      return true;
    }
    // 7. Bab Bunyi tapi CP berisi cahaya (tanpa bunyi), geografi, sejarah, atau ekonomi
    if (combinedContext.includes('bunyi') &&
        ((lower.includes('cahaya') && !lower.includes('bunyi')) || lower.includes('geografis') || lower.includes('sejarah') || lower.includes('ekonomi'))) {
      return true;
    }
    // 8. Bab Geografi tapi CP berisi bunyi, ekonomi, organ, energi, atau sejarah
    if ((combinedContext.includes('peta') || combinedContext.includes('geografis') || combinedContext.includes('indonesia berada')) &&
        (lower.includes('bunyi') || lower.includes('ekonomi') || lower.includes('organ') || lower.includes('penghematan energi') || lower.includes('sejarah'))) {
      return true;
    }
    // 9. Existing hanya kalimat Keterampilan Proses tanpa pemahaman substantif
    if (lower.startsWith('mengamati fenomena') && !lower.includes('menjelaskan') && !lower.includes('menganalisis') && !lower.includes('menerapkan') && !lower.includes('meninjau') && !lower.includes('merefleksikan')) {
      return true;
    }
    return false;
  })();

  let finalPemahaman = '';
  if (!hasPemahaman || isMismatched || !existingPemahaman) {
    finalPemahaman = pemahamanContent || 'Memahami konsep esensial sains dan lingkungan dalam kehidupan sehari-hari.';
  } else {
    finalPemahaman = existingPemahaman;
  }

  let finalProses = '';
  if (hasProses) {
    const matchProses = cpText.match(/\[(?:Elemen\s*:\s*)?Keterampilan\s*Proses\]\s*([\s\S]*?)$/i);
    const existingProses = (matchProses && matchProses[1].trim()) ? matchProses[1].trim() : '';
    const prosesLower = existingProses.toLowerCase();

    // Periksa jika ada cross-topic pollution di Keterampilan Proses
    const isProsesMismatched = 
      ((combinedContext.includes('ekonomi') || combinedContext.includes('ekosistem') || combinedContext.includes('sejarah') || combinedContext.includes('bunyi') || combinedContext.includes('puber')) && prosesLower.includes('geografis pada peta')) ||
      ((combinedContext.includes('sejarah') || combinedContext.includes('puber') || combinedContext.includes('cahaya') || combinedContext.includes('ekonomi')) && prosesLower.includes('fenomena bunyi'));

    if (!existingProses || isProsesMismatched) {
      finalProses = prosesContent;
    } else {
      finalProses = existingProses;
    }
  } else {
    finalProses = prosesContent;
  }

  return `[Pemahaman IPAS]\n${finalPemahaman}\n\n[Keterampilan Proses]\n${finalProses}`;
}

// Helper: Perbaikan dan Pemetaan Elemen Resmi Matematika (BSKAP 046/2025)
export function repairAndEnrichMatematikaBabCp(bab: any, fase: string = 'C'): string {
  let cpText = (bab?.cp || '').trim();
  const babTitle = (bab?.bab || '').toLowerCase();
  const allMateri = (Array.isArray(bab?.materi_list) ? bab.materi_list.join(' ') : '') + ' ' + (Array.isArray(bab?.items) ? bab.items.map((i: any) => (i.materi_pokok || '') + ' ' + (i.tp || '') + ' ' + (i.atp || '')).join(' ') : '');
  const combinedContext = (babTitle + ' ' + allMateri).toLowerCase();

  const faseKey = fase ? (fase.startsWith('Fase') ? fase : `Fase ${fase}`) : 'Fase C';
  const officialMatematika = cpElementsData['Matematika']?.[faseKey] || cpElementsData['Matematika']?.['Fase C'] || {};

  let targetElem = 'Bilangan';

  const contextWithoutDatar = combinedContext.replace(/datar/g, '');
  if (/\b(data|diagram|piktogram|turus|grafik|peluang|frekuensi)\b/i.test(contextWithoutDatar) || combinedContext.includes('pengumpulan data') || combinedContext.includes('penyajian data') || combinedContext.includes('analisis data') || combinedContext.includes('tabel data') || combinedContext.includes('tabel frekuensi')) {
    targetElem = 'Analisis Data dan Peluang';
  } else if (combinedContext.includes('bangun ruang') || combinedContext.includes('simetri lipat') || combinedContext.includes('simetri putar') || combinedContext.includes('visualisasi spasial') || combinedContext.includes('sistem berpetak') || (combinedContext.includes('bangun datar') && !combinedContext.includes('keliling') && !combinedContext.includes('luas'))) {
    targetElem = 'Geometri';
  } else if (combinedContext.includes('keliling') || combinedContext.includes('luas') || combinedContext.includes('sudut') || combinedContext.includes('pengukuran') || combinedContext.includes('mengukur') || combinedContext.includes('busur') || combinedContext.includes('durasi') || combinedContext.includes('panjang') || combinedContext.includes('berat') || combinedContext.includes('volume')) {
    targetElem = 'Pengukuran';
  } else if (combinedContext.includes('aljabar') || combinedContext.includes('rasio') || combinedContext.includes('proporsi') || combinedContext.includes('skala') || combinedContext.includes('pola bilangan') || combinedContext.includes('kalimat matematika') || combinedContext.includes('variabel')) {
    targetElem = 'Aljabar';
  } else {
    targetElem = 'Bilangan';
  }

  const officialCpElemText = officialMatematika[targetElem] || '';

  // Cek apakah cpText yang ada sudah cocok dengan tag targetElem
  const hasTargetTag = cpText.toLowerCase().includes(`[${targetElem.toLowerCase()}`);
  if (!hasTargetTag) {
    if (officialCpElemText) {
      return `[${targetElem}]\n${officialCpElemText}`;
    }
    const cleanOldCp = cpText.replace(/^\[.*?\]\s*:?\s*/i, '').trim();
    return `[${targetElem}]\n${cleanOldCp || 'Memahami dan menguasai materi pada elemen ini.'}`;
  }

  return cpText;
}

// Helper: Validasi & Auto-Repair Output AI untuk Struktur Dokumen Kedinasan yang Presisi
export function validateAndRepairAnalysisResult(rawResult: any, inputChapters: any[], meta: any): any {
  const result = (rawResult && typeof rawResult === 'object') ? JSON.parse(JSON.stringify(rawResult)) : {};
  
  // 1. Metadata Normalization
  result.metadata = result.metadata || {};
  result.metadata.satuan_pendidikan = result.metadata.satuan_pendidikan || meta.namaSekolah || 'SDN';
  result.metadata.mata_pelajaran = result.metadata.mata_pelajaran || meta.mataPelajaran || '';
  result.metadata.fase = result.metadata.fase || meta.fase || 'Fase C';
  const rawKelas = String(result.metadata.kelas || meta.jenjangKelas || '5');
  const kelasNum = rawKelas.replace(/\D/g, '') || '5';
  result.metadata.kelas = kelasNum;
  result.metadata.fase_kelas = result.metadata.fase_kelas || `${result.metadata.fase}/${kelasNum}`;
  result.metadata.tahun_pembelajaran = result.metadata.tahun_pembelajaran || meta.tahunAjaran || '2025/2026';

  // 2. Semesters Structure Normalization
  const isTargetSem1 = String(meta.targetSemester || meta.bookCoverage) === '1' || String(meta.targetSemester || meta.bookCoverage).toLowerCase().includes('sem1');
  const isTargetSem2 = String(meta.targetSemester || meta.bookCoverage) === '2' || String(meta.targetSemester || meta.bookCoverage).toLowerCase().includes('sem2');

  if (!Array.isArray(result.semesters) || result.semesters.length === 0) {
    if (Array.isArray(result.babs) && result.babs.length > 0) {
      if (isTargetSem1) {
        result.semesters = [
          {
            semester: 1,
            semester_label: 'SEMESTER 1',
            babs: result.babs.map((b: any) => ({ ...b, semester: 1 }))
          }
        ];
      } else if (isTargetSem2) {
        result.semesters = [
          {
            semester: 2,
            semester_label: 'SEMESTER 2',
            babs: result.babs.map((b: any) => ({ ...b, semester: 2 }))
          }
        ];
      } else {
        result.semesters = [
          {
            semester: 1,
            semester_label: 'SEMESTER 1',
            babs: result.babs.filter((b: any) => b.semester !== 2)
          },
          {
            semester: 2,
            semester_label: 'SEMESTER 2',
            babs: result.babs.filter((b: any) => b.semester === 2)
          }
        ];
      }
    } else {
      if (isTargetSem1) {
        result.semesters = [{ semester: 1, semester_label: 'SEMESTER 1', babs: [] }];
      } else if (isTargetSem2) {
        result.semesters = [{ semester: 2, semester_label: 'SEMESTER 2', babs: [] }];
      } else {
        result.semesters = [
          { semester: 1, semester_label: 'SEMESTER 1', babs: [] },
          { semester: 2, semester_label: 'SEMESTER 2', babs: [] }
        ];
      }
    }
  } else {
    // Jika AI mengeluarkan semesters array, pastikan targetSemester spesifik dipatuhi
    if (isTargetSem1) {
      const sem1 = result.semesters.find((s: any) => s.semester === 1) || { semester: 1, semester_label: 'SEMESTER 1', babs: [] };
      const sem2 = result.semesters.find((s: any) => s.semester === 2);
      if (sem2 && Array.isArray(sem2.babs) && sem2.babs.length > 0) {
        sem1.babs = [...(sem1.babs || []), ...sem2.babs.map((b: any) => ({ ...b, semester: 1 }))];
      }
      result.semesters = [sem1];
    } else if (isTargetSem2) {
      const sem2 = result.semesters.find((s: any) => s.semester === 2) || { semester: 2, semester_label: 'SEMESTER 2', babs: [] };
      const sem1 = result.semesters.find((s: any) => s.semester === 1);
      if (sem1 && Array.isArray(sem1.babs) && sem1.babs.length > 0) {
        sem2.babs = [...(sem2.babs || []), ...sem1.babs.map((b: any) => ({ ...b, semester: 2 }))];
      }
      result.semesters = [sem2];
    }
  }

  // 3. Verifikasi & Lengkapi Bab Berdasarkan Input Chapters
  if (Array.isArray(inputChapters) && inputChapters.length > 0) {
    const existingBabNos = new Set<number>();
    for (const sem of result.semesters) {
      if (Array.isArray(sem.babs)) {
        for (const b of sem.babs) {
          if (typeof b.no === 'number') existingBabNos.add(b.no);
        }
      }
    }

    // Jika ada bab dari input yang terlewat oleh AI, sisipkan otomatis agar tidak terpotong
    for (const ch of inputChapters) {
      if (!existingBabNos.has(ch.no)) {
        const targetSemNum = isTargetSem2 ? 2 : isTargetSem1 ? 1 : (ch.semester === 2 ? 2 : 1);
        let semObj = result.semesters.find((s: any) => s.semester === targetSemNum);
        if (!semObj) {
          semObj = { semester: targetSemNum, semester_label: `SEMESTER ${targetSemNum}`, babs: [] };
          result.semesters.push(semObj);
        }
        if (!Array.isArray(semObj.babs)) semObj.babs = [];

        const materiList = Array.isArray(ch.materi_pokok) && ch.materi_pokok.length > 0
          ? ch.materi_pokok
          : [ch.bab || `Topik ${ch.no}`];

        semObj.babs.push({
          no: ch.no,
          bab: ch.bab || `Bab ${ch.no}`,
          cp: meta.baseCP || 'Murid memahami dan menerapkan kompetensi dasar sesuai kurikulum.',
          materi_list: materiList,
          items: materiList.map((m: string) => ({
            kode_tp: '',
            materi_pokok: m,
            tp: `Murid mampu memahami dan menguasai materi ${m}.`,
            atp: `Mempelajari konsep dasar ${m}, mendiskusikannya secara kelompok, dan mengerjakan asesmen formatif.`,
            alokasi_waktu: '4 JP'
          }))
        });
        existingBabNos.add(ch.no);
      }
    }
  }

  // 4. Pastikan Urutan Semester & Penomoran Kode TP Sekuensial Global (5.1, 5.2, 5.3, ...)
  result.semesters.sort((a: any, b: any) => (a.semester || 1) - (b.semester || 1));

  let globalTpCounter = 1;
  for (const sem of result.semesters) {
    if (!sem.semester_label) {
      sem.semester_label = `SEMESTER ${sem.semester || 1}`;
    }
    if (!Array.isArray(sem.babs)) sem.babs = [];
    sem.babs.sort((a: any, b: any) => (a.no || 0) - (b.no || 0));

    for (const bab of sem.babs) {
      // Auto-Repair & Enrich IPAS & Matematika Elements
      const mapelStr = (meta?.mataPelajaran || result.metadata?.mata_pelajaran || '').toLowerCase();
      const isIpasSubject = mapelStr.includes('ipas') || mapelStr.includes('ilmu pengetahuan alam') || mapelStr.includes('sains');
      const isMatematikaSubject = mapelStr.includes('matematika');
      if (isIpasSubject) {
        bab.cp = repairAndEnrichIpasBabCp(bab, result.metadata?.fase || meta?.fase || 'C');
      } else if (isMatematikaSubject) {
        bab.cp = repairAndEnrichMatematikaBabCp(bab, result.metadata?.fase || meta?.fase || 'C');
      }

      if (!Array.isArray(bab.items) || bab.items.length === 0) {
        bab.items = [
          {
            kode_tp: `${kelasNum}.${globalTpCounter++}`,
            materi_pokok: bab.bab || 'Materi Pokok',
            tp: `Murid mampu memahami dan menguasai konsep ${bab.bab || 'materi ini'}.`,
            atp: `Eksplorasi konsep, diskusi terbimbing, dan penerapan kompetensi.`,
            alokasi_waktu: '4 JP'
          }
        ];
      } else {
        for (const item of bab.items) {
          // Selalu tegakkan kode_tp sekuensial kedinasan tanpa reset antar bab
          item.kode_tp = `${kelasNum}.${globalTpCounter++}`;

          // Format alokasi waktu standar (misal "4 JP")
          if (!item.alokasi_waktu || typeof item.alokasi_waktu !== 'string') {
            item.alokasi_waktu = '4 JP';
          } else {
            const jpMatch = item.alokasi_waktu.match(/\d+/);
            const jpNum = jpMatch ? parseInt(jpMatch[0], 10) : 4;
            item.alokasi_waktu = `${jpNum} JP`;
          }

          if (!item.materi_pokok) item.materi_pokok = bab.bab || 'Materi Pokok';
          if (!item.tp) item.tp = `Murid mampu memahami konsep ${item.materi_pokok}.`;
          if (!item.atp) item.atp = `Aktivitas pembelajaran dan latihan kompetensi terkait ${item.materi_pokok}.`;
        }
      }
    }
  }

  // 5. Terapkan Standar Alokasi Waktu & Auto-Balance Intrakurikuler (Permendikdasmen No. 13 Tahun 2025)
  const finalMapel = result.metadata?.mata_pelajaran || meta.mataPelajaran || meta.mata_pelajaran || '';
  const finalKelas = result.metadata?.kelas || meta.kelas || meta.jenjangKelas || kelasNum;
  const quota = getAlokasiWaktuResmi(finalMapel, finalKelas);
  if (result.metadata) {
    result.metadata.alokasi_waktu_standar = {
      dasar_hukum: quota.dasarHukum,
      intrakurikuler_per_tahun: quota.intrakurikulerPerTahun,
      kokurikuler_per_tahun: quota.kokurikulerPerTahun,
      total_per_tahun: quota.totalPerTahun,
      jp_per_minggu: quota.jpPerMinggu,
      target_semester_jp: quota.intrakurikulerPerSemester,
      minggu_per_semester: quota.mingguPerSemester,
      minggu_per_tahun: quota.mingguPerTahun
    };
  }

  for (const sem of result.semesters) {
    balanceSemesterJpItems(sem.babs, quota.intrakurikulerPerSemester, quota.jpPerMinggu);
  }

  return replacePesertaDidik(result);
}

// 2. Generate Analisis CP (Non-Streaming)
analisisCp.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const {
      namaSekolah, namaGuru, mataPelajaran, jenjangKelas,
      tahunAjaran, chapters, targetSemester, bookCoverage, aiProvider
    } = body;

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return Errors.badRequest(c, 'Daftar BAB tidak boleh kosong');
    }

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    const { officialCP, elementsCP, faseCode, fase } = await resolveOfficialCP(mataPelajaran, jenjangKelas, c.env.DB);
    const distributedChapters = distributeChaptersToSemesters(chapters, targetSemester, bookCoverage);

    const prompt = buildAnalisisCpPrompt({
      namaSekolah,
      mataPelajaran,
      jenjangKelas,
      fase: faseCode,
      tahunAjaran,
      chapters: distributedChapters,
      targetSemester: targetSemester || 'all',
      baseCP: officialCP,
      elementsCP
    });

    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash'
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;
    const rawResult = await ai.generateJSON(prompt, preferredSlug);
    const result = validateAndRepairAnalysisResult(rawResult, distributedChapters, {
      namaSekolah,
      namaGuru,
      mataPelajaran,
      jenjangKelas,
      fase: faseCode,
      tahunAjaran,
      targetSemester,
      bookCoverage,
      baseCP: officialCP
    });

    // Telemetry log
    try {
      const sessionId = getCookie(c.req.header('Cookie'), 'session');
      const user = await getCurrentUser(c.env.DB, sessionId);
      await recordAIGeneration(c.env.DB, {
        user_id: user?.id || 1,
        user_nama: user?.nama || (namaGuru || 'Guru'),
        sekolah: user?.sekolah || (namaSekolah || 'SDN'),
        feature_type: 'ANALISIS_CP',
        mata_pelajaran: mataPelajaran,
        topik: `Analisis CP ${chapters.length} BAB`,
        jenjang_kelas: jenjangKelas,
        ai_provider: preferredSlug,
      });
    } catch (_) {}

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Analisis CP Gen Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 3. Generate Analisis CP Stream (SSE Live Monitor)
analisisCp.post('/generate-stream', async (c) => {
  try {
    const body = await c.req.json();
    const {
      namaSekolah, namaGuru, mataPelajaran, jenjangKelas,
      tahunAjaran, chapters, targetSemester, bookCoverage, aiProvider
    } = body;

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return Errors.badRequest(c, 'Daftar BAB tidak boleh kosong');
    }

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    const { officialCP, elementsCP, faseCode, fase } = await resolveOfficialCP(mataPelajaran, jenjangKelas, c.env.DB);
    const distributedChapters = distributeChaptersToSemesters(chapters, targetSemester, bookCoverage);

    const prompt = buildAnalisisCpPrompt({
      namaSekolah,
      mataPelajaran,
      jenjangKelas,
      fase: faseCode,
      tahunAjaran,
      chapters: distributedChapters,
      targetSemester: targetSemester || 'all',
      baseCP: officialCP,
      elementsCP
    });

    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash'
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;

    c.header('X-Accel-Buffering', 'no');
    return streamSSE(c, async (stream) => {
      try {
        const regTitle = (mataPelajaran?.toLowerCase().includes('agama') || mataPelajaran?.toLowerCase().includes('paibp'))
          ? 'Kepka BKPDM 020/2026'
          : (mataPelajaran?.toLowerCase().includes('sunda') || mataPelajaran?.toLowerCase().includes('tatanen') || mataPelajaran?.toLowerCase().includes('akpk'))
            ? 'Muatan Lokal'
            : 'BSKAP 046/2025';
        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 1,
            totalSteps: 4,
            title: `Sinkronisasi CP ${regTitle}`,
            message: `Memvalidasi capaian pembelajaran resmi untuk ${mataPelajaran} (${jenjangKelas})...`,
            percent: 25
          })
        });

        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 2,
            totalSteps: 4,
            title: 'Pemetaan Bab & Materi Pokok',
            message: `Memetakan ${distributedChapters.length} BAB ke CP dan Elemen Kurikulum...`,
            percent: 50
          })
        });

        const onToken = async (token: string) => {
          try {
            await stream.writeSSE({
              event: 'token',
              data: JSON.stringify({ text: token })
            });
          } catch (_) {}
        };

        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 3,
            totalSteps: 4,
            title: 'Perumusan TP & ATP',
            message: `Menyusun kode TP berurutan dan alur aktivitas pembelajaran operasional...`,
            percent: 75
          })
        });

        const rawResult = await ai.generateJSONStream(prompt, preferredSlug, onToken);
        const result = validateAndRepairAnalysisResult(rawResult, distributedChapters, {
          namaSekolah,
          namaGuru,
          mataPelajaran,
          jenjangKelas,
          fase: faseCode,
          tahunAjaran,
          targetSemester,
          bookCoverage,
          baseCP: officialCP
        });

        // Telemetry log
        try {
          const sessionId = getCookie(c.req.header('Cookie'), 'session');
          const user = await getCurrentUser(c.env.DB, sessionId);
          await recordAIGeneration(c.env.DB, {
            user_id: user?.id || 1,
            user_nama: user?.nama || (namaGuru || 'Guru'),
            sekolah: user?.sekolah || (namaSekolah || 'SDN'),
            feature_type: 'ANALISIS_CP',
            mata_pelajaran: mataPelajaran,
            topik: `Analisis CP ${chapters.length} BAB`,
            jenjang_kelas: jenjangKelas,
            ai_provider: preferredSlug,
          });
        } catch (_) {}

        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 4,
            totalSteps: 4,
            title: 'Finalisasi Dokumen Analisis',
            message: 'Tabel Analisis CP, TP, dan ATP berhasil dirakit!',
            percent: 100
          })
        });

        await stream.writeSSE({
          event: 'done',
          data: JSON.stringify({
            success: true,
            data: result
          })
        });
      } catch (err: any) {
        console.error('Analisis CP Stream Error:', err);
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({
            message: err.message || 'Gagal menghasilkan Analisis CP secara streaming'
          })
        });
      }
    });
  } catch (e: any) {
    console.error('Analisis CP Route Stream Error:', e);
    return Errors.internal(c, e.message);
  }
});

// Helper resolusi kop surat URL
async function resolveKopUrl(c: any, explicitKopUrl?: string): Promise<string | null> {
  if (explicitKopUrl) return explicitKopUrl;
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (user?.sekolah) {
      const matched: any = await c.env.DB.prepare('SELECT kop_surat_url FROM sekolah WHERE nama = ? LIMIT 1').bind(user.sekolah).first();
      if (matched?.kop_surat_url) return matched.kop_surat_url;
    }
  } catch (_) {}
  return null;
}

// 4. Download DOCX Analisis CP
analisisCp.post('/docx', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters } = body;

    if (!semesters || !Array.isArray(semesters)) {
      return Errors.badRequest(c, 'Data semesters wajib disertakan');
    }

    const mapelStr = String(metadata?.mata_pelajaran || '').toLowerCase();
    const isIpas = mapelStr.includes('ipas') || mapelStr.includes('ilmu pengetahuan alam') || mapelStr.includes('sains');
    const isMatematika = mapelStr.includes('matematika');
    if ((isIpas || isMatematika) && Array.isArray(semesters)) {
      for (const sem of semesters) {
        if (Array.isArray(sem.babs)) {
          for (const bab of sem.babs) {
            if (isIpas) {
              bab.cp = repairAndEnrichIpasBabCp(bab, metadata?.fase || 'C');
            } else if (isMatematika) {
              bab.cp = repairAndEnrichMatematikaBabCp(bab, metadata?.fase || 'C');
            }
          }
        }
      }
    }

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters
    };

    const buffer = await generateAnalisisCpDocxBuffer(replacePesertaDidik(docxInput));

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const filename = `Analisis_CP_TP_ATP_${mapelSafe}_Kelas_${kelasSafe}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('Analisis CP DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4b. Download DOCX Program Tahunan (PROTA)
analisisCp.post('/docx/prota', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters } = body;

    if (!semesters || !Array.isArray(semesters)) {
      return Errors.badRequest(c, 'Data semesters wajib disertakan');
    }

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters
    };

    const buffer = await generateProtaDocxBuffer(replacePesertaDidik(docxInput));

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const filename = `PROTA_${mapelSafe}_Kelas_${kelasSafe}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('Prota DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4c. Download DOCX Program Semester (PROMES)
analisisCp.post('/docx/promes', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters, semester } = body;

    if (!semesters || !Array.isArray(semesters)) {
      return Errors.badRequest(c, 'Data semesters wajib disertakan');
    }

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters
    };

    const targetSem = semester ? Number(semester) : undefined;
    const buffer = await generatePromesDocxBuffer(replacePesertaDidik(docxInput), targetSem);

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const semSuffix = targetSem ? `_Semester_${targetSem}` : '';
    const filename = `PROMES_${mapelSafe}_Kelas_${kelasSafe}${semSuffix}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('Promes DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4d. Download DOCX Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
analisisCp.post('/docx/kktp', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters, semester } = body;

    if (!semesters || !Array.isArray(semesters)) {
      return Errors.badRequest(c, 'Data semesters wajib disertakan');
    }

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters
    };

    const targetSem = semester ? Number(semester) : undefined;
    const buffer = await generateKktpDocxBuffer(replacePesertaDidik(docxInput), targetSem);

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const semSuffix = targetSem ? `_Semester_${targetSem}` : '';
    const filename = `KKTP_${mapelSafe}_Kelas_${kelasSafe}${semSuffix}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('KKTP DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4e. Download DOCX Rincian Pekan Efektif (RPE) - Standar Disdik Kab. Purwakarta
analisisCp.post('/docx/rpe', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters, semester } = body;

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters: Array.isArray(semesters) ? semesters : []
    };

    const targetSem = semester ? Number(semester) : undefined;
    const buffer = await generateRpeDocxBuffer(replacePesertaDidik(docxInput), targetSem);

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const semSuffix = targetSem ? `_Semester_${targetSem}` : '';
    const filename = `RPE_${mapelSafe}_Kelas_${kelasSafe}${semSuffix}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('RPE DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4f. Download DOCX Alur Tujuan Pembelajaran (ATP) Model Elemen CP (Model PPA BSKAP)
analisisCp.post('/docx/atp-elemen', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters } = body;

    if (!semesters || !Array.isArray(semesters)) {
      return Errors.badRequest(c, 'Data semesters wajib disertakan');
    }

    const mapelStr = String(metadata?.mata_pelajaran || '').toLowerCase();
    const isIpas = mapelStr.includes('ipas') || mapelStr.includes('ilmu pengetahuan alam') || mapelStr.includes('sains');
    const isMatematika = mapelStr.includes('matematika');
    if ((isIpas || isMatematika) && Array.isArray(semesters)) {
      for (const sem of semesters) {
        if (Array.isArray(sem.babs)) {
          for (const bab of sem.babs) {
            if (isIpas) {
              bab.cp = repairAndEnrichIpasBabCp(bab, metadata?.fase || 'C');
            } else if (isMatematika) {
              bab.cp = repairAndEnrichMatematikaBabCp(bab, metadata?.fase || 'C');
            }
          }
        }
      }
    }

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters: Array.isArray(semesters) ? semesters : []
    };

    const buffer = await generateAtpElemenDocxBuffer(replacePesertaDidik(docxInput));

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const filename = `ATP_Elemen_${mapelSafe}_Kelas_${kelasSafe}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('ATP Elemen DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4g. Download DOCX Capaian Pembelajaran (CP) Resmi Kurikulum Merdeka
analisisCp.post('/docx/data-cp', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters } = body;

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters: Array.isArray(semesters) ? semesters : []
    };

    const buffer = await generateCapaianPembelajaranDocxBuffer(replacePesertaDidik(docxInput));

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const filename = `Capaian_Pembelajaran_${mapelSafe}_Kelas_${kelasSafe}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('Data CP DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4h. Get Official Capaian Pembelajaran (CP) Document Data
analisisCp.get('/official-cp', async (c) => {
  try {
    const mapel = c.req.query('mapel') || 'Matematika';
    const kelas = c.req.query('kelas') || 'Kelas 5';
    const data = getOfficialCpDocumentData(mapel, kelas);
    return successResponse(c, data);
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Self-healing: Ensure analisis_cp_history Table Exists
// ============================================
export async function ensureAnalisisCpTables(db: D1Database): Promise<void> {
  try {
    await db.prepare('SELECT 1 FROM analisis_cp_history LIMIT 1').first();
  } catch {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS analisis_cp_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_nama TEXT,
        nama_sekolah TEXT NOT NULL,
        mata_pelajaran TEXT NOT NULL,
        jenjang_kelas TEXT NOT NULL,
        fase TEXT NOT NULL,
        tahun_ajaran TEXT NOT NULL,
        sumber_buku TEXT,
        total_bab INTEGER DEFAULT 0,
        is_public INTEGER DEFAULT 1,
        use_count INTEGER DEFAULT 0,
        content_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_analisis_cp_user ON analisis_cp_history(user_id)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_analisis_cp_created ON analisis_cp_history(created_at DESC)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_analisis_cp_mapel ON analisis_cp_history(mata_pelajaran)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_analisis_cp_kelas ON analisis_cp_history(jenjang_kelas)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_analisis_cp_public ON analisis_cp_history(is_public)')
    ]);
  }

  // Gracefully ensure columns exist if created by earlier minimal migrations
  try {
    await db.prepare('SELECT user_nama FROM analisis_cp_history LIMIT 1').first();
  } catch {
    try { await db.prepare('ALTER TABLE analisis_cp_history ADD COLUMN user_nama TEXT').run(); } catch (_) {}
  }
  try {
    await db.prepare('SELECT is_public FROM analisis_cp_history LIMIT 1').first();
  } catch {
    try { await db.prepare('ALTER TABLE analisis_cp_history ADD COLUMN is_public INTEGER DEFAULT 1').run(); } catch (_) {}
  }
  try {
    await db.prepare('SELECT use_count FROM analisis_cp_history LIMIT 1').first();
  } catch {
    try { await db.prepare('ALTER TABLE analisis_cp_history ADD COLUMN use_count INTEGER DEFAULT 0').run(); } catch (_) {}
  }
  try {
    await db.prepare('SELECT total_bab FROM analisis_cp_history LIMIT 1').first();
  } catch {
    try { await db.prepare('ALTER TABLE analisis_cp_history ADD COLUMN total_bab INTEGER DEFAULT 0').run(); } catch (_) {}
  }
  try {
    await db.prepare('SELECT like_count FROM analisis_cp_history LIMIT 1').first();
  } catch {
    try { await db.prepare('ALTER TABLE analisis_cp_history ADD COLUMN like_count INTEGER DEFAULT 0').run(); } catch (_) {}
  }

  // Self-healing: Ensure curriculum_standard_chapters Table Exists
  try {
    await db.prepare('SELECT 1 FROM curriculum_standard_chapters LIMIT 1').first();
  } catch {
    try {
      await db.batch([
        db.prepare(`CREATE TABLE IF NOT EXISTS curriculum_standard_chapters (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mata_pelajaran TEXT NOT NULL,
          jenjang_kelas TEXT NOT NULL,
          fase TEXT NOT NULL,
          buku_judul TEXT NOT NULL,
          chapters_json TEXT NOT NULL,
          total_babs INTEGER NOT NULL DEFAULT 0,
          tahun_terbit INTEGER DEFAULT 2024,
          penerbit TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_curr_mapel_kelas ON curriculum_standard_chapters(mata_pelajaran, jenjang_kelas)')
      ]);
    } catch (_) {}
  }

  // Gracefully ensure columns exist if created by earlier migrations
  try {
    await db.prepare('SELECT tahun_terbit FROM curriculum_standard_chapters LIMIT 1').first();
  } catch {
    try { await db.prepare('ALTER TABLE curriculum_standard_chapters ADD COLUMN tahun_terbit INTEGER DEFAULT 2024').run(); } catch (_) {}
  }
  try {
    await db.prepare('SELECT penerbit FROM curriculum_standard_chapters LIMIT 1').first();
  } catch {
    try { await db.prepare('ALTER TABLE curriculum_standard_chapters ADD COLUMN penerbit TEXT').run(); } catch (_) {}
  }
  // Drop obsolete unique indexes so multiple books/editions can be saved per subject & grade
  try {
    await db.prepare('DROP INDEX IF EXISTS idx_curriculum_mapel_kelas').run();
  } catch (_) {}
  try {
    await db.prepare('DROP INDEX IF EXISTS idx_curr_mapel_kelas').run();
  } catch (_) {}
  try {
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_curr_mapel_kelas ON curriculum_standard_chapters(mata_pelajaran, jenjang_kelas)').run();
  } catch (_) {}
}

// 5. Simpan Hasil Analisis ke Database & CP Kolaboratif
analisisCp.post('/save', async (c) => {
  try {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c, 'Silakan login terlebih dahulu');

    await ensureAnalisisCpTables(c.env.DB);

    const body = await c.req.json();
    const {
      namaSekolah, mataPelajaran, jenjangKelas, fase,
      tahunAjaran, sumberBuku, contentJson, isPublic
    } = body;

    let parsedContent: any = null;
    let calculatedTotalBab = 0;
    try {
      parsedContent = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
      if (parsedContent && Array.isArray(parsedContent.semesters)) {
        for (const s of parsedContent.semesters) {
          if (Array.isArray(s.babs)) calculatedTotalBab += s.babs.length;
        }
      }
    } catch (_) {}

    const isPub = isPublic !== undefined ? (isPublic ? 1 : 0) : 1;

    const result = await c.env.DB.prepare(`
      INSERT INTO analisis_cp_history (
        user_id, user_nama, nama_sekolah, mata_pelajaran, jenjang_kelas,
        fase, tahun_ajaran, sumber_buku, total_bab, is_public, content_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).bind(
      user.id,
      user.nama || 'Guru',
      namaSekolah || user.sekolah || 'SDN',
      mataPelajaran || '-',
      jenjangKelas || '-',
      fase || 'C',
      tahunAjaran || '2025/2026',
      sumberBuku || 'Buku Teks Guru/Siswa',
      calculatedTotalBab,
      isPub,
      typeof contentJson === 'string' ? contentJson : JSON.stringify(contentJson)
    ).run();

    return successResponse(c, { id: result.results[0]?.id }, 'Analisis CP berhasil disimpan ke CP Kolaboratif!');
  } catch (e: any) {
    console.error('Save Analisis CP Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 6. CP Kolaboratif — Browse & Filter Dokumen Analisis CP Rekan Guru
analisisCp.get('/kolaboratif', async (c) => {
  try {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureAnalisisCpTables(c.env.DB);

    const mapel = c.req.query('mapel') || '';
    const kelas = c.req.query('kelas') || '';
    const search = c.req.query('search') || c.req.query('topik') || '';
    const sort = c.req.query('sort') || 'newest';
    const mine = c.req.query('mine') || '';
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const limit = Math.min(50, Math.max(6, parseInt(c.req.query('limit') || '10')));
    const offset = (page - 1) * limit;

    let where = 'WHERE (is_public = 1 OR user_id = ?)';
    const params: any[] = [user.id];

    if (mine === '1') {
      where = 'WHERE user_id = ?';
    }

    if (mapel) {
      where += ' AND mata_pelajaran LIKE ?';
      params.push(`%${mapel}%`);
    }

    if (kelas) {
      where += ' AND jenjang_kelas = ?';
      params.push(kelas);
    }

    if (search) {
      where += ' AND (mata_pelajaran LIKE ? OR sumber_buku LIKE ? OR nama_sekolah LIKE ? OR user_nama LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Count
    const countQuery = `SELECT COUNT(*) as total FROM analisis_cp_history ${where}`;
    const countResult: any = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Sort order
    let orderBy = 'ORDER BY created_at DESC';
    if (sort === 'popular') {
      orderBy = 'ORDER BY (use_count + COALESCE(like_count, 0) * 2) DESC, created_at DESC';
    }

    const dataQuery = `
      SELECT id, user_id, user_nama, nama_sekolah, mata_pelajaran, jenjang_kelas, fase, tahun_ajaran, sumber_buku, total_bab, is_public, use_count, COALESCE(like_count, 0) as like_count, created_at
      FROM analisis_cp_history
      ${where}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const listParams = [...params, limit, offset];
    const results = await c.env.DB.prepare(dataQuery).bind(...listParams).all();

    return successResponse(c, {
      items: results.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (e: any) {
    console.error('List CP Kolaboratif Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 7. CP Kolaboratif Stats & Badge Counter
analisisCp.get('/kolaboratif/stats', async (c) => {
  try {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureAnalisisCpTables(c.env.DB);

    const totalRes: any = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM analisis_cp_history WHERE is_public = 1 OR user_id = ?`).bind(user.id).first();
    const myRes: any = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM analisis_cp_history WHERE user_id = ?`).bind(user.id).first();

    const mapelGroup = await c.env.DB.prepare(`
      SELECT mata_pelajaran, COUNT(*) as count 
      FROM analisis_cp_history 
      WHERE is_public = 1 OR user_id = ?
      GROUP BY mata_pelajaran 
      ORDER BY count DESC
    `).bind(user.id).all();

    return successResponse(c, {
      total_cp: totalRes?.total || 0,
      my_cp: myRes?.total || 0,
      per_mapel: mapelGroup.results || []
    });
  } catch (e: any) {
    console.error('Stats CP Kolaboratif Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 8. Catat Penggunaan CP Kolaboratif
analisisCp.post('/:id/use', async (c) => {
  try {
    await ensureAnalisisCpTables(c.env.DB);
    const id = c.req.param('id');
    await c.env.DB.prepare(`UPDATE analisis_cp_history SET use_count = use_count + 1 WHERE id = ?`).bind(id).run();
    return successResponse(c, null, 'Status penggunaan berhasil dicatat');
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

// 8b. Apresiasi / Like CP Kolaboratif
analisisCp.post('/:id/like', async (c) => {
  try {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c, 'Silakan login terlebih dahulu');

    await ensureAnalisisCpTables(c.env.DB);
    const id = c.req.param('id');
    await c.env.DB.prepare(`UPDATE analisis_cp_history SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ?`).bind(id).run();
    const row: any = await c.env.DB.prepare(`SELECT like_count FROM analisis_cp_history WHERE id = ?`).bind(id).first();
    return successResponse(c, { like_count: row?.like_count || 1 }, 'Apresiasi berhasil diberikan');
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

// 9. Riwayat Pribadi Pengguna
analisisCp.get('/history', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureAnalisisCpTables(c.env.DB);

    const results = await c.env.DB.prepare(`
      SELECT id, user_id, user_nama, nama_sekolah, mata_pelajaran, jenjang_kelas, fase, tahun_ajaran, sumber_buku, total_bab, is_public, use_count, COALESCE(like_count, 0) as like_count, created_at
      FROM analisis_cp_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(user.id).all();

    return successResponse(c, results.results || []);
  } catch (e: any) {
    console.error('List History Analisis CP Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 10. Ambil Detail Dokumen Tersimpan / CP Kolaboratif
analisisCp.get('/:id', async (c) => {
  try {
    await ensureAnalisisCpTables(c.env.DB);
    const id = c.req.param('id');
    const result: any = await c.env.DB.prepare(`SELECT * FROM analisis_cp_history WHERE id = ?`).bind(id).first();
    if (!result) return Errors.notFound(c, 'Analisis CP tidak ditemukan');

    try {
      result.content = JSON.parse(result.content_json);
    } catch (_) {
      result.content = null;
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Get Analisis CP Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 11. Hapus Riwayat / CP Kolaboratif (Pemilik / Admin Saja)
analisisCp.delete('/:id', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureAnalisisCpTables(c.env.DB);

    const id = c.req.param('id');
    const item: any = await c.env.DB.prepare(`SELECT user_id FROM analisis_cp_history WHERE id = ?`).bind(id).first();
    if (!item) return Errors.notFound(c, 'Dokumen Analisis CP tidak ditemukan');

    if (item.user_id !== user.id && user.role !== 'admin') {
      return Errors.forbidden(c, 'Hanya pembuat dokumen atau admin yang dapat menghapus dokumen ini');
    }

    await c.env.DB.prepare(`DELETE FROM analisis_cp_history WHERE id = ?`).bind(id).run();
    return successResponse(c, null, 'Dokumen Analisis CP berhasil dihapus');
  } catch (e: any) {
    console.error('Delete Analisis CP Error:', e);
    return Errors.internal(c, e.message);
  }
});

export default analisisCp;
