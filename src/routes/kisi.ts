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
                jsonStructure = `"pg": [ { "no": ${startNo}, "soal": "Pertanyaan Pilihan Ganda (untuk soal HOTS: awali dengan stimulus/wacana singkat sebelum pertanyaan)", "opsi": { "A": "...", "B": "...", "C": "...", "D": "..." }, "kunci": "A/B/C/D", "level": "LOTS/MOTS/HOTS", "gambar_keyword": "keyword inggris ATAU kosongkan" } ]`;
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
                    const minImages = count >= 10 ? Math.max(2, Math.round(count * 0.25)) : 1;
                    gambarRule = `\n                7. ATURAN GAMBAR (WAJIB MINIMAL ${minImages} BUTIR SOAL DENGAN GAMBAR): Fitur ilustrasi gambar AKTIF. Dari ${count} soal PG ini, Anda WAJIB memilih MINIMAL ${minImages} butir soal (misalnya 2 butir soal untuk 10 soal) yang menggunakan gambar/diagram/skema/ilustrasi konkret sebagai stimulus visual pertanyaan.
                - Pada butir soal bergambar tersebut, buat teks soal yang merujuk pada gambar (contoh: "Perhatikan gambar di bawah ini! Bagian yang ditunjuk berfungsi untuk..." atau "Berdasarkan gambar berikut, proses yang sedang terjadi adalah...").
                - Tuliskan field "gambar_keyword" pada soal tersebut dengan 2-4 kata kunci deskriptif Bahasa Inggris yang spesifik dan jelas (contoh: "plant cell diagram", "human respiratory system", "water cycle illustration", "solar system planets", "food chain ecosystem", "geometric solid shapes").
                - Pada butir soal lainnya yang tidak memerlukan gambar, isi "gambar_keyword": "".`;
                } else {
                    gambarRule = `\n                7. GAMBAR: Dilarang menyertakan gambar ("gambar_keyword": "" untuk semua soal).`;
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
            const BATCH_SIZE = 20;
            const unsplash = isGambarEnabled ? new UnsplashService(c.env) : null;
            for (let i = 0; i < totalPG; i += BATCH_SIZE) {
                const currentCount = Math.min(BATCH_SIZE, totalPG - i);
                const prompt = buildPrompt('pg', i + 1, currentCount);
                const result = await ai.generateJSON(prompt, preferredSlug);
                if (result?._ai_meta) finalData._meta = result._ai_meta;
                if (result?.pg && Array.isArray(result.pg)) {
                    for (const q of result.pg) {
                        if (unsplash && q.gambar_keyword && q.gambar_keyword.trim() !== '') {
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

            // ENFORCE MINIMUM GAMBAR: Jika useGambar aktif, jamin minimal 2 gambar untuk >=10 soal
            if (isGambarEnabled && unsplash && finalData.pg.length > 0) {
                const targetMinImages = finalData.pg.length >= 10 ? Math.max(2, Math.round(finalData.pg.length * 0.2)) : 1;
                let currentAttached = finalData.pg.filter((q: any) => q.gambar && q.gambar.url).length;

                if (currentAttached < targetMinImages) {
                    // 1. Coba butir soal yang sudah punya gambar_keyword tapi belum ter-attach
                    for (const q of finalData.pg) {
                        if (currentAttached >= targetMinImages) break;
                        if (!q.gambar || !q.gambar.url) {
                            const query = q.gambar_keyword || `${topik} educational diagram`;
                            try {
                                const img = await unsplash.searchImage(query, q.soal);
                                if (img) {
                                    q.gambar = { url: img.url, credit: img.creditName };
                                    currentAttached++;
                                }
                            } catch (e) {
                                console.error('Fallback image search error:', e);
                            }
                        }
                    }

                    // 2. Jika masih kurang dari target, pasang pada butir soal berikutnya
                    if (currentAttached < targetMinImages) {
                        const candidates = finalData.pg.filter((q: any) => !q.gambar || !q.gambar.url);
                        for (let idx = 0; idx < candidates.length && currentAttached < targetMinImages; idx++) {
                            const q = candidates[idx];
                            const query = `${topik} ${mataPelajaran} illustration diagram`;
                            try {
                                const img = await unsplash.searchImage(query, q.soal);
                                if (img) {
                                    q.gambar = { url: img.url, credit: img.creditName };
                                    currentAttached++;
                                }
                            } catch (e) {
                                console.error('Fallback image search error:', e);
                            }
                        }
                    }
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
