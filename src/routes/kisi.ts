import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import { UnsplashService } from '../services/unsplash';
import { generateCrossword } from '../lib/crossword';
import { getCookie, getCurrentUser } from '../lib/auth';
import { recordAIGeneration } from '../lib/telemetry';
import { getOfficialCP, cpElementsData } from '../lib/cp-data';
import { type AppBindings } from '../types/env';

const kisi = new Hono<{ Bindings: AppBindings }>();

// Endpoint referensi Capaian Pembelajaran resmi BSKAP No. 046 Tahun 2025
kisi.get('/cp-reference', async (c) => {
    const mapel = c.req.query('mataPelajaran') || c.req.query('mapel') || '';
    const kelas = c.req.query('jenjangKelas') || c.req.query('kelas') || '';
    const officialCP = getOfficialCP(mapel, kelas);

    const k = kelas.toLowerCase();
    const fase = (k.includes('1') || k.includes('2')) ? 'Fase A'
               : (k.includes('3') || k.includes('4')) ? 'Fase B'
               : (k.includes('5') || k.includes('6')) ? 'Fase C'
               : null;

    let elements: Record<string, string> | null = null;
    if (fase) {
        const normalizedSubject = mapel.toLowerCase();
        const subjectKeys = Object.keys(cpElementsData);
        const matchedKey = subjectKeys.find(key => {
            const lowerKey = key.toLowerCase();
            return normalizedSubject.includes(lowerKey) || lowerKey.includes(normalizedSubject) ||
                   (lowerKey.includes('agama') && normalizedSubject.includes('agama')) ||
                   (lowerKey.includes('pancasila') && normalizedSubject.includes('pancasila')) ||
                   (lowerKey.includes('ipas') && normalizedSubject.includes('ipas')) ||
                   (lowerKey.includes('koding') && normalizedSubject.includes('koding')) ||
                   (lowerKey.includes('seni') && normalizedSubject.includes('seni'));
        });
        if (matchedKey && cpElementsData[matchedKey]?.[fase]) {
            elements = cpElementsData[matchedKey][fase];
        }
    }

    return successResponse(c, {
        mataPelajaran: mapel,
        jenjangKelas: kelas,
        fase,
        cp: officialCP || '',
        elements: elements || {},
        source: 'Keputusan Kepala BSKAP No. 046 Tahun 2025'
    });
});

// Helper: normalisasi metadata kisi-kisi untuk setiap butir soal
export const normalizeItemKisiMetadata = (item: any, defaultBentuk: string, defaultNo: number, fallbackCP: string, fallbackMateri: string) => {
    if (!item) return item;
    item.no = item.no || defaultNo;
    item.cp = (item.cp && String(item.cp).trim()) || (fallbackCP && String(fallbackCP).trim()) || `Peserta didik dapat memahami dan menerapkan konsep dasar ${fallbackMateri || 'materi terkait'}.`;
    item.materi = (item.materi && String(item.materi).trim()) || fallbackMateri || 'Materi Pokok';
    if (!item.indikator || !String(item.indikator).trim()) {
        item.indikator = `Disajikan pertanyaan mengenai ${item.materi}, peserta didik dapat menentukan jawaban yang tepat.`;
    }
    // Standardisasi Level Kognitif ke L1, L2, L3 (Puspendik / BSKAP)
    const rawLevel = String(item.level || '').toUpperCase();
    if (rawLevel.includes('L3') || rawLevel.includes('HOTS') || rawLevel.includes('C4') || rawLevel.includes('C5') || rawLevel.includes('C6')) {
        item.level = 'L3';
    } else if (rawLevel.includes('L2') || rawLevel.includes('MOTS') || rawLevel.includes('C3')) {
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

// Helper: normalisasi Markdown table agar terpisah rapi dari teks pembuka & pertanyaan
export const normalizeSoalMarkdown = (text: string): string => {
    if (!text) return '';
    const clean = String(text)
        .replace(/\[(?:gambar|foto|diagram|ilustrasi|deskripsi)[^\]]*\]/gi, '')
        .replace(/\[[^\]]*\]/g, '')
        .trim();
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
          * Prioritas: Foto resmi tokoh pahlawan nasional, lambang Garuda Pancasila/lembaga negara, gedung bersejarah, piagam proklamasi, atau peta kepulauan.
          * "gambar_keyword": Nama tokoh/tempat resmi Bahasa Indonesia (contoh: "Ir. Soekarno", "Garuda Pancasila", "Rumah Laksamana Maeda", "Candi Borobudur").
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
          * Prioritas: Bangun ruang 3D (kubus, balok, tabung, kerucut, bola, prisma), jaring-jaring bangun ruang, sudut (siku-siku, lancip, tumpul), diagram pecahan lingkaran, bangun datar bersudut.
          * "gambar_keyword": Istilah geometri bahasa Inggris (contoh: "geometric cube net", "cylinder 3d geometry", "right angle triangle", "fraction circle diagram").
          * "gambar_prompt_en": "clean 2D geometric vector drawing of [geometry shape], pure white background, crisp black outlines, mathematical textbook illustration, no distortion, no text labels"`;
    }
    if (m.includes('pjok') || m.includes('jasmani') || m.includes('olahraga')) {
        return `PANDUAN VISUAL MAPEL PJOK:
          * Prioritas: Peragaan teknik gerak olahraga (passing bawah bola voli, servis bulutangkis, posisi kaki menendang bola, start lari, sikap lilin senam lantai, gerakan renang).
          * "gambar_keyword": Istilah olahraga/gerakan (contoh: "Volleyball underhand pass", "Football kicking technique", "Floor gymnastics posture", "Badminton grip").
          * "gambar_prompt_en": "2D clean vector illustration demonstrating the physical movement posture of [sport technique], side view, sports education diagram, white background, athletic anatomy"`;
    }
    if (m.includes('inggris') || m.includes('bahasa indonesia')) {
        return `PANDUAN VISUAL MAPEL BAHASA:
          * Prioritas: Benda konkret, hewan, profesi/pekerjaan, aktivitas sehari-hari, rambu lalu lintas, atau fasilitas umum.
          * "gambar_keyword": Nama objek/hewan/profesi (contoh: "Dentist profession", "Traffic sign", "Zebra animal", "Public library").
          * "gambar_prompt_en": "clear photograph of [object/profession/animal], isolated on clean white background, educational textbook style"`;
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
      * Prioritas: Siklus alam (siklus air, metamorfosis), penampang organ tubuh (paru-paru, jantung), penampang sel/daun, fotosintesis, tata surya, rantai makanan ekosistem.
      * "gambar_keyword": Istilah sains (contoh: "Siklus air", "Fotosintesis", "Metamorfosis kupu-kupu", "Sistem pernapasan manusia", "Rantai makanan").
      * "gambar_prompt_en": "detailed 2D scientific textbook illustration of [topic], labeled vector diagram, clean white background, educational biology/physics style"`;
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
            "indikator": "Indikator Soal baku (contoh: Disajikan wacana/stimulus ..., peserta didik dapat ...)",
            "level": "L1/L2/L3 (Pilih salah satu sesuai standar Puspendik)",
            "bentuk": "Pilihan Ganda",
            "soal": "Pertanyaan Pilihan Ganda (sajikan langsung tanpa teks penjelasan kurung siku)",
            "opsi": { "A": "...", "B": "...", "C": "...", "D": "..." },
            "kunci": "A/B/C/D",
            "gambar_keyword": "kata kunci ringkas 1-3 kata sesuai panduan visual mapel",
            "gambar_prompt_en": "detailed English visual description sesuai panduan visual mapel (15-25 kata)"
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
                "indikator": "Indikator Soal baku (Disajikan ..., peserta didik dapat ...)",
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
                "indikator": "Indikator Soal baku (Disajikan stimulus kasus/data ..., peserta didik dapat menganalisis/merancang ...)",
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

    let gambarRule = '';
    if (isPG) {
        if (isGambarEnabled) {
            const exactImages = Math.max(1, Math.round(count * 0.2));
            gambarRule = `\n                7. ATURAN GAMBAR (KUNCI TEPAT ${exactImages} BUTIR SOAL BERGAMBAR): Fitur ilustrasi gambar AKTIF. Dari ${count} butir soal PG ini, Anda WAJIB memilih TEPAT ${exactImages} butir soal (tidak boleh lebih dan tidak boleh kurang) yang menggunakan stimulus visual berupa foto/objek/diagram konkret yang jelas.
            - PADA ${exactImages} BUTIR SOAL BERGAMBAR TERSEBUT:
              * ${getSubjectImagePromptGuideline(mataPelajaran)}
            - LARANGAN MUTLAK PADA SOAL BERGAMBAR:
              * DILARANG KERAS membuat soal diagram alur/bagan bertuliskan teks atau diagram pohon faktor angka.
              * DILARANG KERAS menuliskan teks deskripsi seperti "[Diagram menunjukkan...]" di dalam teks soal!
            - Pada butir soal lainnya, WAJIB mengosongkan field ("gambar_keyword": "", "gambar_prompt_en": "").`;
        } else {
            gambarRule = `\n                7. GAMBAR: Dilarang menyertakan gambar ("gambar_keyword": "", "gambar_prompt_en": "" untuk semua soal).`;
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
        1. CP (Capaian Pembelajaran): ${resolvedCP ? `Berdasarkan rujukan resmi BSKAP No. 046 Tahun 2025: "${resolvedCP}". Formulasikan rumusan CP yang spesifik dan relevan untuk butir-butir soal bertopik "${topik}".` : 'Formulasikan otomatis sesuai capaian pembelajaran resmi BSKAP No. 046 Tahun 2025 untuk topik ini'}
        2. LINGKUP MATERI: ${topik}
        3. PROPORSI TARGET LEVEL: ${hotsRatio || '30:40:30'} (L1 : L2 : L3). Terapkan secara presisi!
        4. TUGAS: ${taskDesc}
        5. ATURAN INDIKATOR SOAL: Setiap butir soal WAJIB memiliki indikator soal baku:
           "Disajikan [stimulus/konteks], peserta didik dapat [kata kerja operasional] [materi]".
        6. DISTRIBUSI KUNCI PG: Distribusikan kunci jawaban (A/B/C/D) secara ACAK dan MERATA.
        7. ATURAN SOAL L3 / PENALARAN (WAJIB): Setiap soal yang diberi label "L3" WAJIB memiliki STIMULUS — berupa mini-wacana, penggalan cerita, data/angka sederhana, pernyataan kasus nyata — yang ditulis SEBELUM pertanyaan. Pertanyaan L3 tidak boleh bisa dijawab tanpa menelaah stimulusnya.${uraianRule}
        8. ATURAN FORMAT TABEL PADA SOAL:
           - Jika menyajikan stimulus berupa tabel data, posisikan rapi dengan baris baru.\\n\\n.${gambarRule}
        ${isPG ? '9.' : '8.'} LARANGAN: JANGAN menulis teks label "L1", "L2", "L3" di dalam teks pertanyaan yang dibaca murid. Label disimpan pada field "level". JANGAN menambahkan field "gambar" ke soal isian maupun uraian.${isianRule}
        ${getKelasAdaptation(jenjangKelas)}

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

// Generate Asesmen (Soal) via AI (Standar)
kisi.post('/generate', async (c) => {
    try {
        const body = await c.req.json();
        const {
            namaSekolah, namaGuru, nipGuru, mataPelajaran, topik,
            jenjangKelas, semester, jenisUjian, capaianPembelajaran,
            jumlahPG, jumlahIsian, jumlahUraian,
            hotsRatio, isianType, aiProvider, useGambar
        } = body;

        const isGambarEnabled = useGambar !== false && useGambar !== 'false' && useGambar !== 0 && useGambar !== '0';

        // Dapatkan rujukan resmi Capaian Pembelajaran BSKAP No. 046 Tahun 2025
        const officialCP = getOfficialCP(mataPelajaran, jenjangKelas);
        const resolvedCP = (capaianPembelajaran && String(capaianPembelajaran).trim()) || officialCP || '';

        const ai = new AIService(c.env);
        await ai.loadProviders(c.env.DB);

        const slugMap: Record<string, string> = {
            vertex: 'vertex-proxy',
            gemini: 'gemini-flash',
            bedrock: 'bedrock-claude',
            mistral: 'mistral-large',
            z_ai: 'glm4-flash'
        };
        const preferredSlug = slugMap[aiProvider] || aiProvider;

        const totalPG = parseInt(jumlahPG) || 0;
        const totalIsian = parseInt(jumlahIsian) || 0;
        const totalUraian = parseInt(jumlahUraian) || 0;
        const finalData: any = { pg: [], isian: null, uraian: [] };

        const buildPrompt = (type: string, startNo: number, count: number, totalPrevPG = 0) =>
            buildAssessmentPrompt({
                type, startNo, count, totalPrevPG, totalIsian, totalUraian,
                mataPelajaran, topik, jenjangKelas, semester, resolvedCP, hotsRatio,
                isianType, isGambarEnabled
            });

        // Generate PG
        if (totalPG > 0) {
            const exactImageCount = isGambarEnabled ? Math.max(1, Math.round(totalPG * 0.2)) : 0;
            const BATCH_SIZE = 20;
            const unsplash = isGambarEnabled ? new UnsplashService(c.env) : null;

            for (let i = 0; i < totalPG; i += BATCH_SIZE) {
                const currentCount = Math.min(BATCH_SIZE, totalPG - i);
                const prompt = buildPrompt('pg', i + 1, currentCount);
                const result = await ai.generateJSON(prompt, preferredSlug);
                if (result?._ai_meta) finalData._meta = result._ai_meta;
                if (result?.pg && Array.isArray(result.pg)) {
                    finalData.pg.push(...result.pg);
                }
            }

            // Deduplication: hapus soal yang teks awalnya sama (normalize lowercase, 100 char pertama)
            const seenSoal = new Set<string>();
            finalData.pg = finalData.pg.filter((q: any) => {
                const normalized = String(q.soal || '')
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 100);
                if (seenSoal.has(normalized)) return false;
                seenSoal.add(normalized);
                return true;
            });
            // Renumber setelah dedup
            finalData.pg.forEach((q: any, i: number) => { q.no = i + 1; });

            // ENFORCE EXACT IMAGE COUNT: Kunci jumlah soal bergambar TEPAT sesuai kuota (misal 2 untuk 10 soal, 3 untuk 15 soal)
            if (isGambarEnabled && unsplash && exactImageCount > 0 && finalData.pg.length > 0) {
                // Beri skor pada setiap butir soal untuk menentukan butir mana yang paling tepat bergambar
                const scoredQuestions = finalData.pg.map((q: any, index: number) => {
                    let score = 0;
                    const soalText = String(q.soal || '').toLowerCase();
                    if (q.gambar_keyword && q.gambar_keyword.trim() !== '') score += 10;
                    if (soalText.includes('gambar') || soalText.includes('diagram') || soalText.includes('bagan') || soalText.includes('skema') || soalText.includes('kalender') || soalText.includes('pohon') || soalText.includes('grafik')) score += 5;
                    if (soalText.includes('perhatikan') || soalText.includes('berikut')) score += 3;
                    return { q, index, score };
                });

                // Urutkan berdasarkan relevansi visual tertinggi
                scoredQuestions.sort((a, b) => b.score - a.score);

                // Ambil TEPAT sebanyak exactImageCount butir soal
                const targetSelected = new Set(scoredQuestions.slice(0, exactImageCount).map(item => item.q));

                // Pasang gambar HANYA pada targetSelected, dan hapus gambar dari butir soal lainnya
                for (const q of finalData.pg) {
                    if (targetSelected.has(q)) {
                        // Extract any bracketed description inside soal if present to enrich the visual prompt
                        let bracketHint = '';
                        const bracketMatch = String(q.soal || '').match(/\[(?:gambar|foto|diagram|ilustrasi|deskripsi)[^\]]*:?([^\]]*)\]/i);
                        if (bracketMatch && bracketMatch[1]) {
                            bracketHint = bracketMatch[1].trim();
                        }

                        // Clean bracketed text completely from the student's question and normalize Markdown tables
                        q.soal = normalizeSoalMarkdown(q.soal);

                        const searchKeyword = q.gambar_keyword || topik || 'diagram';
                        const promptEn = q.gambar_prompt_en || bracketHint || `${topik} educational textbook diagram, clean white background`;
                        const subjectContext = `${mataPelajaran} ${topik}`;

                        try {
                            const img = await unsplash.searchImage(searchKeyword, q.soal, subjectContext, promptEn);
                            if (img) {
                                q.gambar = { url: img.url, credit: img.creditName };
                            }
                        } catch (e) {
                            console.error('Image search error:', e);
                        }
                    } else {
                        // Bersihkan field gambar agar soal lain 100% bebas gambar
                        delete q.gambar;
                        delete q.gambar_keyword;
                        delete q.gambar_prompt_en;
                        q.soal = normalizeSoalMarkdown(q.soal);
                    }
                }
            } else {
                // Jika useGambar nonaktif, pastikan semua soal bersih dari gambar dan placeholder
                for (const q of finalData.pg) {
                    delete q.gambar;
                    delete q.gambar_keyword;
                    delete q.gambar_prompt_en;
                    q.soal = normalizeSoalMarkdown(q.soal);
                }
            }
        }

        // Generate Isian + Uraian
        if (totalIsian > 0 || totalUraian > 0) {
            const startNoIsian = totalPG + 1;
            const prompt = buildPrompt('isian', startNoIsian, totalIsian, totalPG);
            const result = await ai.generateJSON(prompt, preferredSlug);
            if (result?._ai_meta) finalData._meta = result._ai_meta;

            // Handle Isian (hanya jika totalIsian > 0)
            if (totalIsian > 0 && result?.isian) {
                finalData.isian = result.isian;
                finalData.isian.type = isianType || 'Standard';

                // Pastikan tidak ada field gambar yang bocor dari AI ke soal isian
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
                        // Sync isian data numbers with crossword placement numbers
                        // so the answer key matches the grid numbering
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

            // Handle Uraian (hanya jika totalUraian > 0)
            if (totalUraian > 0 && result?.uraian && Array.isArray(result.uraian)) {
                finalData.uraian = result.uraian.slice(0, totalUraian);
                // Pastikan tidak ada field gambar yang bocor dari AI ke soal uraian
                finalData.uraian.forEach((q: any) => {
                    delete q.gambar;
                    delete q.gambar_keyword;
                    q.soal = normalizeSoalMarkdown(q.soal);
                });

                // Renumber uraian to continue from the last isian number
                // (important for Crossword where isian numbers come from placement)
                if (finalData.isian && finalData.isian.data && finalData.isian.data.length > 0) {
                    const maxIsianNo = Math.max(...finalData.isian.data.map((q: any) => q.no || 0));
                    finalData.uraian.forEach((q: any, i: number) => {
                        q.no = maxIsianNo + 1 + i;
                    });
                }
            } else {
                finalData.uraian = [];
            }
        }

        // Normalisasi metadata kisi-kisi untuk seluruh butir soal (PG, Isian, Uraian)
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

        // Record usage telemetry for school & teacher analytics
        try {
            const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie') || c.req.raw?.headers?.get('Cookie');
            const authHeader = c.req.header('Authorization') || c.req.header('authorization');
            const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
            const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
            const user = await getCurrentUser(c.env.DB, sessionId);
            await recordAIGeneration(c.env.DB, {
                user_id: user?.id || 1,
                user_nama: user?.nama || (namaGuru || 'Guru'),
                sekolah: user?.sekolah || (namaSekolah || 'SDN 2 Nangerang'),
                feature_type: 'ASESMEN',
                mata_pelajaran: mataPelajaran,
                topik: topik,
                jenjang_kelas: jenjangKelas,
                ai_provider: preferredSlug,
            });

            // Auto-save to Bank Soal (server-side persistence for collaborative sharing)
            try {
                await c.env.DB.prepare(`
                    INSERT INTO bank_soal (
                        user_id, user_nama, sekolah, mata_pelajaran, topik,
                        jenjang_kelas, semester, jenis_ujian, capaian_pembelajaran,
                        jumlah_pg, jumlah_isian, jumlah_uraian, isian_type, hots_ratio,
                        content, ai_provider, is_public
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `).bind(
                    user?.id || 1,
                    user?.nama || (namaGuru || 'Guru'),
                    user?.sekolah || (namaSekolah || ''),
                    mataPelajaran || '',
                    topik || '',
                    jenjangKelas || '',
                    semester || null,
                    jenisUjian || null,
                    capaianPembelajaran || null,
                    totalPG, totalIsian, totalUraian,
                    isianType || 'Standard',
                    hotsRatio || '30:40:30',
                    JSON.stringify(finalData),
                    preferredSlug || null
                ).run();
            } catch (bankErr) {
                console.warn('[BankSoal] Auto-save failed (non-blocking):', bankErr);
            }
        } catch (_) {}

        return successResponse(c, finalData);

    } catch (e: any) {
        console.error('Asesmen Gen Error:', e);
        return Errors.internal(c, e.message);
    }
});

// Generate Asesmen (Soal) via AI Stream (SSE - Live Monitor)
kisi.post('/generate-stream', async (c) => {
    try {
        const body = await c.req.json();
        const {
            namaSekolah, namaGuru, nipGuru, mataPelajaran, topik,
            jenjangKelas, semester, jenisUjian, capaianPembelajaran,
            jumlahPG, jumlahIsian, jumlahUraian,
            hotsRatio, isianType, aiProvider, useGambar
        } = body;

        if (!topik || !String(topik).trim()) {
            return Errors.badRequest(c, 'Topik/Materi wajib diisi');
        }

        const isGambarEnabled = useGambar !== false && useGambar !== 'false' && useGambar !== 0 && useGambar !== '0';
        const officialCP = getOfficialCP(mataPelajaran, jenjangKelas);
        const resolvedCP = (capaianPembelajaran && String(capaianPembelajaran).trim()) || officialCP || '';

        const ai = new AIService(c.env);
        await ai.loadProviders(c.env.DB);

        const slugMap: Record<string, string> = {
            vertex: 'vertex-proxy',
            gemini: 'gemini-flash',
            bedrock: 'bedrock-claude',
            mistral: 'mistral-large',
            z_ai: 'glm4-flash'
        };
        const preferredSlug = slugMap[aiProvider] || aiProvider;

        const totalPG = parseInt(jumlahPG) || 0;
        const totalIsian = parseInt(jumlahIsian) || 0;
        const totalUraian = parseInt(jumlahUraian) || 0;
        const finalData: any = { pg: [], isian: null, uraian: [] };

        const buildPrompt = (type: string, startNo: number, count: number, totalPrevPG = 0) =>
            buildAssessmentPrompt({
                type, startNo, count, totalPrevPG, totalIsian, totalUraian,
                mataPelajaran, topik, jenjangKelas, semester, resolvedCP, hotsRatio,
                isianType, isGambarEnabled
            });

        return streamSSE(c, async (stream) => {
            try {
                // Step 1: Analisis Kurikulum & CP BSKAP 046/2025
                await stream.writeSSE({
                    event: 'step',
                    data: JSON.stringify({
                        step: 1,
                        totalSteps: 5,
                        title: 'Analisis CP BSKAP 046/2025',
                        message: `Menelaah materi "${topik}" berdasar rujukan resmi BSKAP No. 046/2025 (${jenjangKelas || 'SD'})...`,
                        percent: 15
                    })
                });

                // Callback pengalir token ke client
                const onToken = async (token: string) => {
                    await stream.writeSSE({
                        event: 'token',
                        data: JSON.stringify({ text: token })
                    });
                };

                // Step 2: Generate Pilihan Ganda (PG)
                if (totalPG > 0) {
                    await stream.writeSSE({
                        event: 'step',
                        data: JSON.stringify({
                            step: 2,
                            totalSteps: 5,
                            title: 'Merancang Kisi-kisi & Naskah PG',
                            message: `Menghubungkan Engine AI [${preferredSlug}] & menyusun ${totalPG} butir soal pilihan ganda...`,
                            percent: 35
                        })
                    });

                    const exactImageCount = isGambarEnabled ? Math.max(1, Math.round(totalPG * 0.2)) : 0;
                    const BATCH_SIZE = 20;
                    const unsplash = isGambarEnabled ? new UnsplashService(c.env) : null;

                    for (let i = 0; i < totalPG; i += BATCH_SIZE) {
                        const currentCount = Math.min(BATCH_SIZE, totalPG - i);
                        const prompt = buildPrompt('pg', i + 1, currentCount);
                        const result = await ai.generateJSONStream(prompt, preferredSlug, onToken);
                        if (result?._ai_meta) finalData._meta = result._ai_meta;
                        if (result?.pg && Array.isArray(result.pg)) {
                            finalData.pg.push(...result.pg);
                        }
                    }

                    // Deduplication
                    const seenSoal = new Set<string>();
                    finalData.pg = finalData.pg.filter((q: any) => {
                        const normalized = String(q.soal || '')
                            .toLowerCase()
                            .replace(/\s+/g, ' ')
                            .trim()
                            .substring(0, 100);
                        if (seenSoal.has(normalized)) return false;
                        seenSoal.add(normalized);
                        return true;
                    });
                    finalData.pg.forEach((q: any, i: number) => { q.no = i + 1; });

                    // Image enrichment
                    if (isGambarEnabled && unsplash && exactImageCount > 0 && finalData.pg.length > 0) {
                        const scoredQuestions = finalData.pg.map((q: any, index: number) => {
                            let score = 0;
                            const soalText = String(q.soal || '').toLowerCase();
                            if (q.gambar_keyword && q.gambar_keyword.trim() !== '') score += 10;
                            if (soalText.includes('gambar') || soalText.includes('diagram') || soalText.includes('bagan') || soalText.includes('skema') || soalText.includes('kalender') || soalText.includes('pohon') || soalText.includes('grafik')) score += 5;
                            if (soalText.includes('perhatikan') || soalText.includes('berikut')) score += 3;
                            return { q, index, score };
                        });
                        scoredQuestions.sort((a: any, b: any) => b.score - a.score);
                        const targetSelected = new Set(scoredQuestions.slice(0, exactImageCount).map((item: any) => item.q));

                        for (const q of finalData.pg) {
                            if (targetSelected.has(q)) {
                                let bracketHint = '';
                                const bracketMatch = String(q.soal || '').match(/\[(?:gambar|foto|diagram|ilustrasi|deskripsi)[^\]]*:?([^\]]*)\]/i);
                                if (bracketMatch && bracketMatch[1]) {
                                    bracketHint = bracketMatch[1].trim();
                                }
                                q.soal = normalizeSoalMarkdown(q.soal);
                                const searchKeyword = q.gambar_keyword || topik || 'diagram';
                                const promptEn = q.gambar_prompt_en || bracketHint || `${topik} educational textbook diagram, clean white background`;
                                const subjectContext = `${mataPelajaran} ${topik}`;

                                try {
                                    const img = await unsplash.searchImage(searchKeyword, q.soal, subjectContext, promptEn);
                                    if (img) {
                                        q.gambar = { url: img.url, credit: img.creditName };
                                    }
                                } catch (e) {
                                    console.error('Image search error:', e);
                                }
                            } else {
                                delete q.gambar;
                                delete q.gambar_keyword;
                                delete q.gambar_prompt_en;
                                q.soal = normalizeSoalMarkdown(q.soal);
                            }
                        }
                    } else {
                        for (const q of finalData.pg) {
                            delete q.gambar;
                            delete q.gambar_keyword;
                            delete q.gambar_prompt_en;
                            q.soal = normalizeSoalMarkdown(q.soal);
                        }
                    }
                }

                // Step 3: Generate Isian + Uraian
                if (totalIsian > 0 || totalUraian > 0) {
                    await stream.writeSSE({
                        event: 'step',
                        data: JSON.stringify({
                            step: 3,
                            totalSteps: 5,
                            title: 'Menyusun Soal Isian & Uraian HOTS',
                            message: `Memformulasikan soal isian (${totalIsian}) dan penalaran uraian L3 (${totalUraian})...`,
                            percent: 65
                        })
                    });

                    const startNoIsian = totalPG + 1;
                    const prompt = buildPrompt('isian', startNoIsian, totalIsian, totalPG);
                    const result = await ai.generateJSONStream(prompt, preferredSlug, onToken);
                    if (result?._ai_meta) finalData._meta = result._ai_meta;

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

                    if (totalUraian > 0 && result?.uraian && Array.isArray(result.uraian)) {
                        finalData.uraian = result.uraian.slice(0, totalUraian);
                        finalData.uraian.forEach((q: any) => {
                            delete q.gambar;
                            delete q.gambar_keyword;
                            q.soal = normalizeSoalMarkdown(q.soal);
                        });

                        if (finalData.isian && finalData.isian.data && finalData.isian.data.length > 0) {
                            const maxIsianNo = Math.max(...finalData.isian.data.map((q: any) => q.no || 0));
                            finalData.uraian.forEach((q: any, i: number) => {
                                q.no = maxIsianNo + 1 + i;
                            });
                        }
                    } else {
                        finalData.uraian = [];
                    }
                }

                // Step 4: Standarisasi & Normalisasi Matriks Kisi-Kisi
                await stream.writeSSE({
                    event: 'step',
                    data: JSON.stringify({
                        step: 4,
                        totalSteps: 5,
                        title: 'Standarisasi Matriks Kisi-kisi',
                        message: 'Menyelaraskan rumusan indikator, level kognitif L1-L3, dan kunci jawaban...',
                        percent: 85
                    })
                });

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

                // Telemetry & Bank Soal Persistence
                try {
                    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie');
                    const authHeader = c.req.header('Authorization');
                    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
                    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
                    const user = await getCurrentUser(c.env.DB, sessionId);
                    await recordAIGeneration(c.env.DB, {
                        user_id: user?.id || 1,
                        user_nama: user?.nama || (namaGuru || 'Guru'),
                        sekolah: user?.sekolah || (namaSekolah || 'SDN 2 Nangerang'),
                        feature_type: 'ASESMEN',
                        mata_pelajaran: mataPelajaran,
                        topik: topik,
                        jenjang_kelas: jenjangKelas,
                        ai_provider: preferredSlug,
                    });

                    try {
                        await c.env.DB.prepare(`
                            INSERT INTO bank_soal (
                                user_id, user_nama, sekolah, mata_pelajaran, topik,
                                jenjang_kelas, semester, jenis_ujian, capaian_pembelajaran,
                                jumlah_pg, jumlah_isian, jumlah_uraian, isian_type, hots_ratio,
                                content, ai_provider, is_public
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                        `).bind(
                            user?.id || 1,
                            user?.nama || (namaGuru || 'Guru'),
                            user?.sekolah || (namaSekolah || ''),
                            mataPelajaran || '',
                            topik || '',
                            jenjangKelas || '',
                            semester || null,
                            jenisUjian || null,
                            capaianPembelajaran || null,
                            totalPG, totalIsian, totalUraian,
                            isianType || 'Standard',
                            hotsRatio || '30:40:30',
                            JSON.stringify(finalData),
                            preferredSlug || null
                        ).run();
                    } catch (bankErr) {
                        console.warn('[BankSoal] Auto-save failed (non-blocking):', bankErr);
                    }
                } catch (_) {}

                // Step 5: Selesai & Kirimkan Payload Final
                await stream.writeSSE({
                    event: 'step',
                    data: JSON.stringify({
                        step: 5,
                        totalSteps: 5,
                        title: 'Finalisasi Selesai',
                        message: 'Paket Asesmen & Kisi-kisi Matriks siap ditampilkan!',
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

export default kisi;
