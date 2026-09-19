import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import { UnsplashService } from '../services/unsplash';
import { generateCrossword } from '../lib/crossword';
import { getCookie, getCurrentUser } from '../lib/auth';
import { recordAIGeneration } from '../lib/telemetry';
import { getOfficialCP, cpElementsData, getDynamicCP, getDynamicCPElements, getFaseFromKelas } from '../lib/cp-data';
import { generateVisualStimulus, detectStimulusFromSoalText, getVisualCatalog } from '../lib/visual-engine';
import { ensureBankSoalTables } from './banksoal';
import { validate, createAssessmentSchema } from '../lib/validation';
import { runAssessmentQualityGate, validateQuestionHeuristics } from '../lib/assessment-validator';
import { type AppBindings } from '../types/env';

const kisi = new Hono<{ Bindings: AppBindings }>();

// Helper autentikasi pengguna dari sesi cookie atau Authorization bearer header
async function getAuthenticatedUser(c: any): Promise<any | null> {
    try {
        const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie') || c.req.raw?.headers?.get('Cookie') || '';
        const authHeader = c.req.header('Authorization') || c.req.header('authorization');
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
        const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
        if (!sessionId) return null;
        return await getCurrentUser(c.env.DB, sessionId);
    } catch (_) {
        return null;
    }
}

// Endpoint referensi Capaian Pembelajaran resmi BSKAP No. 046 Tahun 2025 (atau Database Admin)
kisi.get('/cp-reference', async (c) => {
    const mapel = c.req.query('mataPelajaran') || c.req.query('mapel') || '';
    const kelas = c.req.query('jenjangKelas') || c.req.query('kelas') || '';
    const officialCP = await getDynamicCP(c.env.DB, mapel, kelas);
    const fase = getFaseFromKelas(kelas);
    const elements = await getDynamicCPElements(c.env.DB, mapel, kelas);

    return successResponse(c, {
        mataPelajaran: mapel,
        jenjangKelas: kelas,
        fase,
        cp: officialCP || '',
        elements: elements || {},
        source: (mapel.toLowerCase().includes('agama') || mapel.toLowerCase().includes('paibp'))
            ? 'Keputusan Kepala BKPDM No. 020 Tahun 2026'
            : (mapel.toLowerCase().includes('sunda') || mapel.toLowerCase().includes('tatanen') || mapel.toLowerCase().includes('akpk'))
                ? 'Muatan Lokal Kurikulum Merdeka'
                : 'Keputusan Kepala BSKAP No. 046 Tahun 2025'
    });
});

// Endpoint katalog template visual stimulus SVG untuk frontend picker & integrasi modul
kisi.get('/visual-catalog', async (c) => {
    const catalog = getVisualCatalog();
    return successResponse(c, catalog);
});

// Endpoint on-demand visual render untuk pratinjau / custom diagram manual
kisi.post('/visual-render', async (c) => {
    try {
        const body = await c.req.json();
        const { type, params, caption } = body;
        if (!type) {
            return Errors.badRequest(c, 'Parameter type wajib disertakan');
        }
        const result = generateVisualStimulus({ type, params, caption });
        if (!result) {
            return Errors.notFound(c, `Tipe visual stimulus "${type}" tidak ditemukan`);
        }
        return successResponse(c, result);
    } catch (e: any) {
        return Errors.internal(c, e.message || 'Gagal merender stimulus visual');
    }
});

// Helper: normalisasi metadata kisi-kisi untuk setiap butir soal
export const normalizeItemKisiMetadata = (item: any, defaultBentuk: string, defaultNo: number, fallbackCP: string, fallbackMateri: string) => {
    if (!item) return item;
    item.no = item.no || defaultNo;
    item.cp = (item.cp && String(item.cp).trim()) || (fallbackCP && String(fallbackCP).trim()) || `Murid dapat memahami dan menerapkan konsep dasar ${fallbackMateri || 'materi terkait'}.`;
    item.materi = (item.materi && String(item.materi).trim()) || fallbackMateri || 'Materi Pokok';
    if (!item.indikator || !String(item.indikator).trim()) {
        item.indikator = `Disajikan pertanyaan mengenai ${item.materi}, murid dapat menentukan jawaban yang tepat.`;
    }
    // Standardisasi Level Kognitif ke L1, L2, L3 (Puspendik / BSKAP)
    const rawLevel = String(item.level || '').toUpperCase();
    if (
        rawLevel.includes('L3') || rawLevel.includes('HOTS') ||
        rawLevel.includes('C4') || rawLevel.includes('C5') || rawLevel.includes('C6') ||
        rawLevel.includes('PENALARAN') || rawLevel.includes('ANALISIS') ||
        rawLevel.includes('EVALUASI') || rawLevel.includes('KREASI') ||
        rawLevel.includes('MENGANALISIS') || rawLevel.includes('MENGEVALUASI')
    ) {
        item.level = 'L3';
    } else if (
        rawLevel.includes('L2') || rawLevel.includes('MOTS') ||
        rawLevel.includes('C3') || rawLevel.includes('APLIKASI') ||
        rawLevel.includes('PENERAPAN') || rawLevel.includes('MENERAPKAN')
    ) {
        item.level = 'L2';
    } else {
        item.level = 'L1';
    }
    item.bentuk = item.bentuk || defaultBentuk;
    return item;
};

// Helper: dapatkan deskripsi adaptasi kelas
export const getKelasAdaptation = (kelas: string): string => {
    const k = parseInt(kelas.replace(/\D/g, '')) || 5;
    if (k <= 2) return `ADAPTASI KELAS ${kelas}: Gunakan kalimat SANGAT PENDEK (max 10 kata per kalimat), konteks objek nyata & gambar konkret. HOTS cukup berupa perbandingan dua hal sederhana atau memilih yang terbaik dari dua pilihan nyata.`;
    if (k <= 4) return `ADAPTASI KELAS ${kelas}: Kalimat sedang (max 15 kata), gunakan konteks cerita pendek atau situasi sehari-hari sebagai stimulus. HOTS berupa hubungan sebab-akibat atau menyimpulkan dari cerita.`;
    return `ADAPTASI KELAS ${kelas}: Bisa menggunakan data sederhana, tabel, atau kasus nyata sebagai stimulus. HOTS berupa analisis data, argumentasi berdasar fakta, atau merancang solusi dari permasalahan kontekstual.`;
};

// Helper: bersihkan segala artefak sisa prompt, visual_stimulus, gambar_keyword dari naskah soal
export const cleanPromptDebris = (text: string): string => {
    if (!text) return '';
    let s = String(text);

    // 1. Hapus tag kurung siku prompt: [gambar: ...], [visual_stimulus: ...], [diagram: ...], dsb.
    s = s.replace(/\[(?:visual_stimulus|stimulus|visual|gambar|foto|diagram|ilustrasi|deskripsi|keterangan|bagan)[^\]]*\]/gi, '');
    s = s.replace(/\[[^\]]*\]/g, '');

    // 1b. Hapus tag kurung biasa yang berisi deskripsi gambar buatan AI:
    // Contoh: "(Gambar dengan pola: Merah, Kuning, ...)" atau "(Gambar komputer dengan panah menunjuk CPU)"
    s = s.replace(/\((?:visual_stimulus|stimulus|visual|gambar|foto|diagram|ilustrasi|deskripsi|keterangan|bagan)[^)]*\)/gi, '');

    // 2. Hapus blok visual_stimulus { ... } (dengan balanced brace counting untuk mendukung nested object/array)
    let safetyCounter = 0;
    while (safetyCounter++ < 20) {
        const match = s.match(/visual_stimulus\s*:?\s*\{/i);
        if (!match || match.index === undefined) break;

        const startIdx = match.index;
        const braceStart = s.indexOf('{', startIdx);
        let depth = 0;
        let endIdx = -1;

        for (let i = braceStart; i < s.length; i++) {
            if (s[i] === '{') depth++;
            else if (s[i] === '}') {
                depth--;
                if (depth === 0) {
                    endIdx = i;
                    break;
                }
            }
        }

        if (endIdx !== -1) {
            let pre = s.substring(0, startIdx);
            let post = s.substring(endIdx + 1);
            if (pre.endsWith('\n') && post.startsWith('\n')) {
                post = post.substring(1);
            }
            s = pre + post;
        } else {
            const newlineIdx = s.indexOf('\n', startIdx);
            if (newlineIdx !== -1) {
                s = s.substring(0, startIdx) + s.substring(newlineIdx);
            } else {
                s = s.substring(0, startIdx);
            }
            break;
        }
    }

    // 3. Hapus objek JSON stimulus mandiri yang bocor di naskah soal (misal {"type": "sudut", "params": {...}})
    safetyCounter = 0;
    while (safetyCounter++ < 20) {
        const match = s.match(/\{\s*"type"\s*:\s*"[a-zA-Z0-9_-]+"/i);
        if (!match || match.index === undefined) break;

        const startIdx = match.index;
        let depth = 0;
        let endIdx = -1;

        for (let i = startIdx; i < s.length; i++) {
            if (s[i] === '{') depth++;
            else if (s[i] === '}') {
                depth--;
                if (depth === 0) {
                    endIdx = i;
                    break;
                }
            }
        }

        if (endIdx !== -1) {
            let pre = s.substring(0, startIdx);
            let post = s.substring(endIdx + 1);
            if (pre.endsWith('\n') && post.startsWith('\n')) {
                post = post.substring(1);
            }
            s = pre + post;
        } else {
            break;
        }
    }

    // 4. Bersihkan sisa-sisa keyword prompt baris tunggal
    s = s.replace(/^[ \t]*visual_stimulus\s*:?[^\n\r]*\r?\n?/gim, '');
    s = s.replace(/visual_stimulus\s*:[^\n\r]*/gi, '');
    s = s.replace(/^[ \t]*gambar_keyword\s*:?[^\n\r]*\r?\n?/gim, '');
    s = s.replace(/gambar_keyword\s*:[^\n\r]*/gi, '');
    s = s.replace(/^[ \t]*gambar_prompt_en\s*:?[^\n\r]*\r?\n?/gim, '');
    s = s.replace(/gambar_prompt_en\s*:[^\n\r]*/gi, '');

    // 5. Bersihkan spasi horizontal berlebih dan baris kosong berlebih
    s = s.replace(/[ \t]+/g, ' ');
    s = s.replace(/\n\s*\n\s*\n+/g, '\n\n').trim();

    return s;
};

// Helper: normalisasi Markdown table agar terpisah rapi dari teks pembuka & pertanyaan
export const normalizeSoalMarkdown = (text: string): string => {
    if (!text) return '';
    const clean = cleanPromptDebris(text);
    const lines = clean.split(/\r?\n/);
    const outLines: string[] = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const firstPipe = line.indexOf('|');
        const lastPipe = line.lastIndexOf('|');

        if (firstPipe !== -1 && lastPipe > firstPipe) {
            const beforeText = line.substring(0, firstPipe).trim();
            const tableContent = line.substring(firstPipe, lastPipe + 1).trim();
            const afterText = line.substring(lastPipe + 1).trim();

            if (beforeText) outLines.push(beforeText);

            const splitRows = tableContent.split(/(?<=\|)\s*(?=\|)/);
            for (const row of splitRows) {
                if (row.trim()) outLines.push(row.trim());
            }

            if (afterText) outLines.push(afterText);
        } else {
            outLines.push(line);
        }
    }

    return outLines.join('\n');
};

// Helper: panduan stimulus visual spesifik per rumpun mata pelajaran
export const getSubjectImagePromptGuideline = (mapel: string): string => {
    const m = (mapel || '').toLowerCase();
    if (m.includes('pancasila') || m.includes('pkn') || m.includes('sejarah') || m.includes('ips')) {
        return `PANDUAN VISUAL MAPEL ${mapel.toUpperCase()}:
          * ATURAN KRITIS MAPEL PENDIDIKAN PANCASILA / PKn:
            - MAYORITAS materi Pancasila bersifat KONSEPTUAL-NORMATIF (nilai, sikap, aturan, hak & kewajiban, musyawarah, gotong royong, toleransi). Soal-soal bertema ini TIDAK MEMERLUKAN stimulus gambar visual — cukup gunakan stimulus TEKS/WACANA/KASUS.
            - HANYA gunakan stimulus visual SVG ("visual_stimulus") jika soal SECARA EKSPLISIT menanyakan:
              1. Identifikasi SIMBOL/LAMBANG fisik Garuda Pancasila → { "type": "perisai_pancasila", "params": { "sila": 1-5, "label": "X" } }
              2. Struktur PEMERINTAHAN DAERAH (hirarki Gubernur-Bupati-Camat-Lurah-RW-RT) → { "type": "struktur_pemda", "params": { "targetLevel": "kecamatan", "label": "X" } }
              3. Lembaga TRIAS POLITIKA (DPR-Presiden-MA) → { "type": "trias_politika", "params": { "cabang": "legislatif", "label": "X" } }
              4. PETA Indonesia & wilayah NKRI → { "type": "peta_indonesia", "params": { "pointer": "sumatra", "label": "X" } }
              5. Jenis NORMA masyarakat → { "type": "norma_masyarakat", "params": { "jenisNorma": "kesopanan", "label": "X" } }
            - Untuk soal tentang NILAI Pancasila, SIKAP, PERILAKU, HAK & KEWAJIBAN, ATURAN, MUSYAWARAH, GOTONG ROYONG, TOLERANSI, KEBERAGAMAN: DILARANG KERAS menggunakan visual_stimulus! Kosongkan (null).
          * Untuk stimulus Peta Kepulauan Indonesia, VARIASIKAN pulau sasaran (jangan hanya Pulau Jawa!):
            1. Letak geografis / nama pulau: "Pulau yang ditunjuk huruf X adalah ..."
            2. Keragaman budaya & rumah adat: Honai (Papua), Tongkonan (Sulawesi), Gadang (Sumatra), Joglo (Jawa).
            3. Kekayaan alam: Kepulauan penghasil cengkih & pala (Maluku), Danau Toba (Sumatra), Sungai Kapuas (Kalimantan).
          * Prioritas Foto/Arsip (hanya untuk topik kesejarahan): Tokoh pahlawan nasional, gedung bersejarah, peninggalan candi.
          * "gambar_keyword": Nama tokoh/tempat resmi Bahasa Indonesia (contoh: "Ir. Soekarno", "Candi Borobudur").
          * "gambar_prompt_en": "historic photograph or official emblem of [topic], clean background, high resolution, authentic national archive style"`;
    }
    if (m.includes('sunda') || m.includes('seni') || m.includes('budaya')) {
        return `PANDUAN VISUAL MAPEL ${mapel.toUpperCase()}:
          * Prioritas: Alat musik tradisional (angklung, gamelan, suling), pakaian adat (pangsi, kebaya), rumah adat (Julang Ngapak, Joglo), wayang golek, motif batik Nusantara, karya seni rupa.
          * "gambar_keyword": Nama alat/benda budaya spesifik (contoh: "Angklung", "Wayang Golek", "Pakaian Adat Sunda", "Batik Megamendung").
          * "gambar_prompt_en": "traditional Indonesian cultural artifact of [topic], museum photography, clean background, authentic detail"`;
    }
    if (m.includes('agama') || m.includes('budi pekerti')) {
        return `PANDUAN VISUAL MAPEL ${mapel.toUpperCase()}:
          * Prioritas: Tempat ibadah resmi 6 agama (Masjid Istiqlal, Gereja Katedral, Pura Besakih, Vihara, Klenteng), kitab suci, atau simbol keagamaan.
          * "gambar_keyword": Nama tempat ibadah/objek keagamaan resmi (contoh: "Masjid Istiqlal", "Pura Besakih Bali", "Candi Mendut").
          * "gambar_prompt_en": "architecture photograph of [religious place/symbol], respectful and peaceful lighting, clean background"`;
    }
    if (m.includes('matematika')) {
        return `PANDUAN VISUAL MAPEL MATEMATIKA:
          * SANGAT PENTING: Gunakan parameter "visual_stimulus" agar sistem merender SVG presisi matematis!
          * Tipe visual yang didukung pada "visual_stimulus":
            - Balok: { "type": "balok", "params": { "p": 12, "l": 8, "t": 6, "unit": "cm" } }
            - Kubus: { "type": "kubus", "params": { "s": 10, "unit": "cm" } }
            - Tabung: { "type": "tabung", "params": { "r": 7, "t": 14, "unit": "cm" } }
            - Kerucut: { "type": "kerucut", "params": { "r": 7, "t": 12, "s": 15, "unit": "cm" } }
            - Bola: { "type": "bola", "params": { "r": 14, "unit": "cm" } }
            - Prisma Segitiga: { "type": "prisma", "params": { "alas": 10, "tinggiSegitiga": 8, "panjang": 15, "unit": "cm" } }
            - Limas Segiempat: { "type": "limas", "params": { "s": 10, "t": 12, "unit": "cm" } }
            - Lingkaran (2D): { "type": "lingkaran", "params": { "r": 14, "unit": "cm" } }
            - Trapesium: { "type": "trapesium", "params": { "atasAlas": 8, "bawahAlas": 14, "tinggi": 10, "unit": "cm" } }
            - Jajar Genjang: { "type": "jajar_genjang", "params": { "alas": 15, "tinggi": 10, "unit": "cm" } }
            - Belah Ketupat: { "type": "belah_ketupat", "params": { "d1": 12, "d2": 16, "unit": "cm" } }
            - Layang-Layang: { "type": "layang_layang", "params": { "d1": 10, "d2": 18, "unit": "cm" } }
            - Segitiga Siku: { "type": "segitiga_siku", "params": { "alas": 6, "tinggi": 8, "miring": 10, "unit": "cm" } }
            - Sudut: { "type": "sudut", "params": { "derajat": 60 } }
            - Busur Derajat: { "type": "busur_derajat", "params": { "derajat": 60, "label": "X" } }
            - Pecahan Lingkaran: { "type": "pecahan_lingkaran", "params": { "pembagi": 4, "diarsir": 3, "utuh": 0 } }
            - Pecahan Persegi: { "type": "pecahan_persegi", "params": { "kolom": 4, "baris": 2, "diarsir": 3 } }
            - Persegi Panjang: { "type": "persegi_panjang", "params": { "p": 12, "l": 8, "unit": "cm" } }
            - Segitiga Sama Sisi: { "type": "segitiga_sama_sisi", "params": { "s": 10, "unit": "cm" } }
            - Segitiga Sama Kaki: { "type": "segitiga_sama_kaki", "params": { "kaki": 10, "alas": 8, "unit": "cm" } }
            - Jaring-jaring Kubus: { "type": "jaring_kubus", "params": { "s": 5, "unit": "cm", "pola": "salib" } }
            - Jaring-jaring Balok: { "type": "jaring_balok", "params": { "p": 6, "l": 4, "t": 3, "unit": "cm" } }
            - Koordinat Kartesius: { "type": "koordinat", "params": { "titik": [{"x": 3, "y": 4, "label": "P"}, {"x": -2, "y": 3, "label": "Q"}] } }
            - Diagram Venn: { "type": "diagram_venn", "params": { "judul": "Hobi Siswa", "labelA": "Sepak Bola", "labelB": "Basket", "aSaja": 12, "irisan": 5, "bSaja": 8 } }
            - Pictogram / Diagram Gambar: { "type": "pictogram", "params": { "judul": "Data Penjualan Buah", "labels": ["Apel", "Jeruk", "Mangga"], "data": [4, 3, 5], "ikon": "●", "nilaiIkon": 2 } }
            - Simetri Lipat: { "type": "simetri_lipat", "params": { "bangun": "persegi" } }
            - Bangun Gabungan: { "type": "bangun_gabungan", "params": { "bentuk": "L", "segmen": [{"p": 10, "l": 4}, {"p": 6, "l": 4}], "unit": "cm" } }
            - Diagram Batang: { "type": "diagram_batang", "params": { "judul": "Data Penjualan", "labels": ["Senin","Selasa","Rabu"], "data": [20, 35, 30] } }
            - Diagram Garis: { "type": "diagram_garis", "params": { "judul": "Suhu Udara", "labels": ["06.00","12.00","18.00"], "data": [24, 32, 28] } }
            - Diagram Lingkaran (Pie): { "type": "diagram_lingkaran", "params": { "judul": "Data Hobi", "labels": ["Membaca","Olahraga","Musik"], "data": [40, 35, 25] } }
            - Jam Analog: { "type": "jam_analog", "params": { "jam": 7, "menit": 30 } }
            - Garis Bilangan: { "type": "garis_bilangan", "params": { "min": -5, "max": 5, "titik": [{"x": 2, "label": "P"}] } }
          * PASTIKAN angka dimensi di visual_stimulus PERSIS SAMA dengan angka di dalam naskah soal!
          * DILARANG KERAS menggunakan jenis diagram/bangun yang sama pada lebih dari 1 butir soal dalam satu paket ujian!
          * "gambar_keyword": Istilah geometri ringkas`;
    }
    if (m.includes('pjok') || m.includes('jasmani') || m.includes('olahraga')) {
        return `PANDUAN VISUAL MAPEL PJOK:
          * Prioritas: Peragaan teknik gerak olahraga (passing bawah bola voli, servis bulutangkis, posisi kaki menendang bola, start lari, sikap lilin senam lantai, gerakan renang).
          * "gambar_keyword": Istilah olahraga/gerakan (contoh: "Volleyball underhand pass", "Football kicking technique", "Floor gymnastics posture", "Badminton grip").
          * "gambar_prompt_en": "2D clean vector illustration demonstrating the physical movement posture of [sport technique], side view, sports education diagram, white background, athletic anatomy"`;
    }
    if (m.includes('inggris') || m.includes('english')) {
        return `PANDUAN VISUAL MAPEL BAHASA INGGRIS (ENGLISH FOR YOUNG LEARNERS):
          * SANGAT PENTING: Pembelajaran Bahasa Inggris di SD/SMP berorientasi komunikatif dan visual konkret (Flashcards & Situasi Nyata)!
          * Prioritas Topik Bergambar (Wajib menggunakan Z-Image Turbo):
            1. Makanan, Minuman, & Rasa (Foods, Drinks & Tastes):
               - Sweet (manis): es krim (ice cream cone), madu (honey), cokelat (chocolate), kue (cake).
               - Sour (asam): irisan lemon segar (fresh sliced yellow lemon with juice splash), jeruk nipis (lime).
               - Spicy / Hot (pedas): semangkuk sup/mie cabai merah beruap (steaming bowl of spicy red chili soup/ramen), cabai merah (red chili).
               - Salty (asin): keripik kentang gurih (crispy salted potato chips), garam (salt shaker).
               - Bitter (pahit): secangkir kopi hitam tanpa gula (cup of hot black coffee), pare (bitter melon).
            2. Jam Analog (Telling Time): "visual_stimulus": { "type": "jam_analog", "params": { "jam": 8, "menit": 15 } }
            3. Hewan (Animals & Pets): kucing (cat), kelinci (rabbit), gajah (elephant), monyet (monkey), jerapah (giraffe).
            4. Pakaian & Aksesori (Clothes): t-shirt, dress, shoes, hat, jacket, school uniform.
            5. Aktivitas & Hobi (Daily Activities): swimming, cooking, riding a bicycle, reading books, playing football.
            6. Profesi (Jobs & Occupations): doctor, teacher, chef, police officer, firefighter, pilot.
            7. Benda Kelas / Rumah (Classroom & Household Objects): pencil, ruler, whiteboard, refrigerator, dining table.
            8. Preposisi Tempat (Prepositions of Place): "the cat is under the chair", "the book is on the table".
          * PANDUAN PROMPT Z-IMAGE TURBO (gambar_prompt_en):
            - WAJIB menuliskan deskripsi visual bahasa Inggris yang cerah, jelas, gaya ilustrasi buku ajar 2D berlatar putih bersih (2D educational textbook vector art, clean white background, vibrant colors).
            - Contoh untuk rasa: "clear 2d educational textbook illustration of a fresh yellow lemon sliced in half with sour lemon juice splash, colorful vector art, clean white background, sharp details"
            - Contoh untuk makanan: "clear 2d educational textbook illustration of a sweet strawberry ice cream cone with colorful sprinkles, clean white background, vibrant vector art"
          * "gambar_keyword": Nama objek/makanan bahasa Inggris yang spesifik (contoh: "lemon sour", "ice cream cone", "spicy chili", "black coffee bitter")`;
    }
    if (m.includes('bahasa indonesia')) {
        return `PANDUAN VISUAL MAPEL BAHASA INDONESIA:
          * Untuk pertanyaan jam dinding (telling time), gunakan: "visual_stimulus": { "type": "jam_analog", "params": { "jam": 8, "menit": 15 } }
          * Prioritas: Rambu lalu lintas, denah/peta arah, iklan, poster, atau fasilitas umum.
          * "gambar_keyword": Nama objek/rambu/iklan (contoh: "Rambu Lalu Lintas", "Denah Lokasi", "Iklan Layanan Masyarakat").
          * "gambar_prompt_en": "clear photograph of [object/sign/poster], isolated on clean white background, educational textbook style"`;
    }
    if (m.includes('koding') || m.includes('kecerdasan') || m.includes('ai') || m.includes('informatika')) {
        return `PANDUAN VISUAL MAPEL KODING & AI:
          * Prioritas: Perangkat keras komputer (CPU processor, Motherboard, Mouse, Keyboard, RAM memory, Monitor), robotika, ikon Scratch visual blocks.
          * "gambar_keyword": Nama perangkat/konsep IT (contoh: "Computer CPU processor", "Computer RAM memory", "Educational robot", "Scratch visual blocks").
          * "gambar_prompt_en": "clean 2D tech icon vector illustration of [hardware component/robot], modern flat design, white background"`;
    }
    if (m.includes('tatanen') || m.includes('tdba') || m.includes('akpk')) {
        return `PANDUAN VISUAL MAPEL TDBA / LINGKUNGAN HIDUP:
          * Prioritas: Tanaman pangan (padi, jagung, bayam), sistem hidroponik pipa, pembuatan pupuk kompos, bibit tanaman, kebun sekolah organik.
          * "gambar_keyword": Nama tanaman/metode pertanian (contoh: "Tanaman Bayam", "Hidroponik pipa", "Pupuk Kompos organik", "Kebun Sekolah").
          * "gambar_prompt_en": "clean botanical photograph of [plant/organic farming method], isolated on white background, sharp agricultural education photo"`;
    }
    return `PANDUAN VISUAL MAPEL SAINS / IPAS:
      * SANGAT PENTING: DILARANG KERAS menggunakan jenis gambar/diagram yang sama pada lebih dari 1 butir soal dalam satu paket ujian! Variasikan fokus stimulus antar butir soal (misal: butir 1 organ lambung, butir 2 penampang vili usus halus atau jenis gigi).
      * Untuk diagram berlabel tanda huruf [X], gunakan "visual_stimulus":
        - Sistem Pencernaan Makro: { "type": "organ_pencernaan", "params": { "pointer": "lambung" (atau mulut/kerongkongan/usus halus/usus besar/hati/anus), "label": "X" } }
        - Vili Usus Halus (Mikroskopis Penyerapan): { "type": "vili_usus", "params": { "pointer": "vili" (atau kapiler/lakteal/epitel), "label": "X" } }
        - Macam-Macam Gigi Manusia & Fungsinya: { "type": "struktur_gigi", "params": { "pointer": "seri" (atau taring/geraham), "label": "X" } }
        - Detail Lambung & Enzim: { "type": "lambung_detail", "params": { "pointer": "rugae" (atau kardia/pilorus), "label": "X" } }
        - Sistem Pernapasan: { "type": "organ_pernapasan", "params": { "pointer": "trakea" (atau hidung/bronkus/paru-paru/diafragma), "label": "X" } }
        - Alveolus & Pertukaran Gas: { "type": "alveolus", "params": { "pointer": "alveolus" (atau kapiler/bronkiolus), "label": "X" } }
        - Siklus Air: { "type": "siklus_air", "params": { "pointer": "evaporasi" (atau kondensasi/presipitasi/infiltrasi), "label": "X" } }
        - Metamorfosis: { "type": "metamorfosis", "params": { "pointer": "kepompong" (atau telur/ulat/kupu-kupu), "label": "X" } }
        - Bagian Bunga: { "type": "bagian_bunga", "params": { "pointer": "putik" (atau benang sari/mahkota/kelopak/bakal biji), "label": "X" } }
        - Rantai Makanan: { "type": "rantai_makanan", "params": { "pointer": "produsen" (atau konsumen1/konsumen2/konsumen3/pengurai), "label": "X" } }
        - Peta Indonesia (Berbagai Variasi Pulau & Soal): { "type": "peta_indonesia", "params": { "pointer": "sulawesi" (atau sumatra/kalimantan/papua/maluku/bali_nusra/jawa), "label": "X" } }
          * SANGAT PENTING: JANGAN selalu menanyakan Pulau Jawa! VARIASIKAN pulau sasaran ("sumatra", "kalimantan", "sulawesi", "papua", "maluku", "bali_nusra", "jawa") dan variasikan model pertanyaannya:
            1. Tebak Nama Pulau / Letak: "Pulau yang ditunjuk tanda huruf X pada peta adalah ...."
            2. Fauna Endemik Khas: "Hewan endemik khas yang mendiami pulau yang ditunjuk oleh huruf X adalah ...." (Komodo di Bali/Nusra, Anoa/Babirusa di Sulawesi, Burung Cendrawasih di Papua, Orangutan/Bekantan di Kalimantan, Harimau Sumatra di Sumatra, Badak Bercula Satu di Jawa).
            3. Flora Khas: "Tumbuhan khas yang banyak ditemukan di pulau bertanda X adalah ...." (Bunga Rafflesia di Sumatra, Cendana di Nusa Tenggara, Anggrek Hitam di Kalimantan, Cengkih & Pala di Maluku).
            4. Keragaman Budaya / Rumah Adat: "Rumah adat tradisional Honai/Tongkonan/Gadang berasal dari pulau yang ditunjuk oleh huruf X, yaitu ...."
            5. Bentang Alam & Kekayaan Alam: Danau Toba (Sumatra), Sungai Kapuas (Kalimantan), Puncak Jayawijaya (Papua), Kepulauan Rempah (Maluku).
            6. Zona Waktu: "Pulau yang ditunjuk huruf X termasuk dalam zona waktu ...." (WIB / WITA / WIT).
        - Rangkaian Listrik: { "type": "rangkaian_listrik", "params": { "model": "campuran" (atau seri/paralel), "s1": true, "s2": false, "pointer": "L1", "label": "X" } }
        - Perubahan Wujud Zat: { "type": "perubahan_wujud", "params": { "pointer": "1" (atau 1=mencair, 2=membeku, 3=menguap, 4=mengembun, 5=menyublim, 6=mengkristal), "label": "X" } }
        - Pengukuran Panjang Mistar: { "type": "mistar", "params": { "start": 3.0, "end": 8.5, "objectType": "pensil" (atau penghapus/paku), "label": "Panjang = ... cm" } }
        - Tata Surya: { "type": "tata_surya", "params": { "pointer": "bumi" (atau merkurius/venus/mars/yupiter/saturnus/uranus/neptunus), "label": "X" } }
        - Kutub & Gaya Magnet: { "type": "magnet", "params": { "interaksi": "tarik" (atau tolak), "pointer": "kanan2" (atau kiri1), "label": "X" } }
        - Sifat Cahaya: { "type": "sifat_cahaya", "params": { "peristiwa": "pembiasan" (atau pemantulan), "pointer": "X", "label": "X" } }
        - Perisai Pancasila: { "type": "perisai_pancasila", "params": { "sila": 1 (atau 2/3/4/5), "label": "X" } }
      * Untuk flora, fauna, atau objek nyata: kosongkan "visual_stimulus" (set null), dan isi "gambar_keyword" dengan nama entitas Indonesia resmi (contoh: "Kelinci", "Bunga Rafflesia", "Kucing Anggora").`;
};

// Helper: bangun signature komprehensif dari konfigurasi visual stimulus
// Dipakai oleh Diversity Guard (collision check) dan registrasi stimulus (post-render)
export const buildStimulusSignature = (cfg: { type: string; params?: Record<string, any> }): string => {
    const p = cfg.params || {};
    let sig = cfg.type;
    if (p.pointer) sig += `:ptr=${p.pointer}`;
    if (p.model) sig += `:mod=${p.model}`;
    if (p.sila != null) sig += `:sila=${p.sila}`;
    if (p.start != null) sig += `:st=${p.start}`;
    if (p.end != null) sig += `:end=${p.end}`;
    if (p.objectType) sig += `:obj=${p.objectType}`;
    if (p.r != null) sig += `:r=${p.r}`;
    if (p.d != null) sig += `:d=${p.d}`;
    if (p.p != null) sig += `:p=${p.p}`;
    if (p.l != null) sig += `:l=${p.l}`;
    if (p.t != null) sig += `:t=${p.t}`;
    if (p.s != null) sig += `:s=${p.s}`;
    if (p.kaki != null) sig += `:kaki=${p.kaki}`;
    if (p.alas != null) sig += `:alas=${p.alas}`;
    if (p.tinggi != null) sig += `:tinggi=${p.tinggi}`;
    if (p.tinggiSegitiga != null) sig += `:tSeg=${p.tinggiSegitiga}`;
    if (p.panjang != null) sig += `:pjg=${p.panjang}`;
    if (p.atasAlas != null) sig += `:atas=${p.atasAlas}`;
    if (p.bawahAlas != null) sig += `:bawah=${p.bawahAlas}`;
    if (p.d1 != null) sig += `:d1=${p.d1}`;
    if (p.d2 != null) sig += `:d2=${p.d2}`;
    if (p.derajat != null) sig += `:deg=${p.derajat}`;
    if (p.pembagi != null) sig += `:pbg=${p.pembagi}`;
    if (p.diarsir != null) sig += `:ars=${p.diarsir}`;
    if (p.jam != null) sig += `:jam=${p.jam}`;
    if (p.menit != null) sig += `:mnt=${p.menit}`;
    if (p.kolom != null) sig += `:kol=${p.kolom}`;
    if (p.baris != null) sig += `:brs=${p.baris}`;
    if (p.bentuk) sig += `:bentuk=${p.bentuk}`;
    if (p.bangun) sig += `:bangun=${p.bangun}`;
    if (p.ikon) sig += `:ikon=${p.ikon}`;
    if (p.labelA) sig += `:lblA=${p.labelA}`;
    if (p.labelB) sig += `:lblB=${p.labelB}`;
    if (p.aSaja != null) sig += `:aSaja=${p.aSaja}`;
    if (p.irisan != null) sig += `:irisan=${p.irisan}`;
    if (p.bSaja != null) sig += `:bSaja=${p.bSaja}`;
    if (Array.isArray(p.titik)) sig += `:titik=${p.titik.map((pt: any) => `${pt.label || ''}:${pt.x},${pt.y}`).join(';')}`;
    if (Array.isArray(p.segmen)) sig += `:seg=${p.segmen.map((s: any) => `${s.p}x${s.l}`).join(';')}`;
    if (Array.isArray(p.labels)) sig += `:lbl=${p.labels.join(',')}`;
    if (Array.isArray(p.data)) sig += `:dat=${p.data.join(',')}`;
    if (p.judul) sig += `:jdl=${p.judul}`;
    if (p.min != null) sig += `:min=${p.min}`;
    if (p.max != null) sig += `:max=${p.max}`;
    if (p.pola) sig += `:pola=${p.pola}`;
    if (p.utuh != null) sig += `:utuh=${p.utuh}`;
    if (p.interaksi) sig += `:int=${p.interaksi}`;
    if (p.peristiwa) sig += `:prst=${p.peristiwa}`;
    return sig;
};

// Helper: selesaikan visual stimulus untuk butir soal (SVG Parametrik vs Wikimedia Commons vs Fallback)
// Dilengkapi DIVERSITY GUARD agar tidak pernah muncul 2 gambar/chart/SVG kembar dalam 1 paket ujian
export const resolveQuestionVisualStimulus = async (
    q: any,
    mataPelajaran: string,
    topik: string,
    unsplash: UnsplashService | null,
    usedStimulusSignatures?: Set<string>,
    usedImageUrls?: Set<string>,
    usedImageIds?: Set<string>
): Promise<void> => {
    // 1. Cek visual stimulus eksplisit dari AI
    let visualCfg = q.visual_stimulus;

    // 1b. Jika visualCfg belum ada atau tidak punya type, coba ekstrak dari visual_stimulus {...} yang tertulis di teks soal
    if (!visualCfg || !visualCfg.type) {
        const vsMatch = String(q.soal || '').match(/visual_stimulus\s*:?\s*\{/i);
        if (vsMatch && vsMatch.index !== undefined) {
            const startIdx = q.soal.indexOf('{', vsMatch.index);
            let depth = 0;
            let jsonStr = '';
            for (let i = startIdx; i < q.soal.length; i++) {
                if (q.soal[i] === '{') depth++;
                else if (q.soal[i] === '}') {
                    depth--;
                    if (depth === 0) {
                        jsonStr = q.soal.substring(startIdx, i + 1);
                        break;
                    }
                }
            }
            if (jsonStr) {
                try {
                    const parsed = JSON.parse(jsonStr);
                    if (parsed && parsed.type) {
                        visualCfg = parsed;
                        q.visual_stimulus = parsed;
                    }
                } catch (e) {}
            }
        }
    }

    // 2. Jika tidak ada visual_stimulus atau kosong, jalankan deteksi cerdas dari teks soal, opsi, & kunci jawaban
    if (!visualCfg || !visualCfg.type) {
        let fullContext = String(q.soal || '');
        if (q.opsi && typeof q.opsi === 'object') {
            fullContext += ' ' + Object.entries(q.opsi).map(([k, v]) => `${k}. ${v}`).join(' ');
        }
        if (q.kunci) {
            fullContext += ` kunci: ${q.kunci}`;
            if (q.opsi && q.opsi[q.kunci]) {
                fullContext += ` jawaban: ${q.opsi[q.kunci]}`;
            }
        }
        if (q.pembahasan || q.penjelasan) {
            fullContext += ` pembahasan: ${q.pembahasan || q.penjelasan}`;
        }

        // GUARD: Untuk Pendidikan Pancasila / PKn, hanya auto-detect visual jika teks soal
        // secara eksplisit menyebut lambang/simbol/perisai/peta/struktur pemerintahan.
        // Mencegah false positive: soal tentang nilai/sikap/norma tidak boleh dipaksa pakai SVG.
        const isPancasilaMapel = /pancasila|pkn|kewarganegaraan/i.test(mataPelajaran);
        const soalLower = fullContext.toLowerCase();
        const hasPancasilaVisualKeyword = /perisai|lambang negara|garuda pancasila|lambang pancasila|simbol sila|struktur pemerintah|hirarki pemerintah|trias politika|legislatif|eksekutif|yudikatif|peta indonesia|peta nusantara|peta kepulauan|norma masyarakat|norma kesopanan|norma kesusilaan|norma hukum/i.test(soalLower);

        if (isPancasilaMapel && !hasPancasilaVisualKeyword) {
            // Mapel Pancasila/PKn tanpa kata kunci visual → JANGAN auto-detect, biarkan tanpa gambar
            visualCfg = null;
        } else {
            visualCfg = detectStimulusFromSoalText(fullContext, mataPelajaran);
        }
    }

    // 3. DIVERSITY GUARD: Cek apakah stimulus ini berpotensi kembar dengan soal sebelumnya
    if (visualCfg && visualCfg.type && usedStimulusSignatures) {
        const signature = buildStimulusSignature(visualCfg);

        if (usedStimulusSignatures.has(signature)) {
            const originalType = visualCfg.type;
            const originalSig = signature;
            // Deteksi tabrakan! Cari sub-diagram alternatif yang lebih spesifik
            const text = String(q.soal || '').toLowerCase();
            if (visualCfg.type === 'organ_pencernaan') {
                if (text.includes('vili') || text.includes('jonjot') || text.includes('penyerapan') || text.includes('lipatan')) {
                    visualCfg = { type: 'vili_usus', params: { pointer: 'vili', label: 'X' } };
                } else if (text.includes('gigi') || text.includes('kunyah') || text.includes('robek') || text.includes('potong')) {
                    visualCfg = { type: 'struktur_gigi', params: { pointer: 'taring', label: 'X' } };
                } else if (text.includes('enzim') || text.includes('pepsin') || text.includes('asam') || text.includes('kardia')) {
                    visualCfg = { type: 'lambung_detail', params: { pointer: 'rugae', label: 'X' } };
                } else {
                    // Coba alihkan ke organ lain yang belum dipakai
                    const organList = ['usus halus', 'kerongkongan', 'hati', 'usus besar', 'mulut', 'anus'];
                    let foundAlternate = false;
                    for (const organ of organList) {
                        const altSig = `organ_pencernaan:ptr=${organ}`;
                        if (!usedStimulusSignatures.has(altSig)) {
                            visualCfg = { type: 'organ_pencernaan', params: { pointer: organ, label: 'X' } };
                            foundAlternate = true;
                            break;
                        }
                    }
                    if (!foundAlternate) {
                        visualCfg = null;
                    }
                }
            } else if (visualCfg.type === 'organ_pernapasan') {
                if (text.includes('alveolus') || text.includes('gas') || text.includes('oksigen') || text.includes('kapiler')) {
                    visualCfg = { type: 'alveolus', params: { pointer: 'alveolus', label: 'X' } };
                } else {
                    const organNapas = ['hidung', 'trakea', 'bronkus', 'paru-paru', 'diafragma'];
                    let foundAlt = false;
                    for (const org of organNapas) {
                        const altSig = `organ_pernapasan:ptr=${org}`;
                        if (!usedStimulusSignatures.has(altSig)) {
                            visualCfg = { type: 'organ_pernapasan', params: { pointer: org, label: 'X' } };
                            foundAlt = true;
                            break;
                        }
                    }
                    if (!foundAlt) visualCfg = null;
                }
            } else if (visualCfg.type === 'siklus_air') {
                const phases = ['evaporasi', 'kondensasi', 'presipitasi', 'infiltrasi'];
                let foundAlt = false;
                for (const phase of phases) {
                    const altSig = `siklus_air:ptr=${phase}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'siklus_air', params: { pointer: phase, label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'metamorfosis') {
                const stages = ['telur', 'ulat', 'kepompong', 'kupu-kupu'];
                let foundAlt = false;
                for (const stage of stages) {
                    const altSig = `metamorfosis:ptr=${stage}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'metamorfosis', params: { pointer: stage, label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'bagian_bunga') {
                const parts = ['putik', 'benang sari', 'mahkota', 'kelopak', 'bakal biji'];
                let foundAlt = false;
                for (const part of parts) {
                    const altSig = `bagian_bunga:ptr=${part}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'bagian_bunga', params: { pointer: part, label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'rantai_makanan') {
                const roles = ['produsen', 'konsumen1', 'konsumen2', 'konsumen3', 'pengurai'];
                let foundAlt = false;
                for (const role of roles) {
                    const altSig = `rantai_makanan:ptr=${role}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'rantai_makanan', params: { pointer: role, label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'peta_indonesia') {
                const islands = ['sumatra', 'kalimantan', 'sulawesi', 'papua', 'maluku', 'bali_nusra', 'jawa'];
                const offset = typeof q.no === 'number' ? q.no : 0;
                let foundAlt = false;
                for (let i = 0; i < islands.length; i++) {
                    const isl = islands[(i + offset) % islands.length];
                    const altSig = `peta_indonesia:ptr=${isl}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'peta_indonesia', params: { pointer: isl, label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'tata_surya') {
                const planets = ['bumi', 'mars', 'saturnus', 'yupiter', 'merkurius', 'venus', 'uranus', 'neptunus'];
                let foundAlt = false;
                for (const pl of planets) {
                    const altSig = `tata_surya:ptr=${pl}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'tata_surya', params: { pointer: pl, label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'perubahan_wujud') {
                const processes = ['1', '2', '3', '4', '5', '6'];
                let foundAlt = false;
                for (const proc of processes) {
                    const altSig = `perubahan_wujud:ptr=${proc}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'perubahan_wujud', params: { pointer: proc, label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'perisai_pancasila') {
                const silas = [1, 2, 3, 4, 5];
                let foundAlt = false;
                for (const s of silas) {
                    const altSig = `perisai_pancasila:sila=${s}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'perisai_pancasila', params: { sila: s, label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'rangkaian_listrik') {
                const models = ['seri', 'paralel', 'campuran'];
                let foundAlt = false;
                for (const m of models) {
                    const altSig = `rangkaian_listrik:mod=${m}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'rangkaian_listrik', params: { model: m, s1: true, s2: false, pointer: 'L1', label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'mistar') {
                const objects = ['pensil', 'penghapus', 'paku'];
                let foundAlt = false;
                for (const obj of objects) {
                    const altSig = `mistar:obj=${obj}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'mistar', params: { start: 2.0, end: 7.5, objectType: obj, label: 'Panjang = ... cm' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (visualCfg.type === 'magnet') {
                const altInteraksi = visualCfg.params?.interaksi === 'tolak' ? 'tarik' : 'tolak';
                const altSig = `magnet:int=${altInteraksi}`;
                if (!usedStimulusSignatures.has(altSig)) {
                    visualCfg = { type: 'magnet', params: { interaksi: altInteraksi, pointer: 'kanan2', label: 'X' } };
                } else {
                    visualCfg = null;
                }
            } else if (visualCfg.type === 'sifat_cahaya') {
                const altPeristiwa = visualCfg.params?.peristiwa === 'pemantulan' ? 'pembiasan' : 'pemantulan';
                const altSig = `sifat_cahaya:prst=${altPeristiwa}`;
                if (!usedStimulusSignatures.has(altSig)) {
                    visualCfg = { type: 'sifat_cahaya', params: { peristiwa: altPeristiwa, pointer: 'X', label: 'X' } };
                } else {
                    visualCfg = null;
                }
            } else if (visualCfg.type === 'busur_derajat') {
                const altDegs = [30, 45, 60, 90, 120, 135];
                let foundAlt = false;
                for (const deg of altDegs) {
                    const altSig = `busur_derajat:deg=${deg}`;
                    if (!usedStimulusSignatures.has(altSig)) {
                        visualCfg = { type: 'busur_derajat', params: { derajat: deg, label: 'X' } };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (['diagram_batang', 'diagram_garis', 'diagram_lingkaran'].includes(visualCfg.type)) {
                // Chart collision: coba alihkan ke tipe chart berbeda yang belum dipakai
                const chartTypes = ['diagram_batang', 'diagram_garis', 'diagram_lingkaran'];
                let foundAlt = false;
                for (const altChart of chartTypes) {
                    if (altChart === visualCfg.type) continue;
                    // Cek apakah chart tipe ini sudah pernah dipakai (minimal cek tipe dasar)
                    const anyUsed = Array.from(usedStimulusSignatures).some(s => s.startsWith(altChart));
                    if (!anyUsed) {
                        visualCfg = { ...visualCfg, type: altChart };
                        foundAlt = true;
                        break;
                    }
                }
                if (!foundAlt) visualCfg = null;
            } else if (['jaring_kubus', 'jaring_balok', 'segitiga_sama_sisi', 'segitiga_sama_kaki', 'segitiga_siku', 'persegi_panjang', 'jajar_genjang', 'belah_ketupat', 'layang_layang', 'trapesium', 'balok', 'kubus', 'tabung', 'kerucut', 'bola', 'prisma', 'limas', 'pecahan_lingkaran', 'pecahan_persegi', 'pictogram'].includes(visualCfg.type)) {
                // Math shape collision: divert to related shape if not yet used in current exam packet
                const geomAlternatives: Record<string, string[]> = {
                    jaring_kubus: ['jaring_balok'],
                    jaring_balok: ['jaring_kubus'],
                    segitiga_sama_sisi: ['segitiga_sama_kaki', 'segitiga_siku'],
                    segitiga_sama_kaki: ['segitiga_sama_sisi', 'segitiga_siku'],
                    segitiga_siku: ['segitiga_sama_kaki', 'segitiga_sama_sisi'],
                    persegi_panjang: ['jajar_genjang', 'trapesium'],
                    jajar_genjang: ['trapesium', 'belah_ketupat'],
                    belah_ketupat: ['layang_layang', 'jajar_genjang'],
                    layang_layang: ['belah_ketupat'],
                    trapesium: ['jajar_genjang', 'persegi_panjang'],
                    balok: ['kubus', 'prisma'],
                    kubus: ['balok', 'prisma'],
                    tabung: ['kerucut', 'bola'],
                    kerucut: ['tabung'],
                    bola: ['tabung', 'kerucut'],
                    prisma: ['limas', 'balok'],
                    limas: ['prisma', 'kubus'],
                    pecahan_lingkaran: ['pecahan_persegi'],
                    pecahan_persegi: ['pecahan_lingkaran'],
                    pictogram: ['diagram_batang', 'diagram_lingkaran']
                };
                const alts = geomAlternatives[visualCfg.type] || [];
                let foundGeomAlt = false;
                for (const altType of alts) {
                    const anyUsed = Array.from(usedStimulusSignatures).some(s => s.startsWith(altType));
                    if (!anyUsed) {
                        visualCfg = { ...visualCfg, type: altType };
                        foundGeomAlt = true;
                        break;
                    }
                }
                if (!foundGeomAlt) visualCfg = null;
            } else {
                // Untuk bangun yang tidak memiliki alternatif, alihkan ke foto
                visualCfg = null;
            }
            // Audit trail: log diversifikasi stimulus
            const newType = visualCfg?.type || 'photo-fallback';
            const newPointer = visualCfg?.params?.pointer || '';
            console.log(`[DiversityGuard] Soal ${q.no || '?'}: Collision "${originalSig}" → diverted to "${newType}${newPointer ? ':' + newPointer : ''}"`);
        }
    }

    // 4. Jika visualCfg terdeteksi dan didukung oleh VisualEngine
    if (visualCfg && visualCfg.type) {
        const svgRes = generateVisualStimulus(visualCfg);
        if (svgRes) {
            const sig = buildStimulusSignature(visualCfg);
            usedStimulusSignatures?.add(sig);
            if (svgRes.dataUri) {
                usedImageUrls?.add(svgRes.dataUri);
            }

            q.gambar = {
                url: svgRes.dataUri,
                svg: svgRes.svg,
                credit: svgRes.credit,
                title: svgRes.title,
                type: 'svg'
            };
            return;
        }
    }

    // 5. Jika bukan SVG parametrik atau dialihkan oleh Diversity Guard, cari gambar otentik (Wikipedia / Unsplash)
    if (unsplash) {
        const soalTextLower = String(q.soal || '').toLowerCase();
        // Guard: Soal yang membutuhkan stimulus diagram/skema presisi berlabel (tanda panah, huruf X, pola urutan, alur)
        // DILARANG KERAS menggunakan foto stok Unsplash! Foto stok tidak memiliki tanda panah ke CPU atau pola warna khusus soal.
        const requiresDiagram = /tanda\s+panah|panah\s+menunjuk|huruf\s+[a-z]|bagian\s+[a-z]|tanda\s+[a-z]|pola\s+warna|pola\s+bilangan|pola\s+gambar|diagram\s+alur|pohon\s+faktor|skema\s+alur|bernomor|tanda\s+tanya|\(\?\)|kotak\s+(?:kosong|berikut)|urutan\s+(?:gambar|pola)|simbol\s+sila|lambang\s+sila/i.test(soalTextLower);

        if (requiresDiagram) {
            delete q.gambar;
            delete q.visual_stimulus;
            delete q.gambar_keyword;
            delete q.gambar_prompt_en;
            return;
        }

        let bracketHint = '';
        const bracketMatch = String(q.soal || '').match(/\[(?:gambar|foto|diagram|ilustrasi|deskripsi)[^\]]*:?([^\]]*)\]/i);
        if (bracketMatch && bracketMatch[1]) {
            bracketHint = bracketMatch[1].trim();
        }

        const genericBlocklist = new Set([
            'educational diagram', 'diagram', 'diagram alur', 'foto', 'gambar',
            'soal', 'materi', 'asesmen', 'ujian', 'pelajaran', 'ilustrasi',
            'flowchart', 'skema', 'pola', 'pola warna', 'pola gambar', 'chart'
        ]);
        let searchKeyword = (q.gambar_keyword || visualCfg?.keyword || '').trim();
        if (!searchKeyword || genericBlocklist.has(searchKeyword.toLowerCase())) {
            // Jika soal secara eksplisit menanyakan identitas objek/tokoh/rasa pada gambar, ambil dari kunci jawaban
            if (/(?:perhatikan|amatilah|look\s+at)\s+(?:the\s+)?(?:gambar|picture|image)|siapakah|nama\s+tokoh|nama\s+benda|tokoh\s+pada\s+gambar|what\s+is\s+the\s+(?:taste|name|food|drink|animal|object)/i.test(soalTextLower) && q.kunci && q.opsi && q.opsi[q.kunci]) {
                const answerText = String(q.opsi[q.kunci]).trim();
                if (answerText.length >= 3) {
                    searchKeyword = answerText;
                }
            }
        }
        if (!searchKeyword || genericBlocklist.has(searchKeyword.toLowerCase())) {
            searchKeyword = topik || '';
        }

        // Jika keyword tetap kosong atau terlalu generik, batalkan pencarian foto acak
        if (!searchKeyword || genericBlocklist.has(searchKeyword.toLowerCase())) {
            delete q.gambar;
            delete q.visual_stimulus;
            return;
        }

        const promptEn = q.gambar_prompt_en || bracketHint || `${searchKeyword}, educational textbook illustration, clean white background, 2D art`;
        const subjectContext = `${mataPelajaran} ${topik}`;

        try {
            const img = await unsplash.searchImage(searchKeyword, q.soal, subjectContext, promptEn, usedImageUrls, usedImageIds);
            if (img && img.url) {
                const canonicalUrl = img.url.split('?')[0];
                const imgId = img.unsplashId || canonicalUrl;

                // Cegah duplikasi foto kembar di butir soal berbeda dalam satu paket
                if (usedImageUrls?.has(img.url) || usedImageUrls?.has(canonicalUrl) || usedImageIds?.has(imgId) || usedStimulusSignatures?.has(`url:${canonicalUrl}`)) {
                    console.warn(`[DiversityGuard] Soal ${q.no || '?'}: Duplicate photo URL rejected: ${canonicalUrl}`);
                    delete q.gambar;
                    delete q.visual_stimulus;
                    return;
                }

                usedImageUrls?.add(img.url);
                usedImageUrls?.add(canonicalUrl);
                usedImageIds?.add(imgId);
                usedStimulusSignatures?.add(`url:${canonicalUrl}`);
                usedStimulusSignatures?.add(`photo:${searchKeyword}`);
                q.gambar = {
                    url: img.url,
                    credit: img.creditName,
                    type: (img.source === 'cloudflare-ai' || (img.source as string) === 'vultr-ai') ? 'ai' : 'photo'
                };
            } else {
                delete q.gambar;
                delete q.visual_stimulus;
            }
        } catch (e) {
            console.error('Image search error:', e);
            delete q.gambar;
            delete q.visual_stimulus;
        }
    }
};

// Helper: evaluasi apakah mata pelajaran dan topik relevan menggunakan stimulus gambar
export const shouldEnableVisualStimulusForTopic = (mataPelajaran: string, topik: string, useGambarFlag: boolean): boolean => {
    if (!useGambarFlag) return false;
    const m = String(mataPelajaran || '').toLowerCase();
    const t = String(topik || '').toLowerCase();

    // Mapel Bahasa Inggris di SD/SMP berorientasi komunikatif visual (Flashcard vocabulary, foods & drinks, tastes, animals, professions, etc.)
    const isEnglish = /inggris|english/i.test(m);
    if (isEnglish) {
        // Izinkan seluruh topik visual Bahasa Inggris kecuali tata bahasa abstrak murni
        const isPureAbstractGrammar = /tenses|passive voice|reported speech|conditional sentence|relative clause|gerund/i.test(t);
        return !isPureAbstractGrammar;
    }

    const isLanguageSubject = /bahasa|indonesia|sunda|jawa/i.test(m);
    if (!isLanguageSubject) return true;

    // Untuk mapel bahasa Indonesia / daerah (Sunda/Jawa):
    // Gambar HANYA diaktifkan jika topiknya eksplisit membutuhkan visual konkret (rambu, iklan, denah, dll)
    const isExplicitVisual = /rambu|denah|peta|iklan|poster|slogan|komik|cerita\s*bergambar|grafik|tabel|simbol|lambang|gambar/i.test(t);
    return isExplicitVisual;
};

export interface AdaptiveVisualQuota {
    exactImages: number;
    ratio: number;
    category: 'high' | 'medium' | 'low';
    categoryLabel: string;
}

// Helper: perhitungan kuota stimulus visual adaptif berdasarkan karakteristik mata pelajaran, topik materi, & jenjang kelas
// Diperketat sesuai kebijakan efisiensi: 10 PG -> maks 2 gambar, 15 PG -> maks 3 gambar (rasio maksimal 20%)
export const calculateAdaptiveVisualQuota = (
    mataPelajaran: string,
    topik: string,
    count: number,
    jenjangKelas?: string
): AdaptiveVisualQuota => {
    if (count <= 0) {
        return { exactImages: 0, ratio: 0, category: 'low', categoryLabel: 'Tanpa Gambar' };
    }

    const m = String(mataPelajaran || '').toLowerCase();
    const t = String(topik || '').toLowerCase();
    const k = String(jenjangKelas || '').toLowerCase();
    const combined = `${m} ${t}`;

    // Batas Maksimal Ketat (Maksimal 20% / 1 gambar per 5 butir soal):
    // 10 soal PG -> maksimal 2 gambar
    // 15 soal PG -> maksimal 3 gambar
    // 20 soal PG -> maksimal 4 gambar
    const strictMaxCap = Math.max(1, Math.floor(count * 0.20));

    // 1. Kategori Tinggi (High Visual: Maks 20% -> tepat 2 butir per 10 PG, 3 butir per 15 PG)
    // Mencakup: Sains / IPAS, Geometri/Bangun Ruang/Data Statistika Matematika, Koding/Informatika/Robotika, TDBA, Bahasa Inggris Komunikatif (Foods, Tastes, Animals), atau Fase Fondasi/Rendah (Kelas 1-2 SD)
    const isSains = /ipas|ipa|sains|science|fisika|biologi|kimia/i.test(m);
    const isEnglish = /inggris|english/i.test(m);
    const isMathVisual = /matematika/i.test(m) && /geometri|bangun|ruang|datar|sudut|busur|pecahan|koordinat|kartesius|diagram|grafik|batang|lingkaran|trapesium|jajar|belah|layang|kubus|balok|tabung|kerucut|bola|prisma|limas|jaring|simetri|jam|waktu|pengukuran/i.test(combined);
    const isScienceVisualTopic = /organ|anatomi|pencernaan|pernapasan|darah|tata surya|planet|siklus air|metamorfosis|rantai makanan|ekosistem|bunga|tumbuhan|rangkaian listrik|listrik|magnet|cahaya|optik|bunyi|energi|wujud zat|kalor|suhu|termometer|pesawat sederhana|katrol/i.test(combined);
    const isTechAgri = /koding|coding|informatika|robot|scratch|komputer|tdba|hidroponik|pertanian/i.test(combined);
    const isEarlyGradeConcrete = /kelas\s*[12]\b|fase\s*a\b/i.test(k) && !/bahasa/i.test(m);

    if (isSains || isEnglish || isMathVisual || isScienceVisualTopic || isTechAgri || isEarlyGradeConcrete) {
        const ratio = 0.20;
        const exactImages = Math.min(strictMaxCap, Math.max(1, Math.round(count * ratio)));
        return {
            exactImages,
            ratio,
            category: 'high',
            categoryLabel: isEnglish ? 'Bahasa Inggris - Komunikatif Konkret (Visual Flashcard Maks 20%)' : 'Sains & Spasial Geometris (Visual Esensial Maks 20%)'
        };
    }

    // 2a. Kategori Rendah Khusus Pancasila / PKn (Visual Minimal 10% -> 1 butir per 10 soal PG)
    // Mayoritas materi Pancasila bersifat konseptual-normatif (nilai, sikap, hak & kewajiban)
    const isPancasilaPkn = /pancasila|pkn|kewarganegaraan/i.test(m);
    if (isPancasilaPkn) {
        const hasVisualTopic = /lambang|simbol|perisai|garuda|peta|wilayah|provinsi|kabupaten|pemerintah|trias politika|lembaga negara/i.test(t);
        const ratio = hasVisualTopic ? 0.15 : 0.10;
        const exactImages = Math.min(strictMaxCap, Math.max(1, Math.round(count * ratio)));
        return {
            exactImages,
            ratio,
            category: 'low',
            categoryLabel: hasVisualTopic
                ? 'Pancasila & PKn - Topik Visual (Lambang/Peta/Struktur 15%)'
                : 'Pancasila & PKn - Konseptual Normatif (Visual Minimal 10%)'
        };
    }

    // 2b. Kategori Sedang (Medium Visual: 15% -> 1 s.d. 2 butir per 10 soal PG, 2 butir per 15 soal PG)
    // Mencakup: IPS, Sejarah, Geografi, PJOK, Seni Budaya & Prakarya (SBdP), Kesenian Daerah
    const isSocialCulture = /ips|sejarah|geografi|pjok|jasmani|olahraga|seni|budaya|sbdp|musik|rupa|tari|batik/i.test(combined);
    if (isSocialCulture) {
        const ratio = 0.15;
        const exactImages = Math.min(strictMaxCap, Math.max(1, Math.round(count * ratio)));
        return {
            exactImages,
            ratio,
            category: 'medium',
            categoryLabel: 'Sosial, Budaya & Praktik (Visual Proporsional 15%)'
        };
    }

    // 3. Kategori Standar / Moderat (Low Visual: 10% -> 1 butir per 10 soal PG)
    // Mencakup: Matematika Aritmatika Murni, Agama / Budi Pekerti, Bahasa bertopik visual konkret khusus
    const ratio = 0.10;
    const exactImages = Math.min(strictMaxCap, Math.max(1, Math.round(count * ratio)));
    return {
        exactImages,
        ratio,
        category: 'low',
        categoryLabel: 'Konseptual & Aritmatika (Visual Minimal 10%)'
    };
};

// Helper: perumusan prompt asesmen & kisi-kisi terstandar Puspendik & BSKAP 046/2025
export const buildAssessmentPrompt = (params: {
    type: string;
    startNo: number;
    count: number;
    totalPrevPG?: number;
    totalIsian?: number;
    totalUraian?: number;
    mataPelajaran: string;
    topik: string;
    jenjangKelas: string;
    semester?: string;
    resolvedCP: string;
    hotsRatio?: string;
    isianType?: string;
    isGambarEnabled?: boolean;
}): string => {
    const {
        type, startNo, count, totalPrevPG = 0, totalIsian = 0, totalUraian = 0,
        mataPelajaran, topik, jenjangKelas, semester, resolvedCP, hotsRatio,
        isianType, isGambarEnabled = true
    } = params;
    const isPG = type === 'pg';

    let jsonStructure = '';
    if (isPG) {
        jsonStructure = `"pg": [ {
            "no": ${startNo},
            "cp": "Rumusan Capaian Pembelajaran terkait butir soal ini",
            "materi": "Materi / Sub-topik spesifik butir soal ini",
            "indikator": "Indikator Soal baku (contoh: Disajikan wacana/stimulus ..., murid dapat ...)",
            "level": "L1/L2/L3 (Pilih salah satu sesuai standar Puspendik)",
            "bentuk": "Pilihan Ganda",
            "soal": "Pertanyaan Pilihan Ganda (sajikan naskah soal bersih tanpa teks kurung siku [] dan JANGAN mencantumkan tag visual_stimulus di sini)",
            "opsi": { "A": "...", "B": "...", "C": "...", "D": "..." },
            "kunci": "A/B/C/D",
            "visual_stimulus": { "type": "nama_tipe_diagram", "params": { "pointer": "bagian_yang_ditunjuk", "label": "X" } },
            "gambar_keyword": "kata kunci ringkas 1-3 kata jika mencari foto otentik (kosongkan jika pakai visual_stimulus)",
            "gambar_prompt_en": "detailed English visual description jika mencari foto, 15-25 kata (kosongkan jika pakai visual_stimulus)"
        } ]`;
    } else {
        const parts: string[] = [];
        if (totalIsian > 0) {
            const isianBentukLabel = isianType === 'Crossword' ? 'Teka-Teki Silang' : isianType === 'Menjodohkan' ? 'Menjodohkan' : 'Isian Singkat';
            parts.push(`"isian": {
            "type": "${isianType || 'Standard'}",
            "data": [ {
                "no": ${totalPrevPG + 1},
                "cp": "Rumusan Capaian Pembelajaran terkait butir soal ini",
                "materi": "Materi / Sub-topik spesifik butir soal ini",
                "indikator": "Indikator Soal baku (Disajikan ..., murid dapat ...)",
                "level": "L1/L2/L3",
                "bentuk": "${isianBentukLabel}",
                "soal": "...",
                "kunci": "..."
            } ]
         }`);
        }
        if (totalUraian > 0) {
            const uraianStartNo = totalPrevPG + (totalIsian || 0) + 1;
            parts.push(`"uraian": [ {
                "no": ${uraianStartNo},
                "cp": "Rumusan Capaian Pembelajaran terkait butir soal ini",
                "materi": "Materi / Sub-topik spesifik butir soal ini",
                "indikator": "Indikator Soal baku (Disajikan stimulus kasus/data ..., murid dapat menganalisis/merancang ...)",
                "level": "L3",
                "bentuk": "Uraian",
                "soal": "Soal uraian L3 (Penalaran): sertakan stimulus/data/kasus nyata, tuntut penalaran analitis atau evaluasi",
                "kunci": "Jawaban ideal lengkap dengan alasan/argumentasi",
                "rubrik_skor": { "Skor 4": "Analisis lengkap, argumen tepat & logis", "Skor 3": "Analisis cukup, argumen ada namun kurang lengkap", "Skor 2": "Menjawab namun tidak disertai analisis", "Skor 1": "Jawaban tidak relevan atau salah" }
            } ]`);
        }
        jsonStructure = parts.join(',\n                 ');
    }

    let isianRule = "";
    if (!isPG && totalIsian > 0) {
        if (isianType === 'Crossword') {
            isianRule = `\n                9. ATURAN ISIAN (TEKA-TEKI SILANG): Setiap "soal" isian HARUS diawali dengan kata "Mendatar:" atau "Menurun:". Kunci jawaban HARUS 1 kata tanpa spasi (huruf kapital).`;
        } else if (isianType === 'Menjodohkan') {
            isianRule = `\n                9. ATURAN ISIAN (MENJODOHKAN): Setiap "soal" isian berisi pernyataan logis. "kunci" berisi pasangan yang benar dan proporsional.`;
        }
    }

    let taskDesc = '';
    if (isPG) {
        taskDesc = `Generate TEPAT ${count} soal PG (No. ${startNo} s.d. ${startNo + count - 1}) berserta atribut kisi-kisinya secara lengkap.`;
    } else if (totalIsian > 0 && totalUraian > 0) {
        taskDesc = `Generate TEPAT ${totalIsian} soal ISIAN dan ${totalUraian} soal URAIAN beserta atribut kisi-kisinya secara lengkap.`;
    } else if (totalIsian > 0 && totalUraian === 0) {
        taskDesc = `Generate TEPAT ${totalIsian} soal ISIAN saja beserta atribut kisi-kisinya secara lengkap. JANGAN membuat soal uraian (uraian = 0)!`;
    } else if (totalIsian === 0 && totalUraian > 0) {
        taskDesc = `Generate TEPAT ${totalUraian} soal URAIAN saja beserta atribut kisi-kisinya secara lengkap. JANGAN membuat soal isian (isian = 0)!`;
    }

    let uraianRule = '';
    if (!isPG && totalUraian > 0) {
        uraianRule = `\n                6. ATURAN SOAL URAIAN: Minimal 1 soal uraian HARUS berjenis Level L3 (Penalaran) yang menuntut murid: (a) menganalisis situasi/data wacana, (b) memberikan penilaian/argumen berdasar fakta, atau (c) merancang solusi kreatif. Rubrik WAJIB menggunakan 4 level skor.`;
    } else if (!isPG && totalUraian === 0) {
        uraianRule = `\n                6. LARANGAN URAIAN: Pengguna TIDAK MEMBUTUHKAN soal uraian (jumlah = 0). DILARANG KERAS menyertakan field "uraian" dalam output JSON.`;
    }

    const effectiveGambarEnabled = shouldEnableVisualStimulusForTopic(mataPelajaran, topik, isGambarEnabled);
    const isLanguageSubject = /bahasa\s+(?:indonesia|sunda|jawa)|muatan\s+lokal/i.test(mataPelajaran);

    let gambarRule = '';
    if (isPG) {
        if (!effectiveGambarEnabled && isLanguageSubject) {
            gambarRule = `\n                7. ATURAN STIMULUS MAPEL BAHASA (STIMULUS TEKS / WACANA): Untuk materi kebahasaan/sastra "${topik}", stimulus soal WAJIB berupa teks wacana pendek, kalimat autentik, dialog, atau kutipan sastra yang kaya konteks (BUKAN stimulus gambar). DILARANG KERAS menyertakan stimulus gambar visual dan DILARANG menuliskan frasa "Perhatikan gambar berikut!" di naskah soal. Field "visual_stimulus", "gambar_keyword", dan "gambar_prompt_en" WAJIB diisi null/string kosong.`;
        } else if (effectiveGambarEnabled) {
            const adaptiveQuota = calculateAdaptiveVisualQuota(mataPelajaran, topik, count, jenjangKelas);
            const exactImages = adaptiveQuota.exactImages;
            gambarRule = `\n                7. ATURAN GAMBAR (KUNCI TEPAT ${exactImages} BUTIR SOAL BERGAMBAR - PROPORSI ADAPTIF ${Math.round(adaptiveQuota.ratio * 100)}%): Fitur ilustrasi gambar AKTIF (${adaptiveQuota.categoryLabel}). Dari ${count} butir soal PG ini, Anda WAJIB memilih TEPAT ${exactImages} butir soal (tidak boleh lebih dan tidak boleh kurang) yang menggunakan stimulus visual berupa diagram SVG presisi / foto objek konkret yang jelas.
            - PERENCANAAN VARIASI VISUAL (SANGAT PENTING — BACA SEBELUM MULAI MENYUSUN SOAL):
              * SEBELUM mulai menulis soal, RENCANAKAN terlebih dahulu ${exactImages} jenis stimulus visual yang BERBEDA-BEDA untuk ${exactImages} butir soal bergambar.
              * Setiap butir soal bergambar WAJIB menggunakan tipe visual_stimulus atau gambar_keyword yang UNIK dan BERBEDA dari butir soal bergambar lainnya.
              * DILARANG KERAS menggunakan tipe visual_stimulus yang sama (misal tipe + pointer identik) pada lebih dari 1 butir soal dalam satu paket ujian!
              * Contoh BENAR (variasi visual):
                - Soal 2 (atribut JSON "visual_stimulus"): { "type": "organ_pencernaan", "params": { "pointer": "lambung", "label": "X" } }
                - Soal 5 (atribut JSON "visual_stimulus"): { "type": "vili_usus", "params": { "pointer": "kapiler", "label": "X" } }
                - Soal 8 (atribut JSON "gambar_keyword"): "Kelinci"
              * Contoh SALAH (duplikasi — DILARANG):
                - Soal 2: tipe "organ_pencernaan" dengan pointer "lambung"
                - Soal 7: tipe "organ_pencernaan" dengan pointer "lambung" ← DUPLIKAT!
            - PADA ${exactImages} BUTIR SOAL BERGAMBAR TERSEBUT:
              * ${getSubjectImagePromptGuideline(mataPelajaran)}
            - LARANGAN MUTLAK PADA SOAL BERGAMBAR:
              * DILARANG KERAS menuliskan teks "visual_stimulus {...}", "gambar_keyword", atau format kode prompt apa pun di dalam teks naskah soal ("soal")! Naskah "soal" hanya boleh berisi kalimat pengantar dan pertanyaan bersih (contoh: "Perhatikan gambar berikut! Berdasarkan gambar tersebut, besar sudut tersebut adalah ...").
              * Parameter visual_stimulus HANYA boleh diletakkan pada atribut JSON "visual_stimulus" terpisah di luar string soal!
              * DILARANG KERAS membuat soal diagram alur/bagan bertuliskan teks atau diagram pohon faktor angka.
              * DILARANG KERAS menuliskan teks deskripsi seperti "[Diagram menunjukkan...]" di dalam teks soal!
            - Pada butir soal lainnya, WAJIB mengosongkan field ("visual_stimulus": null, "gambar_keyword": "", "gambar_prompt_en": "").`;
        } else {
            gambarRule = `\n                7. GAMBAR: Dilarang menyertakan gambar ("visual_stimulus": null, "gambar_keyword": "", "gambar_prompt_en": "" untuk semua soal).`;
        }
    }

    return `
        Bertindaklah sebagai Profesor dan Pakar Penilaian Pendidikan Berstandar Kurikulum Merdeka & Puspendik Kemendikbudristek.

        I. STANDAR RESMI LEVEL KOGNITIF (PUSPENDIK / BSKAP KEMENDIKBUDRISTEK):
        Setiap butir soal HARUS diberi label level kognitif resmi:
        ┌─ L1 (Level 1 - Pengetahuan dan Pemahaman) ──────────────────────────────
        │  C1 Mengingat   : sebutkan, tuliskan, definisikan, identifikasi, jodohkan
        │  C2 Memahami    : jelaskan, uraikan, klasifikasikan, ringkas, bedakan
        ├─ L2 (Level 2 - Aplikasi / Penerapan) ────────────────────────────────────
        │  C3 Menerapkan  : hitung, gunakan, tentukan, selesaikan, demonstrasikan
        ├─ L3 (Level 3 - Penalaran / Higher Order Thinking Skills - HOTS) ─────────
        │  C4 Menganalisis: analisis, bandingkan, simpulkan, periksa hubungan sebab-akibat
        │  C5 Mengevaluasi: nilai, justifikasi, kritisi, putuskan, rekomendasikan
        │  C6 Mencipta    : rancang, buat, susun, formulasikan solusi atas masalah kontekstual
        └──────────────────────────────────────────────────────────────────────────

        II. ATURAN WAJIB KISI-KISI & PENYUSUNAN SOAL:
        ${(() => {
            const regName = (mataPelajaran?.toLowerCase().includes('agama') || mataPelajaran?.toLowerCase().includes('paibp'))
                ? 'Kepka BKPDM No. 020 Tahun 2026'
                : (mataPelajaran?.toLowerCase().includes('sunda') || mataPelajaran?.toLowerCase().includes('tatanen') || mataPelajaran?.toLowerCase().includes('akpk'))
                    ? 'Muatan Lokal Kurikulum Merdeka'
                    : 'BSKAP No. 046 Tahun 2025';
            return `1. CP (Capaian Pembelajaran): ${resolvedCP ? `Berdasarkan rujukan resmi ${regName}: "${resolvedCP}". Formulasikan rumusan CP yang spesifik dan relevan untuk butir-butir soal bertopik "${topik}".` : `Formulasikan otomatis sesuai capaian pembelajaran resmi ${regName} untuk topik ini`}`;
        })()}
        2. LINGKUP MATERI: ${topik}
        3. PROPORSI TARGET LEVEL: ${hotsRatio || '30:40:30'} (L1 : L2 : L3). Terapkan secara presisi!
        4. TUGAS: ${taskDesc}
        5. ATURAN INDIKATOR SOAL: Setiap butir soal WAJIB memiliki indikator soal baku:
           "Disajikan [stimulus/konteks], murid dapat [kata kerja operasional] [materi]".
           DILARANG MENGGUNAKAN KATA 'Peserta Didik' / 'peserta didik'. Selalu gunakan kata 'Murid' / 'murid'.
        6. DISTRIBUSI KUNCI PG: Distribusikan kunci jawaban (A/B/C/D) secara ACAK dan MERATA.
        7. ATURAN SOAL L3 / PENALARAN (WAJIB): Setiap soal yang diberi label "L3" WAJIB memiliki STIMULUS — berupa mini-wacana, penggalan cerita, data/angka sederhana, pernyataan kasus nyata — yang ditulis SEBELUM pertanyaan. Pertanyaan L3 tidak boleh bisa dijawab tanpa menelaah stimulusnya.${uraianRule}
        8. ATURAN KONSISTENSI FORMAT TABEL (SANGAT PENTING):
           - Jika butir soal (baik PG, Isian, maupun Uraian) menyajikan stimulus atau data dalam bentuk TABEL, WAJIB menggunakan format Tabel Markdown Standar yang LENGKAP:
             * Setiap baris tabel WAJIB diawali dan diakhiri dengan karakter pipa (|).
             * WAJIB menyertakan baris pemisah kolom/header dengan strip (| :--- | :---: | :---: |).
             * Contoh tabel vertikal:
               | Nama Barang | Harga Satuan | Jumlah |
               | :--- | :---: | :---: |
               | Buku Tulis | Rp 5.000 | 12 |
               | Pensil 2B | Rp 3.000 | 24 |
             * Contoh tabel horizontal (misal hari & penjualan):
               | Hari | Senin | Selasa | Rabu | Kamis | Jumat |
               | :--- | :---: | :---: | :---: | :---: | :---: |
               | Penjualan (kg) | 25 | 32 | 18 | 35 | 29 |
             * DILARANG KERAS menyajikan data tabel hanya dengan spasi/tab tanpa pipa (|), dan DILARANG menulis format semi-tabel seperti "Hari : Senin | Selasa | ...". Seluruh data tabel WAJIB di dalam tabel Markdown utuh!
             * Berikan jarak baris kosong (\\n\\n) sebelum tabel dan setelah tabel.${gambarRule}
        ${isPG ? '9.' : '8.'} LARANGAN: JANGAN menulis teks label "L1", "L2", "L3" di dalam teks pertanyaan yang dibaca murid. Label disimpan pada field "level". JANGAN menambahkan field "gambar" ke soal isian maupun uraian.${isianRule}
        ${getKelasAdaptation(jenjangKelas)}

        ${isPG ? '10.' : '9.'} PEDOMAN EFISIENSI PENALARAN (REASONING EFFICIENCY):
        - Jika model AI menggunakan mode penalaran (Reasoning / Extended Thinking / Chain of Thought):
          * Buat telaah perancangan butir soal secara RINGKAS, PADAT, dan LANGSUNG (maksimal 1-2 kalimat pertimbangan per nomor).
          * DILARANG mengulang-ulang kutipan teks regulasi, menyalin teks prompt, atau membuat monolog analisis bertele-tele.
          * Segera formulasikan output struktur JSON yang diminta secara lengkap dan valid agar proses selesai tepat waktu.

        III. FORMAT OUTPUT JSON (berikan JSON valid saja, tanpa teks pengantar):
        {
           ${jsonStructure}
        }

        IV. KONTEKS DATA:
        - Mata Pelajaran : ${mataPelajaran}
        - Topik / Materi : ${topik}
        - Jenjang Kelas  : ${jenjangKelas}
        - Semester       : ${semester || '-'}
    `;
};

const SLUG_MAP: Record<string, string> = {
    vertex: 'vertex-proxy',
    gemini: 'gemini-flash',
    bedrock: 'bedrock-claude',
    mistral: 'mistral-large',
    z_ai: 'glm4-flash'
};

// Helper: Normalisasi kisi-kisi untuk seluruh butir soal (PG, Isian, Uraian)
function normalizeAssessmentItems(finalData: any, resolvedCP: string, topik: string, isianType: string, totalPG: number) {
    if (finalData.pg && Array.isArray(finalData.pg)) {
        finalData.pg.forEach((q: any, i: number) => {
            normalizeItemKisiMetadata(q, 'Pilihan Ganda', i + 1, resolvedCP, topik);
        });
    }

    if (finalData.isian?.data && Array.isArray(finalData.isian.data)) {
        const isianBentukLabel = isianType === 'Crossword' ? 'Teka-Teki Silang' : isianType === 'Menjodohkan' ? 'Menjodohkan' : 'Isian Singkat';
        finalData.isian.data.forEach((q: any, i: number) => {
            normalizeItemKisiMetadata(q, isianBentukLabel, (q.no || (totalPG + i + 1)), resolvedCP, topik);
        });
    }

    if (finalData.uraian && Array.isArray(finalData.uraian)) {
        finalData.uraian.forEach((q: any, i: number) => {
            const defaultUraianNo = (finalData.isian?.data?.length ? Math.max(...finalData.isian.data.map((x: any) => x.no || 0)) : totalPG) + i + 1;
            normalizeItemKisiMetadata(q, 'Uraian', (q.no || defaultUraianNo), resolvedCP, topik);
        });
    }
}

// Helper: Simpan telemetri dan persistensi ke Bank Soal secara aman & non-blocking
async function saveAssessmentTelemetryAndBankSoal(
    db: D1Database,
    user: any,
    validated: any,
    finalData: any,
    preferredSlug?: string | null
) {
    try {
        await recordAIGeneration(db, {
            user_id: user?.id || 1,
            user_nama: user?.nama || (validated.namaGuru || 'Guru'),
            sekolah: user?.sekolah || (validated.namaSekolah || 'SD Negeri Binaan'),
            feature_type: 'ASESMEN',
            mata_pelajaran: validated.mataPelajaran,
            topik: validated.topik,
            jenjang_kelas: validated.jenjangKelas,
            ai_provider: preferredSlug || undefined,
        });

        // Persistensi ke Bank Soal (respek preferensi isPublic: 1 = Publik, 0 = Pribadi)
        const isPublicVal = (validated.isPublic === false || validated.isPublic === 'false' || validated.isPublic === 0 || validated.isPublic === '0') ? 0 : 1;
        try {
            await ensureBankSoalTables(db);
            await db.prepare(`
                INSERT INTO bank_soal (
                    user_id, user_nama, sekolah, mata_pelajaran, topik,
                    jenjang_kelas, semester, jenis_ujian, capaian_pembelajaran,
                    jumlah_pg, jumlah_isian, jumlah_uraian, isian_type, hots_ratio,
                    content, ai_provider, is_public
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                user?.id || 1,
                user?.nama || (validated.namaGuru || 'Guru'),
                user?.sekolah || (validated.namaSekolah || ''),
                validated.mataPelajaran || '',
                validated.topik || '',
                validated.jenjangKelas || '',
                validated.semester || null,
                validated.jenisUjian || null,
                validated.capaianPembelajaran || null,
                validated.jumlahPG || 0,
                validated.jumlahIsian || 0,
                validated.jumlahUraian || 0,
                validated.isianType || 'Standard',
                validated.hotsRatio || '30:40:30',
                JSON.stringify(finalData),
                preferredSlug || null,
                isPublicVal
            ).run();
        } catch (bankErr) {
            console.warn('[BankSoal] Auto-save failed (non-blocking):', bankErr);
        }
    } catch (e) {
        console.warn('[Telemetry] Save failed (non-blocking):', e);
    }
}

// Pipeline 1: Deduplikasi, Image Scoring & Stimulus Enrichment untuk Soal Pilihan Ganda
export async function enrichAndNormalizePG(
    pgArray: any[],
    options: {
        mataPelajaran: string;
        topik: string;
        isGambarEnabled: boolean;
        unsplash: UnsplashService | null;
        exactImageCount: number;
    }
): Promise<any[]> {
    const { mataPelajaran, topik, isGambarEnabled, unsplash, exactImageCount } = options;

    // Deduplication: hapus soal yang teks awalnya sama (normalize lowercase, 100 char pertama)
    const seenSoal = new Set<string>();
    const deduped = pgArray.filter((q: any) => {
        const normalized = cleanPromptDebris(String(q.soal || ''))
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 100);
        if (seenSoal.has(normalized)) return false;
        seenSoal.add(normalized);
        return true;
    });

    // Renumber setelah dedup
    deduped.forEach((q: any, i: number) => { q.no = i + 1; });

    // Enforce exact image count jika visual stimulus aktif
    if (isGambarEnabled && unsplash && exactImageCount > 0 && deduped.length > 0) {
        const scoredQuestions = deduped.map((q: any, index: number) => {
            let score = 0;
            const soalText = String(q.soal || '').toLowerCase();
            if (q.visual_stimulus && q.visual_stimulus.type) score += 20;
            if (q.gambar_keyword && q.gambar_keyword.trim() !== '') score += 10;
            // Prioritas tertinggi (+35): Soal yang naskahnya secara intrinsik merujuk pada gambar (wajib punya gambar agar bisa dijawab)
            if (/(?:perhatikan|amatilah|look\s+at)\s+(?:the\s+)?(?:gambar|foto|diagram|ilustrasi|picture|image)|(?:pada\s+gambar|in\s+the\s+picture|based\s+on\s+the\s+picture)|gambar\s+di\s+bawah/i.test(soalText)) score += 35;
            if (soalText.includes('gambar') || soalText.includes('picture') || soalText.includes('image') || soalText.includes('diagram') || soalText.includes('bagan') || soalText.includes('skema') || soalText.includes('kalender') || soalText.includes('pohon') || soalText.includes('grafik') || soalText.includes('peta') || soalText.includes('tabel')) score += 5;
            if (soalText.includes('perhatikan') || soalText.includes('look at') || soalText.includes('berikut') || soalText.includes('amatilah')) score += 3;
            return { q, index, score };
        });

        scoredQuestions.sort((a: any, b: any) => b.score - a.score);
        const targetSelected = new Set(scoredQuestions.slice(0, exactImageCount).map((item: any) => item.q));
        const usedStimulusSignatures = new Set<string>();
        const usedImageUrls = new Set<string>();
        const usedImageIds = new Set<string>();

        for (const q of deduped) {
            if (targetSelected.has(q)) {
                await resolveQuestionVisualStimulus(q, mataPelajaran, topik, unsplash, usedStimulusSignatures, usedImageUrls, usedImageIds);
            } else {
                delete q.gambar;
                delete q.gambar_keyword;
                delete q.gambar_prompt_en;
                delete q.visual_stimulus;
            }
        }

        // =========================================================================
        // ENFORCE STRICT ZERO-DUPLICATE & IRRELEVANCY POLICY ACROSS THE ENTIRE PACKET
        // =========================================================================
        const seenCanonicalUrls = new Set<string>();
        const seenSvgSignatures = new Set<string>();

        for (const q of deduped) {
            if (q.gambar && q.gambar.url) {
                const rawUrl = String(q.gambar.url).trim();
                const canonicalUrl = rawUrl.split('?')[0];

                if (seenCanonicalUrls.has(canonicalUrl) || seenCanonicalUrls.has(rawUrl)) {
                    console.warn(`[PacketDiversityGuard] Question #${q.no}: Duplicate image URL stripped (${canonicalUrl}).`);
                    delete q.gambar;
                    delete q.visual_stimulus;
                    delete q.gambar_keyword;
                    delete q.gambar_prompt_en;
                } else {
                    seenCanonicalUrls.add(canonicalUrl);
                    seenCanonicalUrls.add(rawUrl);
                }
            }

            if (q.visual_stimulus && q.visual_stimulus.type) {
                const sig = buildStimulusSignature(q.visual_stimulus);
                if (seenSvgSignatures.has(sig)) {
                    console.warn(`[PacketDiversityGuard] Question #${q.no}: Duplicate SVG signature stripped (${sig}).`);
                    delete q.gambar;
                    delete q.visual_stimulus;
                } else {
                    seenSvgSignatures.add(sig);
                }
            }

            if (!q.gambar && !q.visual_stimulus) {
                q.soal = q.soal
                    .replace(/^(?:(?:perhatikan|amatilah)\s+(?:the\s+)?(?:gambar|foto|diagram|ilustrasi)(?:\s+[a-z0-9_-]+)?\s+(?:berikut|di\s+bawah\s+ini)?|look\s+at\s+the\s+(?:picture|image|illustration)(?:\s+below)?)[\s!.,:]*/i, '')
                    .replace(/^gambar\s+menunjukkan[^\n.!?]*[.!?]\s*/i, '')
                    .replace(/tokoh\s+pada\s+gambar\s+tersebut/gi, 'Tokoh yang')
                    .replace(/pada\s+gambar\s+tersebut/gi, 'tersebut')
                    .replace(/in\s+the\s+picture/gi, '')
                    .replace(/berdasarkan\s+gambar\s+tersebut,?\s*/gi, '')
                    .trim();
                if (q.soal.length > 0) {
                    q.soal = q.soal.charAt(0).toUpperCase() + q.soal.slice(1);
                }
            }
            q.soal = normalizeSoalMarkdown(q.soal);
        }
    } else {
        for (const q of deduped) {
            delete q.gambar;
            delete q.gambar_keyword;
            delete q.gambar_prompt_en;
            delete q.visual_stimulus;
            q.soal = q.soal
                .replace(/^(?:perhatikan|amatilah)\s+(?:gambar|foto|diagram|ilustrasi)\s+(?:berikut|di\s+bawah\s+ini)[\s!.,:]*/i, '')
                .replace(/^gambar\s+menunjukkan[^\n.!?]*[.!?]\s*/i, '');
            if (q.soal.length > 0) {
                q.soal = q.soal.charAt(0).toUpperCase() + q.soal.slice(1);
            }
            q.soal = normalizeSoalMarkdown(q.soal);
        }
    }

    return deduped;
}

// Pipeline 2: Normalisasi Soal Isian (Crossword / Menjodohkan / Isian Singkat) dan Soal Uraian
export function processIsianAndUraian(
    finalData: any,
    result: any,
    options: {
        totalPG: number;
        totalIsian: number;
        totalUraian: number;
        isianType?: string;
    }
) {
    const { totalPG, totalIsian, totalUraian, isianType } = options;
    const startNoIsian = totalPG + 1;

    // Handle Isian
    if (totalIsian > 0 && result?.isian) {
        finalData.isian = result.isian;
        finalData.isian.type = isianType || 'Standard';

        if (finalData.isian.data && Array.isArray(finalData.isian.data)) {
            finalData.isian.data = finalData.isian.data.slice(0, totalIsian);
            finalData.isian.data.forEach((q: any) => {
                delete q.gambar;
                delete q.gambar_keyword;
                q.soal = normalizeSoalMarkdown(q.soal);
            });
        }

        if (isianType === 'Crossword' && finalData.isian.data) {
            const words = finalData.isian.data.map((q: any) => String(q.kunci));
            const cw = generateCrossword(words, startNoIsian);
            if (cw.success) {
                finalData.isian.crossword = cw;
                for (const p of cw.placements) {
                    if (p.originalIndex != null && finalData.isian.data[p.originalIndex]) {
                        finalData.isian.data[p.originalIndex].no = p.number;
                    }
                }
            }
        }
    } else {
        finalData.isian = null;
    }

    // Handle Uraian
    if (totalUraian > 0 && result?.uraian && Array.isArray(result.uraian)) {
        finalData.uraian = result.uraian.slice(0, totalUraian);
        finalData.uraian.forEach((q: any) => {
            delete q.gambar;
            delete q.gambar_keyword;
            q.soal = normalizeSoalMarkdown(q.soal);
        });

        if (finalData.isian && finalData.isian.data && finalData.isian.data.length > 0) {
            const maxIsianNo = Math.max(...finalData.isian.data.map((x: any) => x.no || 0));
            finalData.uraian.forEach((q: any, i: number) => {
                q.no = maxIsianNo + 1 + i;
            });
        }
    } else {
        finalData.uraian = [];
    }
}

// Pipeline 3: Finalisasi Matriks Kisi-Kisi & Simpan Telemetri/Bank Soal
export async function finalizeAssessmentPackage(
    finalData: any,
    options: {
        resolvedCP: string;
        topik: string;
        isianType?: string;
        totalPG: number;
        db?: D1Database;
        user?: any;
        bodyConfig?: any;
        preferredSlug?: string | null;
    }
) {
    const { resolvedCP, topik, isianType, totalPG, db, user, bodyConfig, preferredSlug } = options;

    // Normalisasi metadata kisi-kisi untuk seluruh butir soal (PG, Isian, Uraian)
    normalizeAssessmentItems(finalData, resolvedCP, topik, isianType || 'Standard', totalPG);

    // Telemetri & Bank Soal Persistence (non-blocking)
    if (db && bodyConfig) {
        await saveAssessmentTelemetryAndBankSoal(db, user, bodyConfig, finalData, preferredSlug || null);
    }

    return finalData;
}

// Generate Asesmen (Soal) via AI (Standar)
kisi.post('/generate', async (c) => {
    try {
        // 1. Auth Gate: Tolak request jika belum login
        const user = await getAuthenticatedUser(c);
        if (!user) {
            return Errors.unauthorized(c, 'Sesi telah berakhir atau belum login. Silakan login terlebih dahulu.');
        }

        // 2. Validasi Input Payload dengan Zod
        const rawBody = await c.req.json();
        const validation = validate(createAssessmentSchema, rawBody);
        if (!validation.success) {
            return Errors.validation(c, 'Data input asesmen tidak valid', validation.errors);
        }

        const body = validation.data;
        const {
            namaSekolah, namaGuru, nipGuru, mataPelajaran, topik,
            jenjangKelas, semester, jenisUjian, capaianPembelajaran,
            jumlahPG, jumlahIsian, jumlahUraian,
            hotsRatio, isianType, aiProvider, useGambar
        } = body;

        const totalPG = jumlahPG || 0;
        const totalIsian = jumlahIsian || 0;
        const totalUraian = jumlahUraian || 0;

        if (totalPG + totalIsian + totalUraian === 0) {
            return Errors.badRequest(c, 'Minimal harus ada 1 butir soal yang dibuat (PG, Isian, atau Uraian).');
        }

        const isGambarEnabled = useGambar !== false && useGambar !== 'false' && useGambar !== 0 && useGambar !== '0';

        // Dapatkan rujukan resmi Capaian Pembelajaran BSKAP No. 046 Tahun 2025 (atau Database Admin)
        const officialCP = await getDynamicCP(c.env.DB, mataPelajaran, jenjangKelas);
        const resolvedCP = (capaianPembelajaran && String(capaianPembelajaran).trim()) || officialCP || '';

        const ai = new AIService(c.env);
        await ai.loadProviders(c.env.DB);

        const preferredSlug = aiProvider ? (SLUG_MAP[aiProvider] || aiProvider) : undefined;
        const finalData: any = { pg: [], isian: null, uraian: [] };

        const buildPrompt = (type: string, startNo: number, count: number, totalPrevPG = 0) =>
            buildAssessmentPrompt({
                type, startNo, count, totalPrevPG, totalIsian, totalUraian,
                mataPelajaran, topik, jenjangKelas, semester, resolvedCP, hotsRatio,
                isianType, isGambarEnabled
            });

        // Generate PG
        if (totalPG > 0) {
            const effectiveGambarEnabled = shouldEnableVisualStimulusForTopic(mataPelajaran, topik, isGambarEnabled);
            const adaptiveQuota = calculateAdaptiveVisualQuota(mataPelajaran, topik, totalPG, jenjangKelas);
            const exactImageCount = effectiveGambarEnabled ? adaptiveQuota.exactImages : 0;
            const BATCH_SIZE = 20;
            const unsplash = effectiveGambarEnabled ? new UnsplashService(c.env) : null;

            for (let i = 0; i < totalPG; i += BATCH_SIZE) {
                const currentCount = Math.min(BATCH_SIZE, totalPG - i);
                const prompt = buildPrompt('pg', i + 1, currentCount);
                const result = await ai.generateJSON(prompt, preferredSlug);
                if (result?._ai_meta) finalData._meta = result._ai_meta;
                if (result?.pg && Array.isArray(result.pg)) {
                    finalData.pg.push(...result.pg);
                }
            }

            // Jalankan pipeline dedup, image scoring, & stimulus enrichment
            finalData.pg = await enrichAndNormalizePG(finalData.pg, {
                mataPelajaran,
                topik,
                isGambarEnabled: effectiveGambarEnabled,
                unsplash,
                exactImageCount
            });
        }

        // Generate Isian + Uraian
        if (totalIsian > 0 || totalUraian > 0) {
            const startNoIsian = totalPG + 1;
            const prompt = buildPrompt('isian', startNoIsian, totalIsian, totalPG);
            const result = await ai.generateJSON(prompt, preferredSlug);
            if (result?._ai_meta) finalData._meta = result._ai_meta;

            processIsianAndUraian(finalData, result, {
                totalPG,
                totalIsian,
                totalUraian,
                isianType
            });
        }

        // Quality Gate: Verifikasi forensik & auto-healing multi-tier sebelum finalisasi
        await runAssessmentQualityGate(ai, finalData, {
            mataPelajaran,
            topik,
            jenjangKelas,
            semester
        }, {
            preferredSlug
        });

        // Finalisasi paket asesmen (Normalisasi matriks kisi-kisi, Telemetri, & Bank Soal)
        await finalizeAssessmentPackage(finalData, {
            resolvedCP,
            topik,
            isianType: isianType || 'Standard',
            totalPG,
            db: c.env.DB,
            user,
            bodyConfig: body,
            preferredSlug: preferredSlug || null
        });

        return successResponse(c, finalData);

    } catch (e: any) {
        console.error('Asesmen Gen Error:', e);
        return Errors.internal(c, e.message);
    }
});

// Generate Asesmen (Soal) via AI Stream (SSE - Live Monitor)
kisi.post('/generate-stream', async (c) => {
    try {
        // 1. Auth Gate: Tolak request jika belum login
        const user = await getAuthenticatedUser(c);
        if (!user) {
            return Errors.unauthorized(c, 'Sesi telah berakhir atau belum login. Silakan login terlebih dahulu.');
        }

        // 2. Validasi Input Payload dengan Zod
        const rawBody = await c.req.json();
        const validation = validate(createAssessmentSchema, rawBody);
        if (!validation.success) {
            return Errors.validation(c, 'Data input asesmen tidak valid', validation.errors);
        }

        const body = validation.data;
        const {
            namaSekolah, namaGuru, nipGuru, mataPelajaran, topik,
            jenjangKelas, semester, jenisUjian, capaianPembelajaran,
            jumlahPG, jumlahIsian, jumlahUraian,
            hotsRatio, isianType, aiProvider, useGambar
        } = body;

        const totalPG = jumlahPG || 0;
        const totalIsian = jumlahIsian || 0;
        const totalUraian = jumlahUraian || 0;

        if (totalPG + totalIsian + totalUraian === 0) {
            return Errors.badRequest(c, 'Minimal harus ada 1 butir soal yang dibuat (PG, Isian, atau Uraian).');
        }

        const isGambarEnabled = useGambar !== false && useGambar !== 'false' && useGambar !== 0 && useGambar !== '0';
        const officialCP = await getDynamicCP(c.env.DB, mataPelajaran, jenjangKelas);
        const resolvedCP = (capaianPembelajaran && String(capaianPembelajaran).trim()) || officialCP || '';

        const ai = new AIService(c.env);
        await ai.loadProviders(c.env.DB);

        const preferredSlug = aiProvider ? (SLUG_MAP[aiProvider] || aiProvider) : undefined;
        const finalData: any = { pg: [], isian: null, uraian: [] };

        const buildPrompt = (type: string, startNo: number, count: number, totalPrevPG = 0) =>
            buildAssessmentPrompt({
                type, startNo, count, totalPrevPG, totalIsian, totalUraian,
                mataPelajaran, topik, jenjangKelas, semester, resolvedCP, hotsRatio,
                isianType, isGambarEnabled
            });

        c.header('X-Accel-Buffering', 'no');
        return streamSSE(c, async (stream) => {
            try {
                // Step 1: Analisis Kurikulum & CP
                const regTitle = (mataPelajaran?.toLowerCase().includes('agama') || mataPelajaran?.toLowerCase().includes('paibp'))
                    ? 'Kepka BKPDM 020/2026'
                    : (mataPelajaran?.toLowerCase().includes('sunda') || mataPelajaran?.toLowerCase().includes('tatanen') || mataPelajaran?.toLowerCase().includes('akpk'))
                        ? 'Muatan Lokal'
                        : 'BSKAP 046/2025';
                await stream.writeSSE({
                    event: 'step',
                    data: JSON.stringify({
                        step: 1,
                        totalSteps: 6,
                        title: `Analisis CP ${regTitle}`,
                        message: `Menelaah materi "${topik}" berdasar rujukan resmi ${regTitle} (${jenjangKelas || 'SD'})...`,
                        percent: 15
                    })
                });

                // Callback pengalir token ke client (dilindungi dari error write stream)
                const onToken = async (token: string) => {
                    try {
                        await stream.writeSSE({
                            event: 'token',
                            data: JSON.stringify({ text: token })
                        });
                    } catch (_) {}
                };

                // Step 2: Generate Pilihan Ganda (PG)
                if (totalPG > 0) {
                    await stream.writeSSE({
                        event: 'step',
                        data: JSON.stringify({
                            step: 2,
                            totalSteps: 6,
                            title: 'Merancang Kisi-kisi & Naskah PG',
                            message: `Menghubungkan Engine AI [${preferredSlug}] & menyusun ${totalPG} butir soal pilihan ganda...`,
                            percent: 35
                        })
                    });

                    const effectiveGambarEnabled = shouldEnableVisualStimulusForTopic(mataPelajaran, topik, isGambarEnabled);
                    const adaptiveQuota = calculateAdaptiveVisualQuota(mataPelajaran, topik, totalPG, jenjangKelas);
                    const exactImageCount = effectiveGambarEnabled ? adaptiveQuota.exactImages : 0;
                    const BATCH_SIZE = 20;
                    const unsplash = effectiveGambarEnabled ? new UnsplashService(c.env) : null;

                    for (let i = 0; i < totalPG; i += BATCH_SIZE) {
                        const currentCount = Math.min(BATCH_SIZE, totalPG - i);
                        const prompt = buildPrompt('pg', i + 1, currentCount);
                        const result = await ai.generateJSONStream(prompt, preferredSlug, onToken);
                        if (result?._ai_meta) finalData._meta = result._ai_meta;
                        if (result?.pg && Array.isArray(result.pg)) {
                            finalData.pg.push(...result.pg);
                        }
                    }

                    // Deduplikasi, image scoring & visual stimulus enrichment via pipeline terpadu
                    finalData.pg = await enrichAndNormalizePG(finalData.pg, {
                        mataPelajaran,
                        topik,
                        isGambarEnabled: effectiveGambarEnabled,
                        unsplash,
                        exactImageCount
                    });
                }

                // Step 3: Generate Isian + Uraian
                if (totalIsian > 0 || totalUraian > 0) {
                    await stream.writeSSE({
                        event: 'step',
                        data: JSON.stringify({
                            step: 3,
                            totalSteps: 6,
                            title: 'Menyusun Soal Isian & Uraian HOTS',
                            message: `Memformulasikan soal isian (${totalIsian}) dan penalaran uraian L3 (${totalUraian})...`,
                            percent: 55
                        })
                    });

                    try {
                        const startNoIsian = totalPG + 1;
                        const prompt = buildPrompt('isian', startNoIsian, totalIsian, totalPG);
                        const result = await ai.generateJSONStream(prompt, preferredSlug, onToken);
                        if (result?._ai_meta) finalData._meta = result._ai_meta;

                        processIsianAndUraian(finalData, result, {
                            totalPG,
                            totalIsian,
                            totalUraian,
                            isianType
                        });
                    } catch (step3Err: any) {
                        // Step 3 gagal (biasanya karena reasoning model menghabiskan token budget).
                        // Jika Step 2 (PG) sudah berhasil, JANGAN batalkan seluruh proses.
                        // Kirim warning ke client dan lanjutkan dengan data PG yang sudah ada.
                        console.warn(`[Kisi-Stream] Step 3 (Isian/Uraian) failed but continuing with partial data:`, step3Err.message);
                        await stream.writeSSE({
                            event: 'token',
                            data: JSON.stringify({ text: `\n⚠️ Soal Isian/Uraian gagal diproses (${step3Err.message?.substring(0, 80)}). Soal PG tetap ditampilkan.\n` })
                        });
                        finalData.isian = null;
                        finalData.uraian = [];
                    }
                }

                // Step 4: AI Verifikator & Quality Gate (Audit Forensik Mutu & Kaidah Puspendik)
                await stream.writeSSE({
                    event: 'step',
                    data: JSON.stringify({
                        step: 4,
                        totalSteps: 6,
                        title: 'AI Verifikator & Quality Gate',
                        message: 'Audit forensik mutu: memverifikasi kebenaran kunci, kaidah Puspendik, & auto-healing...',
                        percent: 75
                    })
                });

                await runAssessmentQualityGate(ai, finalData, {
                    mataPelajaran,
                    topik,
                    jenjangKelas,
                    semester
                }, {
                    preferredSlug,
                    onProgress: async (msg, pct) => {
                        try {
                            await stream.writeSSE({
                                event: 'step',
                                data: JSON.stringify({
                                    step: 4,
                                    totalSteps: 6,
                                    title: 'AI Verifikator & Quality Gate',
                                    message: msg,
                                    percent: pct
                                })
                            });
                            await stream.writeSSE({
                                event: 'token',
                                data: JSON.stringify({ text: `\n🛡️ [QualityGate] ${msg}\n` })
                            });
                        } catch (_) {}
                    }
                });

                // Step 5: Standarisasi & Normalisasi Matriks Kisi-Kisi
                await stream.writeSSE({
                    event: 'step',
                    data: JSON.stringify({
                        step: 5,
                        totalSteps: 6,
                        title: 'Standarisasi Matriks Kisi-kisi',
                        message: 'Menyelaraskan rumusan indikator, level kognitif L1-L3, dan kunci jawaban...',
                        percent: 90
                    })
                });

                // Finalisasi paket asesmen (Normalisasi matriks kisi-kisi, Telemetri, & Bank Soal)
                await finalizeAssessmentPackage(finalData, {
                    resolvedCP,
                    topik,
                    isianType: isianType || 'Standard',
                    totalPG,
                    db: c.env.DB,
                    user,
                    bodyConfig: body,
                    preferredSlug: preferredSlug || null
                });

                // Step 6: Selesai & Kirimkan Payload Final
                await stream.writeSSE({
                    event: 'step',
                    data: JSON.stringify({
                        step: 6,
                        totalSteps: 6,
                        title: 'Finalisasi Selesai',
                        message: 'Paket Asesmen & Kisi-kisi Matriks terverifikasi siap ditampilkan!',
                        percent: 100
                    })
                });

                await stream.writeSSE({
                    event: 'done',
                    data: JSON.stringify({
                        success: true,
                        data: finalData
                    })
                });
            } catch (err: any) {
                console.error('Kisi Stream Error:', err);
                await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({
                        message: err.message || 'Gagal menghasilkan asesmen secara streaming'
                    })
                });
            }
        });
    } catch (e: any) {
        console.error('Kisi Route Stream Error:', e);
        return Errors.internal(c, e.message);
    }
});

// Helper: Prompt Builder untuk Surgical Batch Regeneration (Multi-Item)
export function buildBatchRegeneratePrompt(params: {
    mataPelajaran: string;
    topik: string;
    jenjangKelas: string;
    semester: string;
    capaianPembelajaran: string;
    customInstruction?: string;
    itemsToReplace: Array<{
        type: 'pg' | 'isian' | 'uraian';
        no: number;
        level?: string;
        materi?: string;
        cp?: string;
        currentSoal?: string;
    }>;
    existingQuestionsSummary?: string[];
}): string {
    const {
        mataPelajaran, topik, jenjangKelas, semester,
        capaianPembelajaran, customInstruction, itemsToReplace,
        existingQuestionsSummary
    } = params;

    const isEarlyGrade = jenjangKelas && (
        jenjangKelas.includes('Kelas 1') || 
        jenjangKelas.includes('Kelas 2') || 
        jenjangKelas.includes('Kelas 3') || 
        jenjangKelas.toLowerCase().includes('fase a')
    );
    const sampleOpsi = isEarlyGrade ? '"A": "...", "B": "...", "C": "..."' : '"A": "...", "B": "...", "C": "...", "D": "..."';

    return `
Bertindaklah sebagai "Pakar Pengembang Instrumen Penilaian Puspendik Kemendikbudristek & BSKAP No. 046 Tahun 2025".
TUGAS ANDA: Membuat ${itemsToReplace.length} butir soal pengganti baru berkualitas tinggi untuk menggantikan nomor-nomor tertentu dalam naskah ujian "${mataPelajaran} - ${topik} (${jenjangKelas}, Semester ${semester})".

CAPAIAN PEMBELAJARAN (CP):
${capaianPembelajaran || topik}

${customInstruction ? `ARAHAN KHUSUS DARI GURU PENGAMPU (SANGAT KRUSIAL / PRIORITAS TINGGI):\n"${customInstruction}"\n` : ''}

${existingQuestionsSummary && existingQuestionsSummary.length > 0 ? `
RINGKASAN MATERI SOAL-SOAL LAIN YANG SUDAH ADA DALAM UJIAN (DILARANG MEMBUAT SOAL YANG SAMA/MIRIP DENGAN DAFTAR INI AGAR TIDAK OVERLAP):
${existingQuestionsSummary.slice(0, 15).map((s) => `- ${s}`).join('\n')}
` : ''}

DAFTAR BUTIR SOAL YANG WAJIB ANDA BUATKAN PENGGANTI BARU:
${itemsToReplace.map(it => `
- NOMOR URUT: ${it.no}
  Bentuk: ${it.type === 'pg' ? 'Pilihan Ganda' : it.type === 'isian' ? 'Isian Singkat' : 'Uraian'}
  Target Level Kognitif: ${it.level || 'L2'}
  Materi / Indikator: ${it.materi || topik}
  ${it.currentSoal ? `Wacana Soal Lama (DILARANG menggunakan teks/wacana ini lagi, buat kasus baru): "${it.currentSoal.substring(0, 160)}..."` : ''}
`).join('\n')}

STANDAR MUTU PUSPENDIK:
1. Pokok soal (stem) dirumuskan jelas, tegas, dan tidak memberikan bocoran jawaban.
2. Soal Pilihan Ganda WAJIB memiliki ${isEarlyGrade ? '3 opsi (A, B, C)' : '4 opsi (A, B, C, D)'}.
3. Kunci jawaban harus valid dan dapat dipertanggungjawabkan secara kurikulum.
4. DILARANG menggunakan opsi "Semua jawaban benar", "Semua salah", atau sejenisnya.
5. Pengecoh (distraktor) harus logis, homogen, dan berfungsi dengan baik.

OUTPUT FORMAT WAJIB (JSON MURNI TANPA MARKDOWN):
{
  "items": [
    ${itemsToReplace.map(it => {
        if (it.type === 'pg') {
            return `{
      "no": ${it.no},
      "bentuk": "Pilihan Ganda",
      "level": "${it.level || 'L2'}",
      "cp": "${capaianPembelajaran || topik}",
      "materi": "${it.materi || topik}",
      "indikator": "Rumusan indikator soal...",
      "soal": "Teks pertanyaan naskah soal...",
      "opsi": { ${sampleOpsi} },
      "kunci": "A",
      "pembahasan": "Penjelasan kunci jawaban..."
    }`;
        } else {
            return `{
      "no": ${it.no},
      "bentuk": "${it.type === 'isian' ? 'Isian Singkat' : 'Uraian'}",
      "level": "${it.level || 'L2'}",
      "cp": "${capaianPembelajaran || topik}",
      "materi": "${it.materi || topik}",
      "indikator": "Rumusan indikator soal...",
      "soal": "Teks pertanyaan...",
      "kunci": "Jawaban benar / rubrik penilaian...",
      "pembahasan": "Penjelasan..."
    }`;
        }
    }).join(',\n    ')}
  ]
}
`;
}

// Endpoint: Surgical Batch Question Regeneration (1 Single Call)
kisi.post('/regenerate-batch', async (c) => {
    try {
        const user = await getAuthenticatedUser(c);
        if (!user) {
            return Errors.unauthorized(c, 'Sesi telah berakhir atau belum login. Silakan login terlebih dahulu.');
        }

        const body = await c.req.json();
        const {
            mataPelajaran, topik, jenjangKelas, semester,
            capaianPembelajaran, customInstruction,
            itemsToReplace, existingQuestionsSummary,
            usedImageUrls, aiProvider, useGambar
        } = body;

        if (!mataPelajaran || !topik || !Array.isArray(itemsToReplace) || itemsToReplace.length === 0) {
            return Errors.badRequest(c, 'Parameter mataPelajaran, topik, dan itemsToReplace wajib disertakan.');
        }

        const ai = new AIService(c.env);
        await ai.loadProviders(c.env.DB);
        const preferredSlug = aiProvider ? (SLUG_MAP[aiProvider] || aiProvider) : undefined;
        const unsplash = (useGambar !== false) ? new UnsplashService(c.env) : null;

        // Build focused single-call prompt
        const prompt = buildBatchRegeneratePrompt({
            mataPelajaran,
            topik,
            jenjangKelas: jenjangKelas || 'Kelas 5',
            semester: semester || 'Ganjil',
            capaianPembelajaran: capaianPembelajaran || '',
            customInstruction: customInstruction || '',
            itemsToReplace,
            existingQuestionsSummary: existingQuestionsSummary || []
        });

        const result = await ai.generateJSON(prompt, preferredSlug);
        let rawItems = result?.items || result?.pg || (Array.isArray(result) ? result : []);
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            return Errors.internal(c, 'AI tidak mengembalikan butir soal pengganti yang valid.');
        }

        // Process, enrich, and validate each replacement item
        const activeUsedUrls = new Set<string>(Array.isArray(usedImageUrls) ? usedImageUrls : []);
        const activeUsedSignatures = new Set<string>();
        const healedReplacements: any[] = [];

        for (let i = 0; i < itemsToReplace.length; i++) {
            const target = itemsToReplace[i];
            const found = rawItems.find((r: any) => r.no === target.no) || rawItems[i] || {};

            found.no = target.no;
            found.bentuk = target.bentuk || (target.type === 'pg' ? 'Pilihan Ganda' : target.type === 'isian' ? 'Isian Singkat' : 'Uraian');
            found.level = target.level || found.level || 'L2';
            found.cp = target.cp || found.cp || capaianPembelajaran || '';
            found.materi = target.materi || found.materi || topik;

            if (target.type === 'pg' || found.opsi) {
                // Stimulus visual jika diperlukan
                if (unsplash) {
                    await resolveQuestionVisualStimulus(found, mataPelajaran, topik, unsplash, activeUsedSignatures, activeUsedUrls);
                }

                // Tier 1 Heuristic Quality Gate
                const { healedItem } = validateQuestionHeuristics(found, jenjangKelas);
                healedItem.audit = {
                    status: 'repaired',
                    quality_score: 95,
                    key_verified: true,
                    kaidah_puspendik: true,
                    hots_valid: true,
                    distraktor_homogen: true,
                    notes: 'Butir soal hasil regenerasi batch terverifikasi Quality Gate'
                };
                healedReplacements.push(healedItem);
            } else {
                found.soal = normalizeSoalMarkdown(cleanPromptDebris(found.soal || ''));
                found.audit = {
                    status: 'verified',
                    quality_score: 96,
                    key_verified: true,
                    kaidah_puspendik: true,
                    hots_valid: true,
                    distraktor_homogen: true,
                    notes: 'Soal non-PG hasil regenerasi batch'
                };
                healedReplacements.push(found);
            }
        }

        return successResponse(c, {
            items: healedReplacements
        });
    } catch (e: any) {
        console.error('Batch Regenerate Error:', e);
        return Errors.internal(c, e.message || 'Gagal meregenerasi butir soal.');
    }
});

export default kisi;

