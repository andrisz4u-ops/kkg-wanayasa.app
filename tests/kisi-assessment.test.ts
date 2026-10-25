import { describe, it, expect, vi } from 'vitest';
import { normalizeItemKisiMetadata } from '../src/routes/kisi';
import { arrayField, recordField, readApiRecord, stringField } from './helpers/typed-api-response';

describe('Assessment & Kisi-Kisi Matrix Generator Tests', () => {
    describe('normalizeItemKisiMetadata', () => {
        it('should preserve existing complete metadata for an item', () => {
            const rawItem = {
                no: 1,
                cp: 'Murid memahami siklus air dan dampaknya bagi kehidupan.',
                materi: 'Siklus Air',
                indikator: 'Disajikan bagan siklus air, murid dapat menentukan tahapan evaporasi dengan benar.',
                level: 'L1',
                bentuk: 'Pilihan Ganda',
                soal: 'Tahapan perubahan air menjadi uap air disebut...',
                kunci: 'A'
            };

            const result = normalizeItemKisiMetadata(rawItem, 'Pilihan Ganda', 1, 'Fallback CP', 'Sains');

            expect(result.no).toBe(1);
            expect(result.cp).toBe('Murid memahami siklus air dan dampaknya bagi kehidupan.');
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
                'Murid mampu menganalisis interaksi lingkungan hidup.',
                'Pelestarian Lingkungan'
            );

            expect(result.no).toBe(15);
            expect(result.cp).toBe('Murid mampu menganalisis interaksi lingkungan hidup.');
            expect(result.materi).toBe('Pelestarian Lingkungan');
            expect(result.indikator).toBe('Disajikan pertanyaan mengenai Pelestarian Lingkungan, murid dapat menentukan jawaban yang tepat.');
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

            // Peta Indonesia (Kasus nyata user)
            const qPeta: any = {
                no: 2,
                soal: 'Perhatikan gambar peta Indonesia berikut! Di pulau manakah kita tinggal? A. Pulau Jawa B. Pulau Papua C. Pulau Kalimantan D. Pulau Sumatra'
            };
            await resolveQuestionVisualStimulus(qPeta, 'IPAS', 'Kondisi Geografis Indonesia', null);
            expect(qPeta.gambar?.type).toBe('svg');
            expect(qPeta.gambar?.svg).toContain('Peta Kepulauan Indonesia');
            expect(qPeta.gambar?.svg).toContain('huruf "X"');
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

        it('should reuse a diagram for different questions with the same organ focus', async () => {
            const { resolveQuestionVisualStimulus } = await import('../src/routes/kisi');
            const usedStimulusSignatures = new Set<string>();

            const qA: any = { no: 1, soal: 'Perhatikan gambar sistem pencernaan berikut! Apa fungsi organ lambung bertanda X?' };
            await resolveQuestionVisualStimulus(qA, 'IPAS', 'Sistem Pencernaan', null, usedStimulusSignatures);

            const qB: any = { no: 5, soal: 'Perhatikan gambar sistem pencernaan berikut! Sebutkan nama organ lambung bertanda X.' };
            await resolveQuestionVisualStimulus(qB, 'IPAS', 'Sistem Pencernaan', null, usedStimulusSignatures);

            expect(qA.gambar.type).toBe('svg');
            expect(qB.gambar.type).toBe('svg');
            expect(qB.gambar.svg).toEqual(qA.gambar.svg);
        });

        it('should keep the same math shape for different questions instead of suppressing it', async () => {
            const { resolveQuestionVisualStimulus } = await import('../src/routes/kisi');
            const usedStimulusSignatures = new Set<string>();

            const qA: any = { no: 1, soal: 'Perhatikan jaring-jaring kubus dengan rusuk 5 cm berikut!' };
            await resolveQuestionVisualStimulus(qA, 'Matematika', 'Bangun Ruang', null, usedStimulusSignatures);
            expect(qA.gambar?.type).toBe('svg');
            expect(qA.gambar?.title).toContain('Jaring-jaring Kubus');

            const qB: any = { no: 2, soal: 'Perhatikan jaring-jaring kubus dengan rusuk 5 cm berikut! Berapa volume kubusnya?' };
            await resolveQuestionVisualStimulus(qB, 'Matematika', 'Bangun Ruang', null, usedStimulusSignatures);
            expect(qB.gambar?.type).toBe('svg');
            expect(qB.gambar?.svg).toEqual(qA.gambar.svg);
            expect(qB.gambar?.imageUnavailable).toBeUndefined();
        });

        it('should provide full visual catalog with 200 distinct templates', async () => {
            const { getVisualCatalog } = await import('../src/lib/visual-engine');
            const catalog = getVisualCatalog();
            expect(catalog.length).toBe(200);
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
            expect(ids).toContain('peta_indonesia');
            expect(ids).toContain('rangkaian_listrik');
            expect(ids).toContain('perubahan_wujud');
            expect(ids).toContain('mistar');
            expect(ids).toContain('tata_surya');
            expect(ids).toContain('perisai_pancasila');
            expect(ids).toContain('busur_derajat');
            expect(ids).toContain('magnet');
            expect(ids).toContain('sifat_cahaya');
            expect(ids).toContain('peredaran_darah');
            expect(ids).toContain('gerhana');
            expect(ids).toContain('pesawat_sederhana');
            expect(ids).toContain('pancaindra');
            expect(ids).toContain('timbangan_neraca');
            expect(ids).toContain('mata_angin');
            expect(ids).toContain('tabel_turus');
            expect(ids).toContain('spinner_peluang');
            expect(ids).toContain('pola_gambar');
            expect(ids).toContain('flowchart');
            // Stage 3 & 4 templates
            expect(ids).toContain('termometer');
            expect(ids).toContain('gelas_ukur');
            expect(ids).toContain('pohon_faktor');
            expect(ids).toContain('grid_matriks_100');
            expect(ids).toContain('rambu_lalu_lintas');
            expect(ids).toContain('piring_gizi_seimbang');
            expect(ids).toContain('lapangan_olahraga');
            expect(ids).toContain('preposition_place');
            expect(ids).toContain('tangga_nada');
            expect(ids).toContain('lingkaran_warna');
            expect(ids).toContain('struktur_pemda');
            expect(ids).toContain('grid_maze_koding');
            // Batch 1 templates
            expect(ids).toContain('stopwatch_analog');
            expect(ids).toContain('jangka_sorong');
            expect(ids).toContain('neraca_pasar');
            expect(ids).toContain('tangga_satuan_panjang');
            expect(ids).toContain('jaring_limas_segiempat');
            expect(ids).toContain('blok_dienes');
            expect(ids).toContain('sempoa_abakus');
            expect(ids).toContain('diagram_batang_ganda');
            expect(ids).toContain('papan_galton_peluang');
            // Batch 2 templates
            expect(ids).toContain('rangka_manusia');
            expect(ids).toContain('sendi_gerak');
            expect(ids).toContain('metamorfosis_katak');
            expect(ids).toContain('fase_bulan');
            expect(ids).toContain('lapisan_bumi');
            expect(ids).toContain('baterai_buah');
            expect(ids).toContain('rumah_adat_nusantara');
            expect(ids).toContain('alat_musik_tradisional');
            expect(ids).toContain('trias_politika');
            expect(ids).toContain('sudut_berpelurus_berpenyiku');
            expect(ids).toContain('teorema_pythagoras');
            expect(ids).toContain('segitiga_pascal');
            expect(ids).toContain('koding_blok_percabangan');
            // Batch 3 templates (Target 200 SVG Catalog!)
            expect(ids).toContain('rantai_makanan_laut');
            expect(ids).toContain('daur_hidup_kupu_detail');
            expect(ids).toContain('bagian_akar_tumbuhan');
            expect(ids).toContain('macam_macam_gaya');
            expect(ids).toContain('pesawat_sederhana_bidang_miring');
            expect(ids).toContain('pembangkit_listrik_plta');
            expect(ids).toContain('garis_wallace_weber');
            expect(ids).toContain('candi_dan_peninggalan_sejarah');
            expect(ids).toContain('motif_batik_nusantara');
            expect(ids).toContain('sudut_luar_segitiga');
            expect(ids).toContain('jaring_kerucut');
            expect(ids).toContain('diagram_alur_logika_gerbang');
            expect(ids).toContain('pecahan_desimal_persen_senilai');
        });

        it('should handle /visual-catalog and /visual-render endpoints via kisi router', async () => {
            const kisi = (await import('../src/routes/kisi')).default;

            const resCatalog = await kisi.request('/visual-catalog');
            expect(resCatalog.status).toBe(200);
            const bodyCat = await readApiRecord(resCatalog);
            expect(bodyCat.success).toBe(true);
            expect(arrayField(bodyCat, 'data').length).toBe(200);

            const resRender = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'persegi_panjang', params: { p: 12, l: 8 } })
            });
            expect(resRender.status).toBe(200);
            const bodyRender = await readApiRecord(resRender);
            expect(bodyRender.success).toBe(true);
            const renderData = recordField(bodyRender, 'data');
            expect(stringField(renderData, 'svg')).toContain('Persegi Panjang ABCD');
            expect(stringField(renderData, 'dataUri')).toContain('data:image/svg+xml');

            const resRenderPeta = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'peta_indonesia', params: { pointer: 'jawa', label: 'X' } })
            });
            expect(resRenderPeta.status).toBe(200);
            const bodyRenderPeta = await readApiRecord(resRenderPeta);
            expect(bodyRenderPeta.success).toBe(true);
            const petaData = recordField(bodyRenderPeta, 'data');
            expect(stringField(petaData, 'svg')).toContain('Peta Kepulauan Indonesia');
            expect(stringField(petaData, 'svg')).toContain('huruf "X"');

            // Test 5 template SVG sebelumnya:
            // 1. Rangkaian Listrik
            const resListrik = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'rangkaian_listrik', params: { model: 'campuran', s1: true, s2: false, pointer: 'L1', label: 'X' } })
            });
            const bodyListrik = await readApiRecord(resListrik);
            expect(bodyListrik.success).toBe(true);
            const listrikData = recordField(bodyListrik, 'data');
            expect(stringField(listrikData, 'svg')).toContain('Rangkaian Listrik');
            expect(stringField(listrikData, 'svg')).toContain('Baterai');

            // 2. Perubahan Wujud
            const resWujud = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'perubahan_wujud', params: { pointer: '1', label: 'X' } })
            });
            const bodyWujud = await readApiRecord(resWujud);
            expect(bodyWujud.success).toBe(true);
            const wujudData = recordField(bodyWujud, 'data');
            expect(stringField(wujudData, 'svg')).toContain('Perubahan Wujud Zat');
            expect(stringField(wujudData, 'svg')).toContain('PADAT');
            expect(stringField(wujudData, 'svg')).toContain('CAIR');
            expect(stringField(wujudData, 'svg')).toContain('GAS');

            // 3. Mistar
            const resMistar = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'mistar', params: { start: 2.5, end: 8.5, objectType: 'pensil', label: 'Panjang = ... cm' } })
            });
            const bodyMistar = await readApiRecord(resMistar);
            expect(bodyMistar.success).toBe(true);
            const mistarData = recordField(bodyMistar, 'data');
            expect(stringField(mistarData, 'svg')).toContain('Pengukuran Panjang dengan Mistar');
            expect(stringField(mistarData, 'svg')).toContain('cm');

            // 4. Tata Surya
            const resSurya = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'tata_surya', params: { pointer: 'bumi', label: 'X' } })
            });
            const bodySurya = await readApiRecord(resSurya);
            expect(bodySurya.success).toBe(true);
            const suryaData = recordField(bodySurya, 'data');
            expect(stringField(suryaData, 'svg')).toContain('Sistem Tata Surya');
            expect(stringField(suryaData, 'svg')).toContain('Matahari');

            // 5. Perisai Pancasila
            const resPerisai = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'perisai_pancasila', params: { sila: 1, label: 'X' } })
            });
            const bodyPerisai = await readApiRecord(resPerisai);
            expect(bodyPerisai.success).toBe(true);
            expect(stringField(recordField(bodyPerisai, 'data'), 'svg')).toContain('Perisai Garuda Pancasila');

            // Test 3 template SVG baru:
            // 6. Busur Derajat
            const resBusur = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'busur_derajat', params: { derajat: 60, label: 'X' } })
            });
            const bodyBusur = await readApiRecord(resBusur);
            expect(bodyBusur.success).toBe(true);
            const busurData = recordField(bodyBusur, 'data');
            expect(stringField(busurData, 'svg')).toContain('Pengukuran Sudut Busur Derajat');
            expect(stringField(busurData, 'svg')).toContain('0°');
            expect(stringField(busurData, 'svg')).toContain('180°');

            // 7. Magnet
            const resMagnet = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'magnet', params: { interaksi: 'tarik', pointer: 'kanan2', label: 'X' } })
            });
            const bodyMagnet = await readApiRecord(resMagnet);
            expect(bodyMagnet.success).toBe(true);
            const magnetData = recordField(bodyMagnet, 'data');
            expect(stringField(magnetData, 'svg')).toContain('Interaksi Gaya Magnet');
            expect(stringField(magnetData, 'svg')).toContain('[X]');

            // 8. Sifat Cahaya
            const resCahaya = await kisi.request('/visual-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'sifat_cahaya', params: { peristiwa: 'pembiasan', pointer: 'X', label: 'X' } })
            });
            const bodyCahaya = await readApiRecord(resCahaya);
            expect(bodyCahaya.success).toBe(true);
            const cahayaData = recordField(bodyCahaya, 'data');
            expect(stringField(cahayaData, 'svg')).toContain('Diagram Sifat Cahaya (Pembiasan)');
            expect(stringField(cahayaData, 'svg')).toContain('Garis Normal');
        });
    });

    describe('Prompt Debris Sanitization & Clean Question Stem Tests', () => {
        it('should strip visual_stimulus tag from Question 1 in user screenshot', async () => {
            const { cleanPromptDebris, normalizeSoalMarkdown } = await import('../src/routes/kisi');
            const rawSoal = 'Perhatikan gambar berikut!\nvisual_stimulus {"type": "sudut", "params": {"derajat": 90}}\nBerdasarkan gambar, besar sudut tersebut adalah ...';
            
            const cleaned = cleanPromptDebris(rawSoal);
            expect(cleaned).not.toContain('visual_stimulus');
            expect(cleaned).not.toContain('"derajat": 90');
            expect(cleaned).toBe('Perhatikan gambar berikut!\nBerdasarkan gambar, besar sudut tersebut adalah ...');

            const normalized = normalizeSoalMarkdown(rawSoal);
            expect(normalized).toBe('Perhatikan gambar berikut!\nBerdasarkan gambar, besar sudut tersebut adalah ...');
        });

        it('should strip visual_stimulus tag from Question 2 in user screenshot', async () => {
            const { cleanPromptDebris, normalizeSoalMarkdown } = await import('../src/routes/kisi');
            const rawSoal = 'Perhatikan gambar berikut!\nvisual_stimulus {"type": "sudut", "params": {"derajat": 45}}\nJenis sudut pada gambar tersebut adalah ...';
            
            const cleaned = cleanPromptDebris(rawSoal);
            expect(cleaned).not.toContain('visual_stimulus');
            expect(cleaned).not.toContain('"derajat": 45');
            expect(cleaned).toBe('Perhatikan gambar berikut!\nJenis sudut pada gambar tersebut adalah ...');

            const normalized = normalizeSoalMarkdown(rawSoal);
            expect(normalized).toBe('Perhatikan gambar berikut!\nJenis sudut pada gambar tersebut adalah ...');
        });

        it('should strip multiline visual_stimulus with nested objects/arrays and bracketed labels', async () => {
            const { cleanPromptDebris } = await import('../src/routes/kisi');
            const multilineSoal = `Perhatikan gambar berikut!
[visual_stimulus: organ_pencernaan]
visual_stimulus {
  "type": "organ_pencernaan",
  "params": {
    "pointer": "lambung",
    "label": "X"
  }
}
gambar_keyword: Lambung
gambar_prompt_en: human stomach anatomical diagram
Organ pencernaan yang ditunjuk oleh huruf X berfungsi untuk menghasilkan enzim ...`;

            const cleaned = cleanPromptDebris(multilineSoal);
            expect(cleaned).not.toContain('visual_stimulus');
            expect(cleaned).not.toContain('gambar_keyword');
            expect(cleaned).not.toContain('gambar_prompt_en');
            expect(cleaned).not.toContain('lambung');
            expect(cleaned).toContain('Perhatikan gambar berikut!');
            expect(cleaned).toContain('Organ pencernaan yang ditunjuk oleh huruf X berfungsi untuk menghasilkan enzim ...');
        });

        it('should extract visual stimulus from q.soal if AI failed to set q.visual_stimulus property', async () => {
            const { resolveQuestionVisualStimulus, normalizeSoalMarkdown } = await import('../src/routes/kisi');
            const question: any = {
                no: 1,
                soal: 'Perhatikan gambar berikut!\nvisual_stimulus {"type": "sudut", "params": {"derajat": 90}}\nBerdasarkan gambar, besar sudut tersebut adalah ...'
            };

            // Before resolution, q.visual_stimulus is undefined
            expect(question.visual_stimulus).toBeUndefined();

            await resolveQuestionVisualStimulus(question, 'Matematika', 'Pengukuran Sudut', null);

            // Now question.visual_stimulus should be populated and SVG generated
            expect(question.visual_stimulus).toBeDefined();
            expect(question.visual_stimulus.type).toBe('sudut');
            expect(question.gambar).toBeDefined();
            expect(question.gambar.type).toBe('svg');
            expect(question.gambar.svg).toContain('Sudut ABC');
            expect(question.gambar.svg).toContain('90°');

            // Then cleaning normalizeSoalMarkdown cleans question.soal completely
            question.soal = normalizeSoalMarkdown(question.soal);
            expect(question.soal).not.toContain('visual_stimulus');
            expect(question.soal).toBe('Perhatikan gambar berikut!\nBerdasarkan gambar, besar sudut tersebut adalah ...');
        });
    });

    describe('shouldEnableVisualStimulusForTopic', () => {
        it('should suppress visual images for language literature and grammar topics like Majas', async () => {
            const { shouldEnableVisualStimulusForTopic } = await import('../src/routes/kisi');

            // Bahasa Indonesia with literature / grammatical topics
            expect(shouldEnableVisualStimulusForTopic('Bahasa Indonesia', 'Majas Metafora dan Hiperbola', true)).toBe(false);
            expect(shouldEnableVisualStimulusForTopic('Bahasa Indonesia', 'Puisi dan Pantun', true)).toBe(false);
            expect(shouldEnableVisualStimulusForTopic('Bahasa Indonesia', 'Kalimat Efektif dan Tanda Baca', true)).toBe(false);
            expect(shouldEnableVisualStimulusForTopic('Bahasa Sunda', 'Kawih dan Pupuh', true)).toBe(false);
        });

        it('should allow visual images for language topics that explicitly require visual media (rambu, iklan, denah)', async () => {
            const { shouldEnableVisualStimulusForTopic } = await import('../src/routes/kisi');

            expect(shouldEnableVisualStimulusForTopic('Bahasa Indonesia', 'Membaca Rambu Lalu Lintas', true)).toBe(true);
            expect(shouldEnableVisualStimulusForTopic('Bahasa Indonesia', 'Menganalisis Iklan dan Poster', true)).toBe(true);
            expect(shouldEnableVisualStimulusForTopic('Bahasa Indonesia', 'Denah dan Petunjuk Arah', true)).toBe(true);
            expect(shouldEnableVisualStimulusForTopic('Bahasa Indonesia', 'Cerita Bergambar / Komik', true)).toBe(true);
        });

        it('should allow visual images for STEM and social subjects by default when toggle is true', async () => {
            const { shouldEnableVisualStimulusForTopic } = await import('../src/routes/kisi');

            expect(shouldEnableVisualStimulusForTopic('IPAS', 'Sistem Pencernaan Manusia', true)).toBe(true);
            expect(shouldEnableVisualStimulusForTopic('Matematika', 'Geometri Bangun Ruang', true)).toBe(true);
            expect(shouldEnableVisualStimulusForTopic('Pendidikan Pancasila', 'Simbol Garuda Pancasila', true)).toBe(true);
        });

        it('should allow visual images for Bahasa Inggris communicative and vocabulary topics (foods, drinks, tastes, animals)', async () => {
            const { shouldEnableVisualStimulusForTopic, calculateAdaptiveVisualQuota } = await import('../src/routes/kisi');

            expect(shouldEnableVisualStimulusForTopic('Bahasa Inggris', 'Rasa Makanan dan Minuman', true)).toBe(true);
            expect(shouldEnableVisualStimulusForTopic('Bahasa Inggris', 'Foods and Drinks', true)).toBe(true);
            expect(shouldEnableVisualStimulusForTopic('Bahasa Inggris', 'Animals and Pets', true)).toBe(true);
            expect(shouldEnableVisualStimulusForTopic('English', 'Tastes and Flavors', true)).toBe(true);

            // Quota test: 10 PG -> 2 images, 15 PG -> 3 images
            const quota10 = calculateAdaptiveVisualQuota('Bahasa Inggris', 'Rasa Makanan dan Minuman', 10);
            expect(quota10.exactImages).toBe(2);

            const quota15 = calculateAdaptiveVisualQuota('Bahasa Inggris', 'Rasa Makanan dan Minuman', 15);
            expect(quota15.exactImages).toBe(3);
        });

        it('should return false if user toggle flag is false regardless of subject', async () => {
            const { shouldEnableVisualStimulusForTopic } = await import('../src/routes/kisi');

            expect(shouldEnableVisualStimulusForTopic('IPAS', 'Sistem Pencernaan', false)).toBe(false);
            expect(shouldEnableVisualStimulusForTopic('Matematika', 'Pecahan', false)).toBe(false);
            expect(shouldEnableVisualStimulusForTopic('Bahasa Inggris', 'Rasa Makanan dan Minuman', false)).toBe(false);
        });
    });

    describe('Wikimedia Query Sanitization & Jane Austen Bug Prevention', () => {
        it('should block generic question instruction phrases from searching Wikimedia', async () => {
            const { UnsplashService } = await import('../src/services/unsplash');
            const unsplash = new UnsplashService({});

            // Searching generic prompt phrases should return null, not Jane Austen
            const res1 = await unsplash.searchImage('Perhatikan gambar', 'Perhatikan gambar berikut!');
            expect(res1).toBeNull();

            const res2 = await unsplash.searchImage('perhatikan gambar berikut', 'soal');
            expect(res2).toBeNull();

            const res3 = await unsplash.searchImage('gambar berikut', 'diagram');
            expect(res3).toBeNull();
        });
    });

    describe('Surgical Batch Question Regeneration (Multi-Item 1-Call)', () => {
        it('should construct a cohesive batch regeneration prompt with target question numbers, preserved levels, and custom instructions', async () => {
            const { buildBatchRegeneratePrompt } = await import('../src/routes/kisi');

            const prompt = buildBatchRegeneratePrompt({
                mataPelajaran: 'IPAS',
                topik: 'Sistem Peredaran Darah Manusia',
                jenjangKelas: 'Kelas 5',
                semester: 'Ganjil',
                capaianPembelajaran: 'Peserta didik memahami sistem organ tubuh manusia...',
                customInstruction: 'Gunakan studi kasus kehidupan sehari-hari anak dan tingkatkan analisis HOTS',
                itemsToReplace: [
                    { type: 'pg', no: 3, level: 'L2', materi: 'Fungsi Jantung', currentSoal: 'Soal lama fungsi jantung...' },
                    { type: 'pg', no: 5, level: 'L1', materi: 'Pembuluh Darah', currentSoal: 'Soal lama pembuluh darah...' },
                    { type: 'pg', no: 7, level: 'L3', materi: 'Penyakit Anemia', currentSoal: 'Soal lama penyakit anemia...' },
                    { type: 'pg', no: 13, level: 'L2', materi: 'Cara Menjaga Kesehatan', currentSoal: 'Soal lama kesehatan...' }
                ],
                existingQuestionsSummary: [
                    'No 1: Organ pernapasan hidung',
                    'No 2: Fungsi paru-paru',
                    'No 4: Urutan peredaran darah besar'
                ]
            });

            expect(prompt).toContain('NOMOR URUT: 3');
            expect(prompt).toContain('NOMOR URUT: 5');
            expect(prompt).toContain('NOMOR URUT: 7');
            expect(prompt).toContain('NOMOR URUT: 13');
            expect(prompt).toContain('Gunakan studi kasus kehidupan sehari-hari');
            expect(prompt).toContain('RINGKASAN MATERI SOAL-SOAL LAIN');
            expect(prompt).toContain('No 1: Organ pernapasan hidung');
            expect(prompt).toContain('DILARANG menggunakan teks/wacana ini lagi');
        });

        it('should reject unauthorized /regenerate-batch request without auth session', async () => {
            const kisiRoute = (await import('../src/routes/kisi')).default;
            const res = await kisiRoute.request('/regenerate-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mataPelajaran: 'IPAS',
                    topik: 'Peredaran Darah',
                    itemsToReplace: [{ type: 'pg', no: 3 }]
                })
            });

            expect(res.status).toBe(401);
            const data = await readApiRecord(res);
            expect(data.success).toBe(false);
            expect(stringField(recordField(data, 'error'), 'message')).toContain('login');
        });
    });

    describe('Image Proxy Endpoint (/proxy-image)', () => {
        it('should reject request without url parameter with 400', async () => {
            const kisiRoute = (await import('../src/routes/kisi')).default;
            const res = await kisiRoute.request('/proxy-image');
            expect(res.status).toBe(400);
            const data = await readApiRecord(res);
            expect(stringField(recordField(data, 'error'), 'message')).toContain('url wajib disertakan');
        });

        it('should reject non-http/https protocol with 400', async () => {
            const kisiRoute = (await import('../src/routes/kisi')).default;
            const res = await kisiRoute.request('/proxy-image?url=ftp://example.com/image.png');
            expect(res.status).toBe(400);
            const data = await readApiRecord(res);
            expect(stringField(recordField(data, 'error'), 'message')).toContain('tidak didukung');
        });

        it('should reject SSRF attempts to localhost or internal IP with 403', async () => {
            const kisiRoute = (await import('../src/routes/kisi')).default;
            const localRes = await kisiRoute.request('/proxy-image?url=http://localhost:8787/secret');
            expect(localRes.status).toBe(403);

            const ipRes = await kisiRoute.request('/proxy-image?url=http://127.0.0.1:8787/secret');
            expect(ipRes.status).toBe(403);

            const privateRes = await kisiRoute.request('/proxy-image?url=http://192.168.1.1/admin');
            expect(privateRes.status).toBe(403);
        });
    });
describe('Visual Quota Allocation & Split Contract (10 PG -> 1 SVG + 1 Photo)', () => {
        it('should strictly allocate exactly 1 SVG and 1 Photo generator image and heal unselected question stems', async () => {
            const { enrichAndNormalizePG } = await import('../src/routes/kisi');
            const fakeUnsplash = {
                searchImage: vi.fn(async () => ({
                    url: 'https://cdn.example/embun-daun.jpg',
                    creditName: 'Z-Image-Turbo Generator',
                    source: 'vultr-ai'
                }))
            };

            const pgQuestions = [
                { no: 1, soal: 'Air di permukaan bumi mengalami pemanasan oleh sinar matahari.', opsi: { A: '1', B: '2', C: '3', D: '4' }, kunci: 'A' },
                { no: 2, soal: 'Perhatikan diagram siklus air berikut! Proses yang ditunjukkan huruf X adalah ...', opsi: { A: 'Evaporasi', B: 'Kondensasi', C: 'Presipitasi', D: 'Infiltrasi' }, kunci: 'B', visual_stimulus: { type: 'siklus_air', params: { pointer: 'kondensasi', label: 'X' } } },
                { no: 3, soal: 'Pak Anton menanam pohon untuk membantu resapan air tanah.', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' },
                { no: 4, soal: 'Infiltrasi air bergantung pada jenis tanah penutup.', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' },
                { no: 5, soal: 'Perhatikan gambar rantai makanan di ekosistem danau berikut! Jika musim kemarau panjang menyebabkan volume air menyusut drastis, analisis dampaknya adalah ....', opsi: { A: 'Fitoplankton meningkat', B: 'Ikan berkurang', C: 'Oksigen turun', D: 'Burung lapar' }, kunci: 'C', visual_stimulus: { type: 'rantai_makanan', params: { pointer: 'produsen', label: 'X' } } },
                { no: 6, soal: 'Desa Sukamaju mengalami kekeringan di musim kemarau.', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' },
                { no: 7, soal: 'Perhatikan gambar berikut! Fenomena embun di daun pada pagi hari merupakan contoh peristiwa ....', opsi: { A: 'Evaporasi', B: 'Transpirasi', C: 'Kondensasi', D: 'Presipitasi' }, kunci: 'C', gambar_keyword: 'Embun di daun', gambar_prompt_en: 'morning dew drops on green leaves' },
                { no: 8, soal: 'Tumbuhan kaktus memiliki daun berbentuk duri.', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' },
                { no: 9, soal: 'Hewan beruang kutub memiliki lapisan lemak yang tebal.', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' },
                { no: 10, soal: 'Adaptasi morfologi adalah penyesuaian bentuk tubuh makhluk hidup.', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' },
            ];

            const result = await enrichAndNormalizePG(pgQuestions, {
                mataPelajaran: 'IPAS',
                topik: 'Siklus Air & Ekosistem',
                isGambarEnabled: true,
                unsplash: fakeUnsplash as any,
                exactImageCount: 2
            });

            expect(result.length).toBe(10);
            expect(result[1].gambar?.type).toBe('svg');
            expect(result[1].gambar?.svg).toBeDefined();

            expect(result[6].gambar?.url).toBe('https://cdn.example/embun-daun.jpg');
            expect(fakeUnsplash.searchImage).toHaveBeenCalledTimes(1);

            expect(result[4].gambar).toBeUndefined();
            expect(result[4].imageUnavailable).toBeUndefined();
            expect(result[4].soal).not.toMatch(/^Perhatikan gambar/i);
            expect(result[4].soal).toContain('Jika musim kemarau panjang menyebabkan volume air menyusut drastis');
        });

        it('should strictly allocate 100% SVG for Matematika and NEVER query provider AI images', async () => {
            const { enrichAndNormalizePG } = await import('../src/routes/kisi');
            const fakeUnsplash = {
                searchImage: vi.fn(async () => ({
                    url: 'https://cdn.example/hallucinated-clock.jpg',
                    creditName: 'Z-Image-Turbo Generator',
                    source: 'vultr-ai'
                }))
            };

            const mathQuestions = [
                { no: 1, soal: 'Hasil dari 12 x 15 adalah ...', opsi: { A: '180', B: '150', C: '160', D: '170' }, kunci: 'A' },
                { no: 2, soal: 'Sebuah balok memiliki panjang 10 cm, lebar 6 cm, dan tinggi 4 cm. Volume balok adalah ...', opsi: { A: '240 cm³', B: '120 cm³', C: '200 cm³', D: '260 cm³' }, kunci: 'A', visual_stimulus: { type: 'balok', params: { p: 10, l: 6, t: 4, unit: 'cm' } } },
                { no: 3, soal: 'Hasil dari 2/5 + 1/3 adalah ...', opsi: { A: '3/8', B: '11/15', C: '3/15', D: '7/15' }, kunci: 'B' },
                { no: 4, soal: 'Sebuah segitiga memiliki alas 10 cm dan tinggi 6 cm. Luas segitiga tersebut adalah ...', opsi: { A: '60 cm²', B: '30 cm²', C: '16 cm²', D: '20 cm²' }, kunci: 'B', visual_stimulus: { type: 'segitiga_siku', params: { alas: 10, tinggi: 6, unit: 'cm' } } },
                { no: 5, soal: 'Keliling persegi dengan panjang sisi 8 cm adalah ...', opsi: { A: '32 cm', B: '24 cm', C: '16 cm', D: '64 cm' }, kunci: 'A' },
                { no: 6, soal: 'Sebuah lingkaran memiliki jari-jari 7 cm. Luas lingkaran adalah ...', opsi: { A: '154 cm²', B: '144 cm²', C: '134 cm²', D: '164 cm²' }, kunci: 'A', visual_stimulus: { type: 'lingkaran', params: { r: 7, unit: 'cm' } } },
                { no: 7, soal: 'Hasil dari 150 : 5 + 25 adalah ...', opsi: { A: '55', B: '60', C: '65', D: '50' }, kunci: 'A' },
                { no: 8, soal: 'Sudut siku-siku memiliki besar sudut ...', opsi: { A: '90°', B: '60°', C: '45°', D: '180°' }, kunci: 'A' },
                { no: 9, soal: 'Nilai pecahan 3/4 senilai dengan ...', opsi: { A: '6/8', B: '5/8', C: '4/8', D: '7/8' }, kunci: 'A' },
                { no: 10, soal: 'FPB dari 12 dan 18 adalah ...', opsi: { A: '6', B: '4', C: '3', D: '2' }, kunci: 'A' },
            ];

            const result = await enrichAndNormalizePG(mathQuestions, {
                mataPelajaran: 'Matematika',
                topik: 'Geometri & Pengukuran',
                isGambarEnabled: true,
                unsplash: fakeUnsplash as any,
                exactImageCount: 2
            });

            expect(result.length).toBe(10);
            // Provider AI generator is NEVER queried for Matematika:
            expect(fakeUnsplash.searchImage).not.toHaveBeenCalled();

            // Total visual items with images is exactly 2:
            const itemsWithImage = result.filter(q => q.gambar && q.gambar.url);
            expect(itemsWithImage.length).toBe(2);

            // 100% of the images are precision SVGs:
            itemsWithImage.forEach(q => {
                expect(q.gambar?.type).toBe('svg');
                expect(q.gambar?.svg).toBeDefined();
                expect(q.gambar?.url).toContain('data:image/svg+xml');
            });
        });
    });
});
