import { Hono } from 'hono';
import { AIService, AIProvider } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import { generateRppBuffer, type RppInputData, type RppContentData } from '../lib/docx-generator';
import { cpData } from '../lib/cp-data';
import { getCookie, getCurrentUser } from '../lib/auth';

type Bindings = {
  DB: D1Database;
  MISTRAL_API_KEY?: string;
  Z_AI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  VERTEX_API_KEY?: string;
};

const rpp = new Hono<{ Bindings: Bindings }>();

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

    // Inject keys from admin settings (DB) with fallback from env
    const settingsResult: any = await c.env.DB.prepare(
      "SELECT key, value FROM settings WHERE key IN ('mistral_api_key', 'z_ai_api_key', 'gemini_api_key', 'groq_api_key', 'vertex_api_key')"
    ).all();

    const settings: any = {};
    settingsResult.results?.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    const mistralKey = settings.mistral_api_key || c.env.MISTRAL_API_KEY;
    const zAiKey = settings.z_ai_api_key || c.env.Z_AI_API_KEY;
    const geminiKey = settings.gemini_api_key || c.env.GEMINI_API_KEY;
    const groqKey = settings.groq_api_key || c.env.GROQ_API_KEY;
    const vertexKey = settings.vertex_api_key || c.env.VERTEX_API_KEY;

    if (mistralKey) ai.addKey('mistral', mistralKey);
    if (zAiKey) ai.addKey('z_ai', zAiKey);
    if (geminiKey) ai.addKey('gemini', geminiKey);
    if (groqKey) ai.addKey('groq', groqKey);
    if (vertexKey) ai.addKey('vertex', vertexKey);

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

    // Logika pemilihan CP berdasarkan Fase dan Mata Pelajaran
    const getMatchedCP = () => {
      if (capaianPembelajaran) return capaianPembelajaran; // Prioritas input manual user

      const normalizedSubject = (mataPelajaran || '').toLowerCase();
      const fase = (() => {
        const k = (jenjangKelas || '').toLowerCase();
        if (k.includes('1') || k.includes('2')) return 'Fase A';
        if (k.includes('3') || k.includes('4')) return 'Fase B';
        if (k.includes('5') || k.includes('6')) return 'Fase C';
        return null;
      })();

      if (fase) {
        const subjectKeys = Object.keys(cpData);
        const matchedKey = subjectKeys.find(key => {
          const lowerKey = key.toLowerCase();
          return normalizedSubject.includes(lowerKey) || lowerKey.includes(normalizedSubject) ||
                 (lowerKey.includes('agama') && normalizedSubject.includes('agama')) ||
                 (lowerKey.includes('pancasila') && normalizedSubject.includes('pancasila')) ||
                 (lowerKey.includes('ipas') && normalizedSubject.includes('ipas')) ||
                 (lowerKey.includes('seni') && normalizedSubject.includes('seni'));
        });

        if (matchedKey && cpData[matchedKey][fase]) {
          return cpData[matchedKey][fase];
        }
      }
      return null;
    };

    const baseCP = getMatchedCP();
    const userCP = baseCP
      ? `Gunakan Capaian Pembelajaran Fase ${ (jenjangKelas || '').includes('1') || (jenjangKelas || '').includes('2') ? 'A' : (jenjangKelas || '').includes('3') || (jenjangKelas || '').includes('4') ? 'B' : 'C' } berikut sebagai dasar: "${baseCP}". Sesuaikan CP ini agar sangat spesifik dan relevan dengan topik "${topik}".`
      : "Buatlah Capaian Pembelajaran (CP) yang sesuai dengan Kurikulum Merdeka secara otomatis untuk mata pelajaran dan topik ini.";

    const profileDimensions = Array.isArray(profilLulusan)
      ? profilLulusan.join(', ')
      : (profilLulusan || '');

    const prompt = `
      Bertindaklah sebagai ahli kurikulum Deep Learning & Understanding by Design (UbD).
      Tugas Anda adalah menyusun RPP (Rencana Pelaksanaan Pembelajaran) yang SANGAT MENDALAM, NARATIF, dan REFLEKTIF.
      
      JANGAN PERNAH membuat ringkasan. Konten harus "siap ajar" dan sangat detail (scripted lesson plan).

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

      BAGIAN 1: IDENTIFIKASI (WAJIB NARATIF PANJANG)
      - Analisis kesiapan belajar siswa: Tulis minimal 150 kata yang menggambarkan level kognitif siswa saat ini, miskonsepsi yang mungkin terjadi, dan prasyarat pengetahuan.
      - Karakteristik gaya belajar: Tulis minimal 100 kata tentang sebaran gaya belajar (visual/auditori/kinestetik) dan implikasinya di kelas ini.
      - Kebutuhan khusus: Jelaskan kebutuhan emosional atau dukungan khusus yang relevan dengan topik ${topik}.

      BAGIAN 2: DESAIN PEMBELAJARAN
      - ${userCP}
      - Deskripsi Strategi: Jelaskan bagaimana ${strategi} akan diterapkan langkah demi langkah.
      - Profil Lulusan: ${profileDimensions}. Jelaskan bagaimana dimensi ini akan dilatih.
      - Diferensiasi:
        * Visual: Sebutkan media spesifik (gambar/video/diagram) yang akan dipakai.
        * Auditori: Sebutkan kegiatan diskusi atau penjelasan lisan spesifik.
        * Kinestetik: Sebutkan aktivitas fisik atau manipulasi benda konkret yang dilakukan.
      - Tujuan Pembelajaran (TP): Minimal 3 TP per pertemuan (1 LOTS, 2 HOTS). Gunakan Kata Kerja Operasional (KKO) yang terukur.

      BAGIAN 3: SKENARIO PEMBELAJARAN (INTI GENERATED RPP)
      Ini adalah bagian terpenting. Untuk SETIAP PERTEMUAN, buat skenario naratif yang sangat detail dengan alur:

      1. PENDAHULUAN (Minimal 100 kata)
         - Sapaan, doa, absensi, ice breaking (sebutkan nama ice breaking-nya).
         - Apersepsi: Pertanyaan pemantik apa yang diajukan guru? Bagaimana respon siswa?
         - Penyampaian tujuan dan manfaat pembelajaran.

      2. MINDFUL (BERKESADARAN) - Minimal 150 kata
         - Narasi bagaimana guru mengajak siswa hadir utuh (mindfulness practice).
         - Kegiatan observasi atau stimulasi awal.
         - Tuliskan DIALOG atau instruksi verbal guru secara spesifik.

      3. MEANINGFUL (BERMAKNA) - Minimal 200 kata
         - Ini adalah inti materi. Bagaimana siswa mengonstruksi pemahaman?
         - Aktivitas kolaborasi, diskusi, atau eksperimen.
         - Jelaskan "aha moment" yang diharapkan terjadi.
         - Kaitkan materi dengan kehidupan nyata siswa secara konkret.

      4. JOYFUL (MENGGEMBIRAKAN) - Minimal 150 kata
         - Aktivitas perayaan pemahaman (presentasi menarik, game, kuis interaktif).
         - Refleksi yang menyenangkan.
         - Apresiasi guru terhadap kinerja siswa.

      5. PENUTUP (Minimal 100 kata)
         - Kesimpulan bersama.
         - Refleksi 1 menit.
         - Tindak lanjut untuk pertemuan berikutnya.
         - Doa penutup.

      ATURAN KERAS (STRICT RULES):
      1. FORMAT STEP-BY-STEP: WAJIB memecah narasi menjadi poin-poin daftar kegiatan yang diawali simbol "- ". JANGAN menulis dalam satu paragraf blok besar.
      2. KUALITAS PER POIN: Setiap poin strip harus MENDETAIL (minimal 2-3 kalimat per poin). Jangan buat poin pendek. Contoh benar:
         "- Guru memulai sesi dengan menyapa siswa secara antusias, mengecek kehadiran, lalu mengajak siswa melakukan ice breaking 'Tebak Gaya' untuk mencairkan suasana."
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
          "kebutuhan": "Kebutuhan utama siswa..."
        },
        "desain": {
          "capaian": "Capaian Pembelajaran...",
          "metode_relevan": "Daftar metode...",
          "metode_pembelajaran": "Detail metode...",
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
              "aktivitas": "Instruksi kerja siswa...",
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
      - identitas_petunjuk: Tuliskan cara siswa mengerjakan LKPD ini.
      - tujuan_siswa: Tuliskan tujuan pembelajaran yang ramah anak.
      - masalah: Berikan narasi masalah yang menantang.
      - aktivitas: Berikan langkah 1, 2, 3 untuk dikerjakan siswa.
      - hasil_kerja: Berikan panduan apa yang harus ditulis di lembar jawaban.
      - penilaian: Wajib berikan minimal 5 soal (pilihan ganda atau esai).
    `;

    const result = await ai.generateJSON(prompt, aiProvider as AIProvider || 'mistral');

    // Remove LKPD if user selected 'Tidak'
    if (lampirkanLKPD !== 'Ya' && result?.pertemuan) {
      result.pertemuan.forEach((p: any) => delete p.lkpd);
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('RPP Gen Error:', e);
    return Errors.internal(c, e.message);
  }
});

// Download RPP as DOCX (server-side generation)
rpp.post('/docx', async (c) => {
  try {
    const body = await c.req.json();
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    const { inputData, content, kopSuratUrl, lampiran } = body;
    
    if (user && !inputData.jabatanGuru) {
      inputData.jabatanGuru = user.mata_pelajaran || user.role;
    }

    if (!inputData || !content) {
      return Errors.badRequest(c, 'inputData dan content wajib diisi');
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

    const mata = String(inputData.mataPelajaran || 'RPP').replace(/\s+/g, '_');
    const topikStr = String(inputData.topik || 'Topik').replace(/\s+/g, '_');
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

    const result = await ai.generateJSON(prompt, aiProvider as AIProvider || 'mistral');
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
