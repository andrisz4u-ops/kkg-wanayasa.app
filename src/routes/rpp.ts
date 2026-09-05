import { Hono } from 'hono';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import { generateRppBuffer, type RppInputData, type RppContentData } from '../lib/docx-generator';
import { cpData, getOfficialCP } from '../lib/cp-data';
import { getCookie, getCurrentUser } from '../lib/auth';
import { recordAIGeneration } from '../lib/telemetry';
import { type AppBindings } from '../types/env';

const rpp = new Hono<{ Bindings: AppBindings }>();

// Generate RPP
rpp.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const {
      namaSekolah, namaKepalaSekolah, nipKepalaSekolah,
      namaGuru, nipGuru, mataPelajaran, topik, jenjangKelas,
      semester, alokasiWaktu, strategi, jumlahPertemuan,
      profilLulusan, capaianPembelajaran, lampirkanLKPD, aiProvider
    } = body;

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    // Time distribution logic
    const totalMinutes = (() => {
      const timeStr = alokasiWaktu || '';
      const match = timeStr.match(/(\d+)\s*[xX]\s*(\d+)/);
      if (match) return parseInt(match[1]) * parseInt(match[2]);
      return parseInt(timeStr.replace(/\D/g, '')) || 70;
    })();

    const breakdown = {
      pendahuluan: Math.round(totalMinutes * (5 / 70)),
      mindful: Math.round(totalMinutes * (15 / 70)),
      meaningful: Math.round(totalMinutes * (30 / 70)),
      joyful: Math.round(totalMinutes * (15 / 70)),
      penutup: Math.round(totalMinutes * (5 / 70))
    };
    const currentSum = Object.values(breakdown).reduce((a, b) => a + b, 0);
    breakdown.meaningful += (totalMinutes - currentSum);

    const timeDist = {
      pen: `${breakdown.pendahuluan} Menit`,
      min: `${breakdown.mindful} Menit`,
      mea: `${breakdown.meaningful} Menit`,
      joy: `${breakdown.joyful} Menit`,
      clo: `${breakdown.penutup} Menit`
    };

    // Logika pemilihan CP berdasarkan Fase dan Mata Pelajaran (Resmi BSKAP No. 046 Tahun 2025)
    const getMatchedCP = () => {
      if (capaianPembelajaran && String(capaianPembelajaran).trim()) return capaianPembelajaran; // Prioritas input manual user
      return getOfficialCP(mataPelajaran, jenjangKelas);
    };

    const baseCP = getMatchedCP();
    const userCP = baseCP
      ? `Gunakan Capaian Pembelajaran resmi BSKAP No. 046 Tahun 2025 berikut sebagai dasar: "${baseCP}". Sesuaikan CP ini agar sangat spesifik dan relevan dengan topik "${topik}".`
      : "Buatlah Capaian Pembelajaran (CP) yang sesuai dengan Kurikulum Merdeka secara otomatis untuk mata pelajaran dan topik ini.";

    const profileDimensions = Array.isArray(profilLulusan)
      ? profilLulusan.join(', ')
      : (profilLulusan || '');

    const bedrockWarning = aiProvider === 'bedrock' 
      ? "\n\n      PERINGATAN KRITIS LIMITASI TOKEN:\n      Anda sedang berjalan di sistem Bedrock dengan batas keras 4000 output token. Jika teks terlalu panjang, JSON akan terpotong (rusak)! Untuk mencegah ini:\n      1. WAJIB menggunakan poin-poin sangat singkat (maksimal 5-7 kata per poin).\n      2. JANGAN menulis narasi paragraf panjang.\n      3. Hapus semua kalimat pengantar/penutup basa-basi.\n      4. Jadikan setiap aktivitas sesingkat mungkin tapi tetap jelas."
      : "";

    const prompt = `
      Bertindaklah sebagai ahli kurikulum Deep Learning & Understanding by Design (UbD).
      Tugas Anda adalah menyusun RPP (Rencana Pelaksanaan Pembelajaran) yang MENDALAM, TERSTRUKTUR, dan SIAP AJAR.${bedrockWarning}
      
      Gunakan bahasa yang jelas, padat, dan tidak bertele-tele. Jangan gunakan kalimat pengisi (filler).

      DATA SEKOLAH:
      Sekolah: ${namaSekolah}
      Guru: ${namaGuru}
      Mapel: ${mataPelajaran}
      Topik: ${topik}
      Kelas: ${jenjangKelas}
      Semester: ${semester}
      Strategi: ${strategi}
      Alokasi: ${alokasiWaktu}
      Jumlah Pertemuan: ${jumlahPertemuan}

      BAGIAN 1: IDENTIFIKASI
      - Analisis kesiapan belajar murid: Jelaskan secara spesifik level kognitif murid saat ini, miskonsepsi yang mungkin terjadi, dan prasyarat pengetahuan (maks. 3 kalimat).
      - Karakteristik gaya belajar: Jelaskan implikasi sebaran gaya belajar (visual/auditori/kinestetik) di kelas ini.
      - Kebutuhan khusus: Jelaskan kebutuhan emosional atau dukungan khusus yang relevan dengan topik ${topik}.

      BAGIAN 2: DESAIN PEMBELAJARAN
      - ${userCP}
      - Deskripsi Strategi: Jelaskan secara padat bagaimana ${strategi} akan diterapkan.
      - Profil Lulusan: ${profileDimensions}. Jelaskan cara melatih dimensi ini dalam 1 kalimat.
      - Diferensiasi:
        * Visual: Sebutkan media spesifik (gambar/video/diagram).
        * Auditori: Sebutkan instruksi atau bentuk diskusi lisan spesifik.
        * Kinestetik: Sebutkan aktivitas fisik spesifik.
      - Tujuan Pembelajaran (TP): Minimal 3 TP per pertemuan (1 LOTS, 2 HOTS).

      BAGIAN 3: SKENARIO PEMBELAJARAN (INTI GENERATED RPP)
      Ini adalah bagian terpenting. Untuk SETIAP PERTEMUAN, buat skenario yang aplikatif dengan alur:

      1. PENDAHULUAN
         - Sapaan, doa, absensi, ice breaking (sebutkan aktivitas spesifiknya).
         - Apersepsi: Pertanyaan pemantik dan ekspektasi respon murid.
         - Penyampaian tujuan.

      2. MINDFUL (BERKESADARAN)
         - Tuliskan 1 instruksi verbal spesifik dari guru untuk memusatkan perhatian murid.
         - Kegiatan observasi atau stimulasi awal.

      3. MEANINGFUL (BERMAKNA)
         - Ini adalah inti materi. Tuliskan langkah konstruksi pemahaman secara berurutan.
         - Aktivitas kolaborasi atau eksperimen yang spesifik.
         - Kaitkan materi dengan dunia nyata murid.

      4. JOYFUL (MENGGEMBIRAKAN)
         - Aktivitas perayaan pemahaman (game atau kuis interaktif).
         - Relevansi: Bagaimana ini membuat murid merasa berhasil/bangga?

      5. PENUTUP
         - Refleksi bersama: 1 pertanyaan penutup dari guru.
         - Penyampaian tindak lanjut (tugas atau persiapan pertemuan berikutnya).
         - Doa dan salam.

      ATURAN KERAS (STRICT RULES):
      1. FORMAT STEP-BY-STEP: WAJIB memecah narasi menjadi poin-poin daftar kegiatan yang diawali simbol "- ". JANGAN menulis dalam satu paragraf blok besar.
      2. KUALITAS PER POIN: Setiap poin strip harus MENDETAIL (minimal 2-3 kalimat per poin). Jangan buat poin pendek. Contoh benar:
         "- Guru memulai sesi dengan menyapa murid secara antusias, mengecek kehadiran, lalu mengajak murid melakukan ice breaking 'Tebak Gaya' untuk mencairkan suasana."
         (Ini list, tapi isinya naratif panjang).
      3. KONSISTENSI: Pertemuan ke-2 sampai ke-${jumlahPertemuan} HARUS sama detailnya.
      4. ANTI-DUPLIKASI (CRITICAL): JANGAN PERNAH mengulang aktivitas atau pertanyaan yang sama di fase berbeda. Contoh: Jika pertanyaan pemantik sudah ada di Pendahuluan, JANGAN TULIS LAGI di Mindful. Setiap fase harus unik dan progressive.
      5. ALOKASI WAKTU (WAJIB IKUTI HITUNGAN INI): Pendahuluan=${timeDist.pen}, Mindful=${timeDist.min}, Meaningful=${timeDist.mea}, Joyful=${timeDist.joy}, Penutup=${timeDist.clo}. Total = ${totalMinutes} Menit. JANGAN UBAH ANGKA INI.

      ${lampirkanLKPD === 'Ya' ? `WAJIB GENERATE LKPD LENGKAP untuk setiap pertemuan (lihat struktur JSON).` : ''}

      Struktur JSON Output (Wajib Valid JSON):
      {
        "identifikasi": {
          "kesiapan": "Analisis kesiapan...",
          "karakteristik": "Karakteristik gaya belajar...",
          "kebutuhan": "Kebutuhan utama murid..."
        },
        "desain": {
          "capaian": "Capaian Pembelajaran...",
          "metode_relevan": "Daftar metode...",
          "metode_pembelajaran": {
            "strategi": "Nama metode pembelajaran",
            "langkah_langkah": [
              "Sintak 1: Deskripsi...",
              "Sintak 2: Deskripsi..."
            ]
          },
          "sarana_prasarana": {
            "sumber_belajar": "...",
            "media": "...",
            "alat_peraga": "..."
          },
          "diferensiasi": {
            "visual": "Kegiatan untuk murid visual...",
            "auditori": "Kegiatan untuk murid auditori...",
            "kinestetik": "Kegiatan untuk murid kinestetik..."
          }
        },
        "pertemuan": [
          {
            "nomor": 1,
            "tujuan_pertemuan": ["TP 1 (LOTS)", "TP 2 (HOTS)", "TP 3 (HOTS)"],
            "kegiatan": {
              "pendahuluan": { "isi": "Narasi panjang pendahuluan...", "waktu": "${timeDist.pen}" },
              "mindful": { "isi": "Narasi panjang mindful...", "waktu": "${timeDist.min}" },
              "meaningful": { "isi": "Narasi panjang meaningful...", "waktu": "${timeDist.mea}" },
              "joyful": { "isi": "Narasi panjang joyful...", "waktu": "${timeDist.joy}" },
              "penutup": { "isi": "Narasi panjang penutup...", "waktu": "${timeDist.clo}" }
            }${lampirkanLKPD === 'Ya' ? `,
            "lkpd": {
              "identitas_petunjuk": "Langkah-langkah pengerjaan...",
              "tujuan_siswa": "Tujuan dengan bahasa sederhana...",
              "masalah": "Kasus/masalah untuk didiskusikan...",
              "aktivitas": "Instruksi kerja murid...",
              "hasil_kerja": "Format pengisian jawaban...",
              "penilaian": "Minimal 5 soal latihan (Tuliskan secara naratif berurutan 1-5, jangan menggunakan format JSON di dalam field ini. Berikan pilihan A,B,C,D untuk PG atau soal terbuka untuk Esai)."
            }` : ''}
          }
        ],
        "asesmen": {
          "formatif": "...",
          "sumatif": "..."
        }
      }

      KHUSUS UNTUK LKPD:
      - identitas_petunjuk: Tuliskan cara murid mengerjakan LKPD ini.
      - tujuan_siswa: Tuliskan tujuan pembelajaran yang ramah anak.
      - masalah: Berikan narasi masalah yang menantang.
      - aktivitas: Berikan langkah 1, 2, 3 untuk dikerjakan murid.
      - hasil_kerja: Berikan panduan apa yang harus ditulis di lembar jawaban.
      - penilaian: Wajib berikan minimal 5 soal (pilihan ganda atau esai).
    `;

    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash'
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;
    const result = await ai.generateJSON(prompt, preferredSlug);

    // Remove LKPD if user selected 'Tidak'
    if (lampirkanLKPD !== 'Ya' && result?.pertemuan) {
      result.pertemuan.forEach((p: any) => delete p.lkpd);
    }

    // Record usage telemetry for school & teacher analytics
    try {
      const sessionId = getCookie(c.req.header('Cookie'), 'session');
      const user = await getCurrentUser(c.env.DB, sessionId);
      await recordAIGeneration(c.env.DB, {
        user_id: user?.id || 1,
        user_nama: user?.nama || (namaGuru || 'Guru'),
        sekolah: user?.sekolah || (namaSekolah || 'SDN 2 Nangerang'),
        feature_type: 'RPP',
        mata_pelajaran: mataPelajaran,
        topik: topik,
        jenjang_kelas: jenjangKelas,
        ai_provider: preferredSlug,
      });
    } catch (_) {}

    return successResponse(c, result);
  } catch (e: any) {
    console.error('RPP Gen Error:', e);
    return Errors.internal(c, e.message);
  }
});

// Download RPP as DOCX (server-side generation)
rpp.post('/docx', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    let inputData = body.inputData;
    let content = body.content;
    const kopSuratUrl = body.kopSuratUrl;
    const lampiran = body.lampiran;

    if (typeof inputData === 'string') {
      try { inputData = JSON.parse(inputData); } catch (_) {}
    }
    if (typeof content === 'string') {
      try { content = JSON.parse(content); } catch (_) {}
    }

    if (!inputData || !content) {
      return Errors.badRequest(c, 'inputData dan content wajib diisi');
    }

    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);

    if (user && !inputData.jabatanGuru) {
      inputData.jabatanGuru = user.mata_pelajaran || user.role;
    }

    // Get KKG settings
    const settingsResult: any = await c.env.DB.prepare(
      "SELECT key, value FROM settings WHERE key IN ('nama_ketua', 'nip_ketua', 'alamat_sekretariat', 'tahun_ajaran', 'nama_organisasi')"
    ).all();

    const kkg: any = {};
    settingsResult.results?.forEach((row: any) => {
      kkg[row.key] = row.value;
    });

    const buffer = await generateRppBuffer(
      inputData as RppInputData,
      content as RppContentData,
      {
        nama_ketua: kkg.nama_ketua,
        nip_ketua: kkg.nip_ketua,
        alamat_sekretariat: kkg.alamat_sekretariat,
        tahun_ajaran: kkg.tahun_ajaran,
        nama_organisasi: kkg.nama_organisasi,
        // Gunakan kop_surat_url dari sekolah user (dikirim dari frontend)
        kop_surat_url: kopSuratUrl || null,
      },
      lampiran || null  // Lampiran rubrik & penilaian (jika sudah digenerate)
    );

    const mata = String(inputData.mataPelajaran || 'RPP').replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const topikStr = String(inputData.topik || 'Topik').replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const filename = `RPP_${mata}_${topikStr}.docx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (e: any) {
    console.error('RPP DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// Generate Lampiran Rubrik & Penilaian
rpp.post('/lampiran', async (c) => {
  try {
    const body = await c.req.json();
    const { mataPelajaran, topik, jenjangKelas, aiProvider } = body;

    if (!mataPelajaran || !topik) {
      return Errors.badRequest(c, 'mataPelajaran dan topik wajib diisi');
    }

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    const prompt = `Bertindaklah sebagai Ahli Asesmen Pendidikan Kurikulum Merdeka.
Berdasarkan RPP tentang mapel ${mataPelajaran}, topik ${topik} untuk kelas ${jenjangKelas || ''}, buatkan LAMPIRAN RUBRIK PENILAIAN yang lengkap.

OUTPUT YANG DIBUTUHKAN (Format JSON):
{
  "kognitif": {
    "deskripsi": "Rubrik penilaian pengetahuan...",
    "tabel": [
       { "kriteria": "...", "skor_4": "...", "skor_3": "...", "skor_2": "...", "skor_1": "..." }
    ]
  },
  "keterampilan": {
    "deskripsi": "Rubrik penilaian keterampilan/praktik...",
    "tabel": [
       { "aspek": "...", "skor_4": "...", "skor_3": "...", "skor_2": "...", "skor_1": "..." }
    ]
  },
  "sikap": {
     "deskripsi": "Rubrik observasi sikap profil pelajar pancasila...",
     "indikator": ["Beriman dan Bertakwa", "Mandiri", "Bernalar Kritis", "Kreatif", "Gotong Royong", "Kebhinekaan Global"],
     "catatan": "Panduan pengisian jurnal sikap..."
  }
}

Pastikan rubrik RELEVAN dengan kegiatan pembelajaran di RPP yang sudah dibuat untuk topik ${topik} kelas ${jenjangKelas || ''}.
Wajib mengisi minimal 4-5 baris tabel untuk kognitif dan keterampilan.`;

    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash'
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;
    const result = await ai.generateJSON(prompt, preferredSlug);
    return successResponse(c, result);
  } catch (e: any) {
    console.error('Lampiran Gen Error:', e);
    return Errors.internal(c, e.message);
  }
});

// Save RPP
rpp.post('/save', async (c) => {
  try {
    const body = await c.req.json();
    const user: any = c.get('user' as any);
    const {
      mataPelajaran, topik, jenjangKelas, semester, alokasiWaktu, strategi,
      content, inputData
    } = body;

    const result = await c.env.DB.prepare(`
      INSERT INTO rpp_history (
        user_id, mata_pelajaran, topik, jenjang_kelas, semester, alokasi_waktu, strategi,
        content_json, input_data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).bind(
      user?.id || 1,
      mataPelajaran, topik, jenjangKelas, semester, alokasiWaktu, strategi,
      JSON.stringify(content), JSON.stringify(inputData)
    ).run();

    return successResponse(c, { id: result.results[0].id }, 'RPP saved successfully');
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

// Get History
rpp.get('/history', async (c) => {
  try {
    const user: any = c.get('user' as any);
    const result = await c.env.DB.prepare(`
      SELECT id, mata_pelajaran, topik, jenjang_kelas, created_at 
      FROM rpp_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user?.id || 1).all();
    return successResponse(c, result.results);
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

// Get Detail
rpp.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare(`SELECT * FROM rpp_history WHERE id = ?`).bind(id).first();
    if (!result) return Errors.notFound(c, 'RPP not found');
    result.content_json = JSON.parse(result.content_json as string);
    result.input_data_json = JSON.parse(result.input_data_json as string);
    return successResponse(c, result);
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

export default rpp;
