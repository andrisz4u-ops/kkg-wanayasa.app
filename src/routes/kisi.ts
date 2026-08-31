import { Hono } from 'hono';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import { UnsplashService } from '../services/unsplash';
import { generateCrossword } from '../lib/crossword';
import { getCookie, getCurrentUser } from '../lib/auth';
import { recordAIGeneration } from '../lib/telemetry';
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
            hotsRatio, isianType, aiProvider, useGambar
        } = body;

        const isGambarEnabled = useGambar !== false && useGambar !== 'false' && useGambar !== 0 && useGambar !== '0';

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

            let jsonStructure = '';
            if (isPG) {
                jsonStructure = `"pg": [ { "no": ${startNo}, "soal": "Pertanyaan Pilihan Ganda (sajikan langsung tanpa teks penjelasan kurung siku)", "opsi": { "A": "...", "B": "...", "C": "...", "D": "..." }, "kunci": "A/B/C/D", "level": "LOTS/MOTS/HOTS", "gambar_keyword": "kata kunci ringkas 1-3 kata (contoh: Siklus air / Sayuti Melik / Fotosintesis)", "gambar_prompt_en": "detailed English visual description for AI image generator (contoh: clean 2D scientific textbook diagram of the water cycle showing evaporation from sea, cloud condensation, rain precipitation over mountains, clean white background, vector art)" } ]`;
            } else {
                const parts: string[] = [];
                if (totalIsian > 0) {
                    parts.push(`"isian": {
                    "type": "${isianType || 'Standard'}",
                    "data": [ { "no": ${totalPrevPG + 1}, "soal": "...", "kunci": "..." } ]
                 }`);
                }
                if (totalUraian > 0) {
                    const uraianStartNo = totalPrevPG + (totalIsian || 0) + 1;
                    parts.push(`"uraian": [ { "no": ${uraianStartNo}, "soal": "Soal uraian HOTS: sertakan stimulus/data/kasus, tuntut analisis atau evaluasi", "kunci": "Jawaban ideal lengkap dengan alasan/argumentasi", "rubrik_skor": { "Skor 4": "Analisis lengkap, argumen tepat & logis", "Skor 3": "Analisis cukup, argumen ada namun kurang lengkap", "Skor 2": "Menjawab namun tidak disertai analisis", "Skor 1": "Jawaban tidak relevan atau salah" } } ]`);
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
                taskDesc = `Generate TEPAT ${count} soal PG (No. ${startNo} s.d. ${startNo + count - 1}).`;
            } else if (totalIsian > 0 && totalUraian > 0) {
                taskDesc = `Generate TEPAT ${totalIsian} soal ISIAN dan ${totalUraian} soal URAIAN.`;
            } else if (totalIsian > 0 && totalUraian === 0) {
                taskDesc = `Generate TEPAT ${totalIsian} soal ISIAN saja. JANGAN membuat soal uraian (uraian = 0)!`;
            } else if (totalIsian === 0 && totalUraian > 0) {
                taskDesc = `Generate TEPAT ${totalUraian} soal URAIAN saja. JANGAN membuat soal isian (isian = 0)!`;
            }

            let uraianRule = '';
            if (!isPG && totalUraian > 0) {
                uraianRule = `\n                6. ATURAN SOAL URAIAN: Minimal 1 soal uraian HARUS berjenis HOTS (C5/C6) yang menuntut murid: (a) menganalisis situasi/data, (b) memberikan penilaian/argumen berdasar fakta, atau (c) merancang solusi kreatif. Rubrik WAJIB menggunakan 4 level skor.`;
            } else if (!isPG && totalUraian === 0) {
                uraianRule = `\n                6. LARANGAN URAIAN: Pengguna TIDAK MEMBUTUHKAN soal uraian (jumlah = 0). DILARANG KERAS menyertakan field "uraian" dalam output JSON.`;
            }

            let gambarRule = '';
            if (isPG) {
                if (isGambarEnabled) {
                    const exactImages = Math.max(1, Math.round(count * 0.2));
                    gambarRule = `\n                7. ATURAN GAMBAR (KUNCI TEPAT ${exactImages} BUTIR SOAL BERGAMBAR): Fitur ilustrasi gambar AKTIF. Dari ${count} butir soal PG ini, Anda WAJIB memilih TEPAT ${exactImages} butir soal (tidak boleh lebih dan tidak boleh kurang) yang menggunakan stimulus visual berupa foto/objek/diagram konkret yang jelas.
                - PADA ${exactImages} BUTIR SOAL BERGAMBAR TERSEBUT:
                  * Field "gambar_keyword": Isi dengan 1-3 kata kunci topik Bahasa Indonesia atau nama entitas resmi untuk pencarian Wikipedia/Wikimedia (contoh: "Siklus air", "Fotosintesis", "Rumah Laksamana Maeda", "Sayuti Melik", "Sistem pernapasan manusia", "Candi Borobudur").
                  * Field "gambar_prompt_en": Isi dengan deskripsi adegan visual yang sangat rinci dalam BAHASA INGGRIS (15-25 kata) untuk AI Image Generator (contoh: "clear 2D scientific textbook illustration of the water cycle showing ocean evaporation, cloud formation, rain precipitation over green hills, white background, vector diagram").
                - LARANGAN MUTLAK PADA SOAL BERGAMBAR:
                  * DILARANG KERAS membuat soal diagram alur/bagan bertuliskan teks (seperti "kotak berlabel Proklamasi pada diagram alur") atau diagram pohon faktor angka. Jika membutuhkan bagan alur teks atau data angka, sajikan langsung sebagai teks soal atau tabel Markdown yang dapat dibaca jelas oleh murid!
                  * DILARANG KERAS menuliskan teks deskripsi seperti "[Diagram menunjukkan...]" atau "[Foto menunjukkan...]" di dalam teks soal! Tulis langsung pertanyaan ujian yang bersih.
                - Pada butir soal lainnya (selain ${exactImages} butir soal terpilih), WAJIB mengosongkan field ("gambar_keyword": "", "gambar_prompt_en": "").`;
                } else {
                    gambarRule = `\n                7. GAMBAR: Dilarang menyertakan gambar ("gambar_keyword": "", "gambar_prompt_en": "" untuk semua soal).`;
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
                3. TUGAS: ${taskDesc}
                4. DISTRIBUSI KUNCI PG: Distribusikan kunci jawaban (A/B/C/D) secara ACAK dan MERATA.
                5. ATURAN SOAL HOTS (WAJIB): Setiap soal yang diberi label HOTS WAJIB memiliki STIMULUS — berupa mini-wacana, penggalan cerita, data/angka sederhana, pernyataan kontradiktif, atau situasi masalah nyata — yang ditulis SEBELUM pertanyaan. Pertanyaan HOTS tidak boleh bisa dijawab tanpa membaca & memikirkan stimulusnya.${uraianRule}
                6. ATURAN TABEL (STIMULUS): Jika membuat soal yang memuat data/tabel, gunakan format tabel Markdown standar yang rapi (contoh: | Kolom 1 | Kolom 2 |\\n|---|---|\\n| Data A | Data B |). Pastikan setiap baris diawali dan diakhiri dengan tanda pipa (|).${gambarRule}
                ${isPG ? '8.' : '7.'} LARANGAN: JANGAN menulis label "LOTS", "MOTS", atau "HOTS" di dalam teks soal yang terlihat murid. JANGAN menambahkan field "gambar" atau "gambar_keyword" ke soal isian maupun uraian.${isianRule}
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

                        // Clean bracketed text completely from the student's question
                        q.soal = String(q.soal || '')
                            .replace(/\[(?:gambar|foto|diagram|ilustrasi|deskripsi)[^\]]*\]/gi, '')
                            .replace(/\[[^\]]*\]/g, '')
                            .replace(/\s{2,}/g, ' ')
                            .trim();

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
                        q.soal = String(q.soal || '')
                            .replace(/\[(?:gambar|foto|diagram|ilustrasi|deskripsi)[^\]]*\]/gi, '')
                            .replace(/\[[^\]]*\]/g, '')
                            .replace(/\s{2,}/g, ' ')
                            .trim();
                    }
                }
            } else {
                // Jika useGambar nonaktif, pastikan semua soal bersih dari gambar dan placeholder
                for (const q of finalData.pg) {
                    delete q.gambar;
                    delete q.gambar_keyword;
                    delete q.gambar_prompt_en;
                    q.soal = String(q.soal || '')
                        .replace(/\[(?:gambar|foto|diagram|ilustrasi|deskripsi)[^\]]*\]/gi, '')
                        .replace(/\[[^\]]*\]/g, '')
                        .replace(/\s{2,}/g, ' ')
                        .trim();
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

export default kisi;
