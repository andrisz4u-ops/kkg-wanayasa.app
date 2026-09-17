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
import { getAlokasiWaktuResmi, balanceSemesterJpItems } from '../lib/alokasi-waktu';
import { type AppBindings } from '../types/env';

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
2. [KOLOM ELEMEN / CAPAIAN PEMBELAJARAN]: Pilih dan petakan kalimat Capaian Pembelajaran RESMI pemerintah di atas yang paling selaras menaungi materi bab ini. Wajib awali dengan nama Elemen resminya secara jelas dalam tanda kurung siku [Nama Elemen], contoh:
   "[Al-Qur’an Hadis] Murid mampu membaca, menghafal, menulis, dan memahami surah-surah pendek atau ayat Al-Qur'an serta hadis..."
   "[Pemahaman IPAS] Menjelaskan fenomena gelombang bunyi dan cahaya dalam kehidupan sehari-hari."
   "[Akidah] Mengenal rukun iman dan mengimani sifat-sifat Allah SWT..."
   DILARANG MENGARANG teks CP baru di luar substansi resmi pemerintah.
3. [KOLOM MATERI POKOK]: Rincikan 2 sampai 4 submateri/topik pokok penting dalam bab tersebut dengan nomor urut (contoh: \"1. Sifat Cahaya\", \"2. Indra Penglihatan (Mata)\", \"3. Sifat Bunyi\", \"4. Indra Pendengaran (Telinga)\").
4. [KOLOM KODE TP]: Wajib menggunakan format kelas.nomor_urut.
   Untuk ${jenjangKelas} (Kelas ${kelasNum}):
   Gunakan: ${kelasNum}.1, ${kelasNum}.2, ${kelasNum}.3, ${kelasNum}.4, ${kelasNum}.5, dst secara berurutan dan TIDAK BOLEH reset/mengulang dari 1 di tiap bab baru. Urutan nomor terus berlanjut hingga akhir semester/tahun!
5. [KOLOM TP (TUJUAN PEMBELAJARAN)]:
   Rumuskan Tujuan Pembelajaran yang operasional, jelas, terukur, dan berbasis kompetensi (Taksonomi Bloom/Anderson: Mendesain, Menjelaskan, Mengidentifikasi, Menganalisis, Menyajikan, dll).
   Contoh: \"Mendesain percobaan sederhana untuk membuktikan sifat cahaya dan menjelaskan hasilnya.\"
6. [KOLOM ATP (ALUR TUJUAN PEMBELAJARAN)]:
   Rumuskan langkah kegiatan/alur konkret yang dijalani murid di kelas untuk mencapai TP tersebut.
   Contoh: \"Murid melakukan percobaan menggunakan cermin, gelas berisi air, dan karton lubang untuk membuktikan sifat cahaya (merambat lurus, menembus benda bening, dipantulkan, dibiaskan).\"
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`),
        db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_curr_mapel_kelas ON curriculum_standard_chapters(mata_pelajaran, jenjang_kelas)')
      ]);
    } catch (_) {}
  }
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
