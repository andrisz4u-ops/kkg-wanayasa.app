import { Hono } from 'hono';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import { UnsplashService } from '../services/unsplash';
import { generateCrossword } from '../lib/crossword';
import { type AppBindings } from '../types/env';

const kisi = new Hono<{ Bindings: AppBindings }>();

// Generate Asesmen (Soal) via AI
kisi.post('/generate', async (c) => {
    try {
        const body = await c.req.json();
        const {
            namaSekolah, namaGuru, nipGuru, mataPelajaran, topik,
            jenjangKelas, semester, jenisUjian, capaianPembelajaran,
            jumlahPG, jumlahIsian, jumlahUraian,
            hotsRatio, isianType, aiProvider
        } = body;

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

        // Helper: dapatkan deskripsi adaptasi kelas
        const getKelasAdaptation = (kelas: string): string => {
            const k = parseInt(kelas.replace(/\D/g, '')) || 5;
            if (k <= 2) return `ADAPTASI KELAS ${kelas}: Gunakan kalimat SANGAT PENDEK (max 10 kata per kalimat), konteks objek nyata & gambar konkret. HOTS cukup berupa perbandingan dua hal sederhana atau memilih yang terbaik dari dua pilihan nyata.`;
            if (k <= 4) return `ADAPTASI KELAS ${kelas}: Kalimat sedang (max 15 kata), gunakan konteks cerita pendek atau situasi sehari-hari sebagai stimulus. HOTS berupa hubungan sebab-akibat atau menyimpulkan dari cerita.`;
            return `ADAPTASI KELAS ${kelas}: Bisa menggunakan data sederhana, tabel, atau kasus nyata sebagai stimulus. HOTS berupa analisis data, argumentasi berdasar fakta, atau merancang solusi dari permasalahan kontekstual.`;
        };

        const buildPrompt = (type: string, startNo: number, count: number, totalPrevPG = 0) => {
            const isPG = type === 'pg';
            const jsonStructure = isPG ?
                `"pg": [ { "no": ${startNo}, "soal": "Pertanyaan Pilihan Ganda (untuk soal HOTS: awali dengan stimulus/wacana singkat sebelum pertanyaan)", "opsi": { "A": "...", "B": "...", "C": "...", "D": "..." }, "kunci": "A/B/C/D", "level": "LOTS/MOTS/HOTS", "gambar_keyword": "keyword inggris ATAU kosongkan" } ]` :
                `"isian": {
                    "type": "${isianType || 'Standard'}",
                    "data": [ { "no": ${totalPrevPG + 1}, "soal": "...", "kunci": "..." } ]
                 },
                 "uraian": [ { "no": ${totalPrevPG + (totalIsian || 0) + 1}, "soal": "Soal uraian HOTS: sertakan stimulus/data/kasus, tuntut analisis atau evaluasi", "kunci": "Jawaban ideal lengkap dengan alasan/argumentasi", "rubrik_skor": { "Skor 4": "Analisis lengkap, argumen tepat & logis", "Skor 3": "Analisis cukup, argumen ada namun kurang lengkap", "Skor 2": "Menjawab namun tidak disertai analisis", "Skor 1": "Jawaban tidak relevan atau salah" } } ]`;

            let isianRule = "";
            if (!isPG) {
                if (isianType === 'Crossword') {
                    isianRule = `\n                9. ATURAN ISIAN (TEKA-TEKI SILANG): Setiap "soal" isian HARUS diawali dengan kata "Mendatar:" atau "Menurun:". Kunci jawaban HARUS 1 kata tanpa spasi (huruf kapital).`;
                } else if (isianType === 'Menjodohkan') {
                    isianRule = `\n                9. ATURAN ISIAN (MENJODOHKAN): Setiap "soal" isian berisi pernyataan logis. "kunci" berisi pasangan yang benar dan proporsional.`;
                }
            }

            return `
                Bertindaklah sebagai Profesor dan Pakar Penilaian Pendidikan berstandar Kurikulum Merdeka & PISA/AKM.

                I. TAKSONOMI BLOOM REVISI — PANDUAN LEVEL KOGNITIF:
                Gunakan panduan Kata Kerja Operasional (KKO) berikut untuk menentukan level soal:
                ┌─ LOTS ──────────────────────────────────────────────────────────────────
                │  C1 Mengingat   : sebutkan, tuliskan, definisikan, identifikasi, hafal
                │  C2 Memahami    : jelaskan, uraikan, klasifikasikan, ringkas, parafrase
                │  C3 Menerapkan  : hitung, gunakan, terapkan, selesaikan, demonstrasikan
                ├─ MOTS ──────────────────────────────────────────────────────────────────
                │  C4 Menganalisis: analisis, bandingkan, bedakan, hubungkan, simpulkan, kategorikan
                ├─ HOTS ──────────────────────────────────────────────────────────────────
                │  C5 Mengevaluasi: nilai, justifikasi, kritisi, putuskan, pertahankan, rekomendasikan
                │  C6 Mencipta    : rancang, buat, susun, kembangkan, formulasikan, rencanakan
                └─────────────────────────────────────────────────────────────────────────

                II. ATURAN WAJIB:
                1. CP (Capaian Pembelajaran): ${capaianPembelajaran || 'Generasi otomatis sesuai topik & kelas'}
                2. RASIO TARGET: ${hotsRatio || '30:40:30'} (LOTS : MOTS : HOTS). Hitung secara presisi dan patuhi!
                3. TUGAS: ${isPG
                    ? `Generate TEPAT ${count} soal PG (No. ${startNo} s.d. ${startNo + count - 1}).`
                    : `Generate TEPAT ${totalIsian} soal ISIAN dan ${totalUraian} soal URAIAN.`
                }
                4. DISTRIBUSI KUNCI PG: Distribusikan kunci jawaban (A/B/C/D) secara ACAK dan MERATA.
                5. ATURAN SOAL HOTS (WAJIB): Setiap soal yang diberi label HOTS WAJIB memiliki STIMULUS — berupa mini-wacana, penggalan cerita, data/angka sederhana, pernyataan kontradiktif, atau situasi masalah nyata — yang ditulis SEBELUM pertanyaan. Pertanyaan HOTS tidak boleh bisa dijawab tanpa membaca & memikirkan stimulusnya.
                ${isPG ? '' : `6. ATURAN SOAL URAIAN: Minimal 1 soal uraian HARUS berjenis HOTS (C5/C6) yang menuntut murid: (a) menganalisis situasi/data, (b) memberikan penilaian/argumen berdasar fakta, atau (c) merancang solusi kreatif. Rubrik WAJIB menggunakan 4 level skor.`}
                ${isPG ? `6. GAMBAR (WAJIB): Anda HARUS membuat TEPAT 2 soal yang memakai gambar. Untuk 2 soal tersebut, isilah field "gambar_keyword" dengan 1-2 kata kunci objek spesifik dalam Bahasa Inggris (contoh: "water cycle", "food chain", "fraction diagram"). Untuk soal lainnya, isikan "gambar_keyword" dengan string kosong.` : ''}
                ${isPG ? '7.' : '6.'} LARANGAN: JANGAN menulis label "LOTS", "MOTS", atau "HOTS" di dalam teks soal yang terlihat murid. JANGAN menambahkan field "gambar" atau "gambar_keyword" ke soal isian maupun uraian.${isianRule}
                ${getKelasAdaptation(jenjangKelas)}

                III. FORMAT OUTPUT JSON (berikan JSON valid saja, tanpa teks lain):
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

        // Generate PG
        if (totalPG > 0) {
            const BATCH_SIZE = 20;
            const unsplash = new UnsplashService(c.env);
            for (let i = 0; i < totalPG; i += BATCH_SIZE) {
                const currentCount = Math.min(BATCH_SIZE, totalPG - i);
                const prompt = buildPrompt('pg', i + 1, currentCount);
                const result = await ai.generateJSON(prompt, preferredSlug);
                if (result?._ai_meta) finalData._meta = result._ai_meta;
                if (result?.pg && Array.isArray(result.pg)) {
                    for (const q of result.pg) {
                        if (q.gambar_keyword && unsplash.isConfigured()) {
                            try {
                                const img = await unsplash.searchImage(q.gambar_keyword, q.soal);
                                if (img) {
                                    q.gambar = { url: img.url, credit: img.creditName };
                                }
                            } catch (error) {
                                console.error('Unsplash Error:', error);
                            }
                        }
                    }
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
        }

        // Generate Isian + Uraian
        if (totalIsian > 0 || totalUraian > 0) {
            const startNoIsian = totalPG + 1;
            const prompt = buildPrompt('isian', startNoIsian, totalIsian, totalPG);
            const result = await ai.generateJSON(prompt, preferredSlug);
            if (result?._ai_meta) finalData._meta = result._ai_meta;

            if (result?.isian) {
                finalData.isian = result.isian;
                finalData.isian.type = isianType || 'Standard';

                // Pastikan tidak ada field gambar yang bocor dari AI ke soal isian
                if (finalData.isian.data && Array.isArray(finalData.isian.data)) {
                    finalData.isian.data.forEach((q: any) => {
                        delete q.gambar;
                        delete q.gambar_keyword;
                    });
                }

                if (isianType === 'Crossword' && result.isian.data) {
                    const words = result.isian.data.map((q: any) => String(q.kunci));
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
            }
            if (result?.uraian) {
                finalData.uraian = result.uraian;
                // Pastikan tidak ada field gambar yang bocor dari AI ke soal uraian
                finalData.uraian.forEach((q: any) => {
                    delete q.gambar;
                    delete q.gambar_keyword;
                });

                // Renumber uraian to continue from the last isian number
                // (important for Crossword where isian numbers come from placement)
                if (finalData.isian && finalData.isian.data && finalData.isian.data.length > 0) {
                    const maxIsianNo = Math.max(...finalData.isian.data.map((q: any) => q.no || 0));
                    finalData.uraian.forEach((q: any, i: number) => {
                        q.no = maxIsianNo + 1 + i;
                    });
                }
            }
        }

        return successResponse(c, finalData);

    } catch (e: any) {
        console.error('Asesmen Gen Error:', e);
        return Errors.internal(c, e.message);
    }
});

export default kisi;
