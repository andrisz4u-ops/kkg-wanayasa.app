import { describe, it, expect } from 'vitest';
import { normalizeItemKisiMetadata } from '../src/routes/kisi';

describe('Assessment & Kisi-Kisi Matrix Generator Tests', () => {
    describe('normalizeItemKisiMetadata', () => {
        it('should preserve existing complete metadata for an item', () => {
            const rawItem = {
                no: 1,
                cp: 'Peserta didik memahami siklus air dan dampaknya bagi kehidupan.',
                materi: 'Siklus Air',
                indikator: 'Disajikan bagan siklus air, peserta didik dapat menentukan tahapan evaporasi dengan benar.',
                level: 'L1',
                bentuk: 'Pilihan Ganda',
                soal: 'Tahapan perubahan air menjadi uap air disebut...',
                kunci: 'A'
            };

            const result = normalizeItemKisiMetadata(rawItem, 'Pilihan Ganda', 1, 'Fallback CP', 'Sains');

            expect(result.no).toBe(1);
            expect(result.cp).toBe('Peserta didik memahami siklus air dan dampaknya bagi kehidupan.');
            expect(result.materi).toBe('Siklus Air');
            expect(result.indikator).toContain('evaporasi');
            expect(result.level).toBe('L1');
            expect(result.bentuk).toBe('Pilihan Ganda');
        });

        it('should correctly standardize Bloom taxonomy and legacy HOTS/MOTS/LOTS levels to L1, L2, L3', () => {
            // L3 cases: C4, C5, C6, HOTS
            const itemHots = { no: 1, level: 'HOTS' };
            const itemC4 = { no: 2, level: 'C4' };
            const itemC5 = { no: 3, level: 'C5' };
            const itemC6 = { no: 4, level: 'C6' };
            const itemL3 = { no: 5, level: 'L3' };

            expect(normalizeItemKisiMetadata(itemHots, 'PG', 1, '', '').level).toBe('L3');
            expect(normalizeItemKisiMetadata(itemC4, 'PG', 2, '', '').level).toBe('L3');
            expect(normalizeItemKisiMetadata(itemC5, 'PG', 3, '', '').level).toBe('L3');
            expect(normalizeItemKisiMetadata(itemC6, 'PG', 4, '', '').level).toBe('L3');
            expect(normalizeItemKisiMetadata(itemL3, 'PG', 5, '', '').level).toBe('L3');

            // L2 cases: C3, MOTS, L2
            const itemMots = { no: 6, level: 'MOTS' };
            const itemC3 = { no: 7, level: 'C3' };
            const itemL2 = { no: 8, level: 'L2' };

            expect(normalizeItemKisiMetadata(itemMots, 'PG', 6, '', '').level).toBe('L2');
            expect(normalizeItemKisiMetadata(itemC3, 'PG', 7, '', '').level).toBe('L2');
            expect(normalizeItemKisiMetadata(itemL2, 'PG', 8, '', '').level).toBe('L2');

            // L1 cases: C1, C2, LOTS, L1, or unknown/empty
            const itemLots = { no: 9, level: 'LOTS' };
            const itemC1 = { no: 10, level: 'C1' };
            const itemC2 = { no: 11, level: 'C2' };
            const itemL1 = { no: 12, level: 'L1' };
            const itemEmpty = { no: 13 };

            expect(normalizeItemKisiMetadata(itemLots, 'PG', 9, '', '').level).toBe('L1');
            expect(normalizeItemKisiMetadata(itemC1, 'PG', 10, '', '').level).toBe('L1');
            expect(normalizeItemKisiMetadata(itemC2, 'PG', 11, '', '').level).toBe('L1');
            expect(normalizeItemKisiMetadata(itemL1, 'PG', 12, '', '').level).toBe('L1');
            expect(normalizeItemKisiMetadata(itemEmpty, 'PG', 13, '', '').level).toBe('L1');
        });

        it('should populate fallback CP, Materi, Indikator, and default number if missing', () => {
            const rawItem = {
                soal: 'Jelaskan manfaat hutan lindung!',
                kunci: 'Mencegah banjir dan erosi.'
            };

            const result = normalizeItemKisiMetadata(
                rawItem,
                'Uraian',
                15,
                'Peserta didik mampu menganalisis interaksi lingkungan hidup.',
                'Pelestarian Lingkungan'
            );

            expect(result.no).toBe(15);
            expect(result.cp).toBe('Peserta didik mampu menganalisis interaksi lingkungan hidup.');
            expect(result.materi).toBe('Pelestarian Lingkungan');
            expect(result.indikator).toBe('Disajikan pertanyaan mengenai Pelestarian Lingkungan, peserta didik dapat menentukan jawaban yang tepat.');
            expect(result.level).toBe('L1');
            expect(result.bentuk).toBe('Uraian');
        });
    });

    describe('Unified 1:1 Kisi-Kisi and Assessment Data Integrity', () => {
        it('should ensure exact 1:1 mapping and numbering continuity across PG, Isian, and Uraian', () => {
            const mockPG = [
                { no: 1, soal: 'Soal PG 1', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A', level: 'L1' },
                { no: 2, soal: 'Soal PG 2', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'B', level: 'L2' },
                { no: 3, soal: 'Soal PG 3', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'C', level: 'L3' }
            ];

            const mockIsian = [
                { no: 4, soal: 'Soal Isian 4', kunci: 'Jawaban 4', level: 'L2' },
                { no: 5, soal: 'Soal Isian 5', kunci: 'Jawaban 5', level: 'L1' }
            ];

            const mockUraian = [
                { no: 6, soal: 'Soal Uraian 6', kunci: 'Jawaban 6', level: 'L3' }
            ];

            // Normalize all items
            const normalizedPG = mockPG.map((item, idx) =>
                normalizeItemKisiMetadata(item, 'Pilihan Ganda', idx + 1, 'CP IPAS', 'Ekosistem')
            );
            const normalizedIsian = mockIsian.map((item, idx) =>
                normalizeItemKisiMetadata(item, 'Isian Singkat', idx + 4, 'CP IPAS', 'Ekosistem')
            );
            const normalizedUraian = mockUraian.map((item, idx) =>
                normalizeItemKisiMetadata(item, 'Uraian', idx + 6, 'CP IPAS', 'Ekosistem')
            );

            // Combined all items for 8-column matrix table
            const allItems = [...normalizedPG, ...normalizedIsian, ...normalizedUraian];

            // 1. Question count in Kisi-Kisi strictly equals generated question count
            const totalExamQuestions = mockPG.length + mockIsian.length + mockUraian.length;
            expect(allItems.length).toBe(totalExamQuestions);
            expect(allItems.length).toBe(6);

            // 2. Sequential numbering verification (1 to 6 without missing numbers)
            allItems.forEach((item, index) => {
                expect(item.no).toBe(index + 1);
            });

            // 3. Every question has 8 mandatory attributes
            allItems.forEach((item) => {
                expect(item.no).toBeTypeOf('number');
                expect(item.cp).toBeTruthy();
                expect(item.materi).toBeTruthy();
                expect(item.indikator).toBeTruthy();
                expect(['L1', 'L2', 'L3']).toContain(item.level);
                expect(item.bentuk).toBeTruthy();
                expect(item.soal).toBeTruthy();
                expect(item.kunci).toBeTruthy();
            });

            // 4. Cognitive level distribution statistics
            const countL1 = allItems.filter(q => q.level === 'L1').length;
            const countL2 = allItems.filter(q => q.level === 'L2').length;
            const countL3 = allItems.filter(q => q.level === 'L3').length;

            expect(countL1).toBe(2);
            expect(countL2).toBe(2);
            expect(countL3).toBe(2);

            const pctL1 = Math.round((countL1 / allItems.length) * 100);
            const pctL2 = Math.round((countL2 / allItems.length) * 100);
            const pctL3 = Math.round((countL3 / allItems.length) * 100);

            expect(pctL1 + pctL2 + pctL3).toBeGreaterThanOrEqual(99);
        });
    });

    describe('resolveQuestionVisualStimulus integration', () => {
        it('should automatically assign precision SVG for math geometry question without calling unsplash', async () => {
            const { resolveQuestionVisualStimulus } = await import('../src/routes/kisi');
            const question: any = {
                no: 1,
                soal: 'Sebuah balok memiliki panjang 15 cm, lebar 10 cm, dan tinggi 8 cm. Berapakah volume balok tersebut?'
            };

            await resolveQuestionVisualStimulus(question, 'Matematika', 'Bangun Ruang', null);

            expect(question.gambar).toBeDefined();
            expect(question.gambar.type).toBe('svg');
            expect(question.gambar.url).toContain('data:image/svg+xml;utf8,');
            expect(question.gambar.credit).toBe('Examplate Visual Engine');
            expect(question.gambar.svg).toContain('p = 15 cm');
            expect(question.gambar.svg).toContain('l = 10 cm');
            expect(question.gambar.svg).toContain('t = 8 cm');
        });

        it('should automatically assign labeled diagram for science respiratory question', async () => {
            const { resolveQuestionVisualStimulus } = await import('../src/routes/kisi');
            const question: any = {
                no: 2,
                soal: 'Perhatikan gambar sistem pernapasan manusia berikut! Bagian trakea yang ditunjuk huruf X berfungsi untuk...'
            };

            await resolveQuestionVisualStimulus(question, 'IPAS', 'Sistem Pernapasan', null);

            expect(question.gambar).toBeDefined();
            expect(question.gambar.type).toBe('svg');
            expect(question.gambar.svg).toContain('Sistem Pernapasan Manusia');
            expect(question.gambar.svg).toContain('huruf "X"');
        });

        it('should automatically assign precision SVG for new 3D, 2D, and IPAS questions', async () => {
            const { resolveQuestionVisualStimulus } = await import('../src/routes/kisi');

            // Bola 3D
            const qBola: any = { no: 3, soal: 'Sebuah bola memiliki jari-jari 14 cm. Hitung luas permukaannya!' };
            await resolveQuestionVisualStimulus(qBola, 'Matematika', 'Bangun Ruang', null);
            expect(qBola.gambar?.type).toBe('svg');
            expect(qBola.gambar?.svg).toContain('r = 14 cm');

            // Trapesium 2D
            const qTrap: any = { no: 4, soal: 'Sebuah trapesium memiliki alas atas 8 cm, alas bawah 12 cm, dan tinggi 6 cm.' };
            await resolveQuestionVisualStimulus(qTrap, 'Matematika', 'Bangun Datar', null);
            expect(qTrap.gambar?.type).toBe('svg');
            expect(qTrap.gambar?.svg).toContain('a = 8 cm');

            // Organ Pencernaan
            const qPencernaan: any = { no: 5, soal: 'Perhatikan gambar sistem pencernaan! Organ lambung bertanda X bertugas mencerna...' };
            await resolveQuestionVisualStimulus(qPencernaan, 'IPAS', 'Sistem Pencernaan', null);
            expect(qPencernaan.gambar?.type).toBe('svg');
            expect(qPencernaan.gambar?.svg).toContain('Sistem Pencernaan Manusia');

            // Rantai Makanan
            const qRantai: any = { no: 6, soal: 'Perhatikan rantai makanan berikut! Organisme yang bertindak sebagai produsen adalah...' };
            await resolveQuestionVisualStimulus(qRantai, 'IPAS', 'Ekosistem', null);
            expect(qRantai.gambar?.type).toBe('svg');
            expect(qRantai.gambar?.svg).toContain('Rantai Makanan');
        });

        it('should guarantee visual diversity between Soal 1 and Soal 7 in same exam package', async () => {
            const { resolveQuestionVisualStimulus } = await import('../src/routes/kisi');
            const usedStimulusSignatures = new Set<string>();

            // Soal 1: Sistem Pencernaan Umum (Lambung)
            const q1: any = {
                no: 1,
                soal: 'Perhatikan gambar sistem pencernaan manusia berikut ini! Manakah pernyataan yang tepat mengenai bagian yang ditandai dengan huruf X?'
            };
            await resolveQuestionVisualStimulus(q1, 'IPAS', 'Sistem Pencernaan', null, usedStimulusSignatures);

            expect(q1.gambar).toBeDefined();
            expect(q1.gambar.type).toBe('svg');
            expect(q1.gambar.svg).toContain('Sistem Pencernaan Manusia');

            // Soal 7: Vili Usus Halus (Kasus nyata user)
            const q7: any = {
                no: 7,
                soal: 'Perhatikan model struktur vili usus halus berikut ini! Dengan struktur lipatan-lipatan yang membentuk tonjolan seperti ini, apa manfaat utamanya bagi proses pencernaan?'
            };
            await resolveQuestionVisualStimulus(q7, 'IPAS', 'Sistem Pencernaan', null, usedStimulusSignatures);

            expect(q7.gambar).toBeDefined();
            expect(q7.gambar.type).toBe('svg');
            // Pastikan Soal 7 BUKAN bagan makro tubuh yang sama, melainkan diagram mikroskopis Vili Usus Halus!
            expect(q7.gambar.svg).toContain('Struktur Mikroskopis Vili');
            expect(q7.gambar.svg).not.toEqual(q1.gambar.svg);
        });

        it('should prevent exact duplicate diagrams when two questions have identical organ focus', async () => {
            const { resolveQuestionVisualStimulus } = await import('../src/routes/kisi');
            const usedStimulusSignatures = new Set<string>();

            const qA: any = { no: 1, soal: 'Perhatikan gambar sistem pencernaan berikut! Organ lambung bertanda X...' };
            await resolveQuestionVisualStimulus(qA, 'IPAS', 'Sistem Pencernaan', null, usedStimulusSignatures);

            const qB: any = { no: 5, soal: 'Perhatikan gambar sistem pencernaan berikut! Organ lambung bertanda X...' };
            await resolveQuestionVisualStimulus(qB, 'IPAS', 'Sistem Pencernaan', null, usedStimulusSignatures);

            // Both questions must not have the exact same SVG
            expect(qA.gambar.svg).not.toEqual(qB.gambar?.svg);
        });

        it('should prevent exact duplicate math shapes when two questions have identical shape focus', async () => {
            const { resolveQuestionVisualStimulus } = await import('../src/routes/kisi');
            const usedStimulusSignatures = new Set<string>();

            const qA: any = { no: 1, soal: 'Perhatikan jaring-jaring kubus dengan rusuk 5 cm berikut!' };
            await resolveQuestionVisualStimulus(qA, 'Matematika', 'Bangun Ruang', null, usedStimulusSignatures);
            expect(qA.gambar?.type).toBe('svg');
            expect(qA.gambar?.title).toContain('Jaring-jaring Kubus');

            const qB: any = { no: 2, soal: 'Perhatikan jaring-jaring kubus dengan rusuk 5 cm berikut!' };
            await resolveQuestionVisualStimulus(qB, 'Matematika', 'Bangun Ruang', null, usedStimulusSignatures);
            expect(qB.gambar?.type).toBe('svg');
            // Diverted to alternative geometric shape (jaring_balok)
            expect(qB.gambar?.title).toContain('Jaring-jaring Balok');
            expect(qA.gambar?.svg).not.toEqual(qB.gambar?.svg);
        });

        it('should provide full visual catalog with 41 distinct templates', async () => {
            const { getVisualCatalog } = await import('../src/lib/visual-engine');
            const catalog = getVisualCatalog();
            expect(catalog.length).toBe(41);
            const ids = catalog.map(item => item.id);
            expect(ids).toContain('persegi_panjang');
            expect(ids).toContain('segitiga_sama_sisi');
            expect(ids).toContain('jaring_kubus');
            expect(ids).toContain('jaring_balok');
            expect(ids).toContain('koordinat');
            expect(ids).toContain('diagram_venn');
            expect(ids).toContain('pictogram');
            expect(ids).toContain('simetri_lipat');
            expect(ids).toContain('bangun_gabungan');
        });

        it('should handle /visual-catalog and /visual-render endpoints via kisi router', async () => {
            const kisi = (await import('../src/routes/kisi')).default;

            const resCatalog = await kisi.request('/visual-catalog');
            expect(resCatalog.status).toBe(200);
            const bodyCat = await resCatalog.json();
            expect(bodyCat.success).toBe(true);
            expect(bodyCat.data.length).toBe(41);

            const resRender = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'persegi_panjang', params: { p: 12, l: 8 } })
            });
            expect(resRender.status).toBe(200);
            const bodyRender = await resRender.json();
            expect(bodyRender.success).toBe(true);
            expect(bodyRender.data.svg).toContain('Persegi Panjang ABCD');
            expect(bodyRender.data.dataUri).toContain('data:image/svg+xml');
        });
    });
});
