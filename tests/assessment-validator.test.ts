import { describe, it, expect, vi } from 'vitest';
import {
    validateQuestionHeuristics,
    buildAuditPrompt,
    applyVerificationRepairs,
    runAssessmentQualityGate
} from '../src/lib/assessment-validator';

describe('Assessment Quality Gate & AI Verifier Engine Tests', () => {
    describe('validateQuestionHeuristics (Tier 1 Heuristic Gate)', () => {
        it('should pass a well-structured multiple-choice question without issues', () => {
            const item = {
                no: 1,
                soal: 'Ibu kota negara Indonesia berdasarkan UU IKN adalah...',
                opsi: {
                    A: 'Jakarta',
                    B: 'Nusantara',
                    C: 'Surabaya',
                    D: 'Bandung'
                },
                kunci: 'B',
                level: 'L1'
            };

            const result = validateQuestionHeuristics(item, 'Kelas 5');
            expect(result.isValid).toBe(true);
            expect(result.issues).toHaveLength(0);
            expect(result.healedItem.kunci).toBe('B');
        });

        it('should detect forbidden Puspendik phrases like "Semua jawaban benar"', () => {
            const item = {
                no: 2,
                soal: 'Manfaat menjaga kebersihan lingkungan antara lain...',
                opsi: {
                    A: 'Mencegah penyebaran penyakit',
                    B: 'Lingkungan menjadi asri dan nyaman',
                    C: 'Menghilangkan polusi udara',
                    D: 'Semua jawaban benar' // FORBIDDEN!
                },
                kunci: 'D',
                level: 'L2'
            };

            const result = validateQuestionHeuristics(item, 'Kelas 4');
            const forbiddenIssue = result.issues.find(i => i.type === 'FORBIDDEN_PHRASE');
            expect(forbiddenIssue).toBeDefined();
            expect(forbiddenIssue?.message).toContain('Semua jawaban benar');
        });

        it('should auto-heal orphan visual stimulus reference when no image exists', () => {
            const item = {
                no: 3,
                soal: 'Perhatikan gambar berikut! Bagian tumbuhan yang berfungsi menyerap air adalah...',
                opsi: {
                    A: 'Akar',
                    B: 'Batang',
                    C: 'Daun',
                    D: 'Bunga'
                },
                kunci: 'A',
                level: 'L1',
                gambar: null,
                visual_stimulus: null
            };

            const result = validateQuestionHeuristics(item, 'Kelas 4');
            const orphanIssue = result.issues.find(i => i.type === 'ORPHAN_STIMULUS');
            expect(orphanIssue).toBeDefined();
            // Teks pembuka "Perhatikan gambar berikut!" harus dibersihkan secara otomatis
            expect(result.healedItem.soal).toBe('Bagian tumbuhan yang berfungsi menyerap air adalah...');
            expect(result.healedItem.soal).not.toContain('Perhatikan gambar');
        });

        it('should auto-heal orphan table stimulus reference when no markdown table exists', () => {
            const item = {
                no: 4,
                soal: 'Perhatikan tabel berikut! Berdasarkan data, penjualan terbanyak terjadi pada hari...',
                opsi: {
                    A: 'Senin',
                    B: 'Selasa',
                    C: 'Rabu',
                    D: 'Kamis'
                },
                kunci: 'A',
                level: 'L2'
            };

            const result = validateQuestionHeuristics(item, 'Kelas 5');
            const orphanIssue = result.issues.find(i => i.type === 'ORPHAN_STIMULUS');
            expect(orphanIssue).toBeDefined();
            expect(result.healedItem.soal).toBe('Berdasarkan data, penjualan terbanyak terjadi pada hari...');
        });

        it('should normalize formatted keys such as "A. Opsi Jawaban" to "A"', () => {
            const item = {
                no: 5,
                soal: 'Lambang sila pertama Pancasila adalah...',
                opsi: {
                    A: 'Bintang',
                    B: 'Rantai',
                    C: 'Pohon Beringin',
                    D: 'Kepala Banteng'
                },
                kunci: 'A. Bintang',
                level: 'L1'
            };

            const result = validateQuestionHeuristics(item, 'Kelas 4');
            expect(result.healedItem.kunci).toBe('A');
        });

        it('should match text-based answer keys to the corresponding letter key', () => {
            const item = {
                no: 6,
                soal: 'Hasil dari fotosintesis pada tumbuhan hijau adalah...',
                opsi: {
                    A: 'Nitrogen',
                    B: 'Karbondioksida',
                    C: 'Oksigen dan Glukosa',
                    D: 'Air tanah'
                },
                kunci: 'Oksigen dan Glukosa', // Kunci berbentuk teks utuh
                level: 'L1'
            };

            const result = validateQuestionHeuristics(item, 'Kelas 5');
            expect(result.healedItem.kunci).toBe('C');
        });

        it('should detect duplicate option contents', () => {
            const item = {
                no: 7,
                soal: 'Hewan pemakan tumbuhan disebut...',
                opsi: {
                    A: 'Herbivora',
                    B: 'Karnivora',
                    C: 'Omnivora',
                    D: 'Herbivora' // Duplicate of A!
                },
                kunci: 'A',
                level: 'L1'
            };

            const result = validateQuestionHeuristics(item, 'Kelas 4');
            const dupIssue = result.issues.find(i => i.type === 'DUPLICATE_OPTIONS');
            expect(dupIssue).toBeDefined();
        });

        it('should adapt to 3 options (A, B, C) for early grades (Fase A / Kelas 1-3 SD)', () => {
            const item = {
                no: 8,
                soal: 'Berapakah hasil 5 + 3?',
                opsi: {
                    A: '7',
                    B: '8',
                    C: '9'
                },
                kunci: 'B',
                level: 'L1'
            };

            const result = validateQuestionHeuristics(item, 'Kelas 1');
            expect(result.isValid).toBe(true);
            expect(Object.keys(result.healedItem.opsi)).toEqual(['A', 'B', 'C']);
        });

        it('should strip parenthetical prompt debris like "(Gambar dengan pola: ...)" from soal text', () => {
            const item = {
                no: 9,
                soal: 'Perhatikan pola warna berikut! (Gambar dengan pola: Merah, Kuning, Hijau, Biru, Merah, Kuning, Hijau, ...) Berdasarkan gambar tersebut, warna berikutnya dalam pola adalah ...',
                opsi: { A: 'Merah', B: 'Kuning', C: 'Hijau', D: 'Biru' },
                kunci: 'D',
                level: 'L1'
            };

            const result = validateQuestionHeuristics(item, 'Kelas 4');
            expect(result.healedItem.soal).not.toContain('(Gambar dengan pola');
            expect(result.healedItem.soal).toContain('Perhatikan pola warna berikut! Berdasarkan gambar tersebut');
        });

        it('should auto-heal mismatched stock photo to precise SVG diagram when question asks about CPU with arrow', () => {
            const item = {
                no: 10,
                soal: 'Perhatikan gambar berikut! (Gambar komputer dengan panah menunjuk CPU) Komponen yang ditunjuk oleh tanda panah berfungsi sebagai ...',
                opsi: { A: 'Penyimpan data', B: 'Otak komputer', C: 'Sumber daya listrik', D: 'Penampil gambar' },
                kunci: 'B',
                level: 'L2',
                gambar: {
                    url: 'https://images.unsplash.com/photo-random-circuit',
                    credit: 'Andrey Sizov',
                    type: 'photo' // Inappropriate stock photo!
                }
            };

            const result = validateQuestionHeuristics(item, 'Kelas 5');
            // Mismatched stock photo must be replaced by precise perangkat_komputer SVG!
            expect(result.healedItem.gambar.type).toBe('svg');
            expect(result.healedItem.visual_stimulus?.type).toBe('perangkat_komputer');
            expect(result.healedItem.visual_stimulus?.params?.pointer).toBe('cpu');
            expect(result.healedItem.soal).not.toContain('(Gambar komputer');
        });

        it('should auto-heal mismatched stock photo to precise pola_warna SVG when question asks about color pattern', () => {
            const item = {
                no: 11,
                soal: 'Perhatikan pola warna berikut! Berdasarkan gambar tersebut, warna berikutnya dalam pola Merah, Kuning, Hijau, Biru adalah...',
                opsi: { A: 'Merah', B: 'Kuning', C: 'Hijau', D: 'Biru' },
                kunci: 'A',
                level: 'L1',
                gambar: {
                    url: 'https://images.unsplash.com/photo-random-circuit',
                    credit: 'Andrey Sizov',
                    type: 'photo' // Inappropriate stock photo!
                }
            };

            const result = validateQuestionHeuristics(item, 'Kelas 4');
            expect(result.healedItem.gambar.type).toBe('svg');
            expect(result.healedItem.visual_stimulus?.type).toBe('pola_warna');
        });
    });

    describe('buildAuditPrompt (AI Verifier Persona & Spec)', () => {
        it('should formulate an auditor prompt with Puspendik standards and question payload', () => {
            const questions = [
                {
                    no: 1,
                    soal: 'Sila kedua Pancasila berbunyi...',
                    opsi: { A: 'Ketuhanan...', B: 'Kemanusiaan...', C: 'Persatuan...', D: 'Kerakyatan...' },
                    kunci: 'B',
                    level: 'L1'
                }
            ];

            const prompt = buildAuditPrompt(questions, {
                mataPelajaran: 'Pendidikan Pancasila',
                topik: 'Nilai-Nilai Pancasila',
                jenjangKelas: 'Kelas 4'
            });

            expect(prompt).toContain('Auditor & Pakar Penilaian Asesmen Puspendik Kemendikbudristek');
            expect(prompt).toContain('Pendidikan Pancasila');
            expect(prompt).toContain('Nilai-Nilai Pancasila');
            expect(prompt).toContain('KEBENARAN FAKTUAL & KUNCI JAWABAN');
            expect(prompt).toContain('verifications');
        });
    });

    describe('applyVerificationRepairs (Tier 3 Auto-Healing & Merge)', () => {
        it('should apply corrected answer key, repaired question, and inject audit score metadata', () => {
            const originalItems = [
                {
                    no: 1,
                    soal: 'Soal lama dengan sedikit kesalahan',
                    opsi: { A: 'Salah', B: 'Salah', C: 'Benar', D: 'Salah' },
                    kunci: 'A', // Kunci awal salah
                    level: 'L2'
                },
                {
                    no: 2,
                    soal: 'Soal yang sudah valid sempurna',
                    opsi: { A: 'A', B: 'B', C: 'C', D: 'D' },
                    kunci: 'B',
                    level: 'L1'
                }
            ];

            const verificationResults = [
                {
                    index: 0,
                    no: 1,
                    verdict: 'REPAIR',
                    quality_score: 94,
                    key_verified: true,
                    kaidah_puspendik: true,
                    hots_valid: true,
                    distraktor_homogen: true,
                    corrected_kunci: 'C', // Verifikator AI mengoreksi ke C
                    repaired_soal: 'Soal baru yang telah disempurnakan redaksinya',
                    notes: 'Kunci dikoreksi dari A ke C'
                },
                {
                    index: 1,
                    no: 2,
                    verdict: 'PASS',
                    quality_score: 98,
                    key_verified: true,
                    kaidah_puspendik: true,
                    hots_valid: true,
                    distraktor_homogen: true,
                    notes: 'Sempurna'
                }
            ];

            const { healedItems, repairedCount } = applyVerificationRepairs(originalItems, verificationResults);

            expect(repairedCount).toBe(1);
            // Item 1: kunci healed to C
            expect(healedItems[0].kunci).toBe('C');
            expect(healedItems[0].soal).toBe('Soal baru yang telah disempurnakan redaksinya');
            expect(healedItems[0].audit.status).toBe('repaired');
            expect(healedItems[0].audit.quality_score).toBe(94);
            expect(healedItems[0].audit.key_verified).toBe(true);

            // Item 2: verified
            expect(healedItems[1].audit.status).toBe('verified');
            expect(healedItems[1].audit.quality_score).toBe(98);
        });
    });

    describe('runAssessmentQualityGate (Unified Pipeline Integration)', () => {
        it('should execute end-to-end quality gate with mocked AI and attach audit summary', async () => {
            const mockAi = {
                generateJSON: vi.fn().mockResolvedValue({
                    summary: {
                        total_reviewed: 1,
                        valid_count: 1,
                        repaired_count: 0,
                        overall_quality_score: 97
                    },
                    verifications: [
                        {
                            index: 0,
                            no: 1,
                            verdict: 'PASS',
                            quality_score: 97,
                            key_verified: true,
                            kaidah_puspendik: true,
                            hots_valid: true,
                            distraktor_homogen: true,
                            notes: 'Lolos audit mutu'
                        }
                    ],
                    _ai_meta: {
                        provider: 'gemini-flash',
                        model: 'gemini-2.5'
                    }
                })
            } as any;

            const finalData = {
                pg: [
                    {
                        no: 1,
                        soal: 'Simbol sila ke-3 Pancasila adalah...',
                        opsi: { A: 'Bintang', B: 'Rantai', C: 'Pohon Beringin', D: 'Banteng' },
                        kunci: 'C',
                        level: 'L1'
                    }
                ]
            };

            const result = await runAssessmentQualityGate(mockAi, finalData, {
                mataPelajaran: 'Pendidikan Pancasila',
                topik: 'Simbol Pancasila',
                jenjangKelas: 'Kelas 4'
            });

            expect(mockAi.generateJSON).toHaveBeenCalledTimes(1);
            expect(result.summary.overall_quality_score).toBe(97);
            expect(result.finalData._audit).toBeDefined();
            expect(result.finalData._audit.overall_quality_score).toBe(97);
            expect(result.finalData.pg[0].audit).toBeDefined();
            expect(result.finalData.pg[0].audit.quality_score).toBe(97);
        });

        it('should gracefully degrade using Heuristics Tier if AI Verifier fails or times out', async () => {
            const mockFailingAi = {
                generateJSON: vi.fn().mockRejectedValue(new Error('API quota exceeded / timeout'))
            } as any;

            const finalData = {
                pg: [
                    {
                        no: 1,
                        soal: 'Perhatikan gambar berikut! Apa fungsi jantung?',
                        opsi: { A: 'Memompa darah', B: 'Bernapas', C: 'Mencerna', D: 'Menyaring' },
                        kunci: 'A',
                        level: 'L1'
                    }
                ]
            };

            // Should NOT throw an error, instead fallback gracefully!
            const result = await runAssessmentQualityGate(mockFailingAi, finalData, {
                mataPelajaran: 'IPAS',
                topik: 'Sistem Peredaran Darah',
                jenjangKelas: 'Kelas 5'
            });

            expect(result.finalData.pg).toHaveLength(1);
            // Orphan reference "Perhatikan gambar berikut!" should still be healed by Tier 1
            expect(result.finalData.pg[0].soal).toBe('Apa fungsi jantung?');
            expect(result.finalData._audit).toBeDefined();
            expect(result.finalData._audit.total_reviewed).toBe(1);
        });

        it('should purge irrelevant Andrey Sizov Russian circuit photo when attached to non-circuit question', () => {
            const item = {
                no: 1,
                soal: 'Perhatikan gambar berikut! Nilai sila ketiga Pancasila adalah persatuan bangsa...',
                opsi: { A: 'Persatuan', B: 'Keadilan', C: 'Kemanusiaan', D: 'Ketuhanan' },
                kunci: 'A',
                level: 'L1',
                gambar: {
                    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixid=M3wxMjA3fDB8...',
                    credit: 'Андрей Сизов',
                    type: 'photo'
                }
            };

            const result = validateQuestionHeuristics(item, 'Kelas 4');
            expect(result.healedItem.gambar).toBeUndefined();
            expect(result.healedItem.visual_stimulus).toBeUndefined();
            expect(result.healedItem.soal).not.toContain('Perhatikan gambar berikut');
            expect(result.healedItem.soal).toContain('Nilai sila ketiga Pancasila adalah persatuan bangsa...');
            expect(result.issues.some(i => i.message.includes('Andrey Sizov'))).toBe(true);
        });

        it('should enforce zero duplicate images across the exam packet (purging 4 identical photos down to 1)', async () => {
            const mockAi = {
                generateJSON: vi.fn().mockResolvedValue({
                    verifications: [],
                    summary: { overall_quality_score: 95 }
                })
            } as any;

            const duplicateUrl = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop';
            const finalData = {
                pg: [
                    {
                        no: 1,
                        soal: 'Perhatikan gambar berikut! Fenomena pelangi menunjukkan sifat cahaya...',
                        opsi: { A: 'Pembiasan', B: 'Merambat lurus', C: 'Menembus bening', D: 'Pemantulan' },
                        kunci: 'A',
                        level: 'L1',
                        gambar: { url: duplicateUrl + '&q=80', credit: 'Photographer A', type: 'photo' }
                    },
                    {
                        no: 2,
                        soal: 'Perhatikan gambar berikut! Mengapa pensil di dalam gelas air tampak patah?',
                        opsi: { A: 'Pembiasan', B: 'Pemantulan', C: 'Dispersi', D: 'Penyerapan' },
                        kunci: 'A',
                        level: 'L2',
                        gambar: { url: duplicateUrl + '&q=85', credit: 'Photographer A', type: 'photo' } // DUPLICATE!
                    },
                    {
                        no: 3,
                        soal: 'Perhatikan gambar berikut! Manfaat cermin cembung pada kendaraan adalah...',
                        opsi: { A: 'Memperluas pandangan', B: 'Memperbesar bayangan', C: 'Membalik objek', D: 'Memfokuskan cahaya' },
                        kunci: 'A',
                        level: 'L1',
                        gambar: { url: duplicateUrl + '&q=90', credit: 'Photographer A', type: 'photo' } // DUPLICATE!
                    },
                    {
                        no: 4,
                        soal: 'Perhatikan gambar berikut! Peristiwa fatamorgana di jalan aspal terjadi karena...',
                        opsi: { A: 'Pembiasan udara panas', B: 'Pemantulan baur', C: 'Kaca jalanan', D: 'Cahaya terserap' },
                        kunci: 'A',
                        level: 'L3',
                        gambar: { url: duplicateUrl + '&q=95', credit: 'Photographer A', type: 'photo' } // DUPLICATE!
                    }
                ]
            };

            const result = await runAssessmentQualityGate(mockAi, finalData, {
                mataPelajaran: 'IPAS',
                topik: 'Sifat Cahaya',
                jenjangKelas: 'Kelas 5'
            });

            // Question 1 keeps the unique image
            expect(result.finalData.pg[0].gambar).toBeDefined();
            expect(result.finalData.pg[0].gambar.url).toContain(duplicateUrl);

            // Questions 2, 3, 4 MUST have the duplicate image stripped!
            expect(result.finalData.pg[1].gambar).toBeUndefined();
            expect(result.finalData.pg[2].gambar).toBeUndefined();
            expect(result.finalData.pg[3].gambar).toBeUndefined();

            // All questions must have orphan text cleaned
            expect(result.finalData.pg[1].soal).not.toContain('Perhatikan gambar');
            expect(result.finalData.pg[2].soal).not.toContain('Perhatikan gambar');
            expect(result.finalData.pg[3].soal).not.toContain('Perhatikan gambar');

            // Audit repaired count should reflect the 3 duplicates stripped
            expect(result.summary.repaired_count).toBeGreaterThanOrEqual(3);
        });

        it('should purge duplicate SVG stimulus signatures in the same packet', async () => {
            const mockAi = {
                generateJSON: vi.fn().mockResolvedValue({
                    verifications: [],
                    summary: { overall_quality_score: 96 }
                })
            } as any;

            const finalData = {
                pg: [
                    {
                        no: 1,
                        soal: 'Perhatikan diagram berikut! Organ pencernaan yang menghasilkan asam klorida (HCl) adalah...',
                        opsi: { A: 'Lambung', B: 'Mulut', C: 'Usus', D: 'Hati' },
                        kunci: 'A',
                        level: 'L1',
                        visual_stimulus: { type: 'organ_pencernaan', params: { pointer: 'lambung', label: 'X' } },
                        gambar: { url: 'data:image/svg+xml;utf8,<svg>1</svg>', type: 'svg' }
                    },
                    {
                        no: 2,
                        soal: 'Perhatikan diagram berikut! Fungsi organ pencernaan lambung adalah...',
                        opsi: { A: 'Mencerna protein', B: 'Menyerap air', C: 'Mengunyah makanan', D: 'Menyaring racun' },
                        kunci: 'A',
                        level: 'L2',
                        visual_stimulus: { type: 'organ_pencernaan', params: { pointer: 'lambung', label: 'X' } }, // IDENTICAL SVG!
                        gambar: { url: 'data:image/svg+xml;utf8,<svg>2</svg>', type: 'svg' }
                    }
                ]
            };

            const result = await runAssessmentQualityGate(mockAi, finalData, {
                mataPelajaran: 'IPAS',
                topik: 'Sistem Pencernaan',
                jenjangKelas: 'Kelas 5'
            });

            expect(result.finalData.pg[0].visual_stimulus).toBeDefined();
            // Duplicate identical SVG on Question 2 must be purged!
            expect(result.finalData.pg[1].visual_stimulus).toBeUndefined();
            expect(result.finalData.pg[1].gambar).toBeUndefined();
            expect(result.finalData.pg[1].soal).not.toContain('Perhatikan diagram');
        });
    });
});
