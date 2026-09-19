import { describe, it, expect } from 'vitest';
import { validate, generateSppdSchema } from '../src/lib/validation';
import { hitungHPlus1, formatTanggalIndo, formatHariTanggalIndo, generateSppdBuffer } from '../src/lib/docx/sppd';
import { buildSppdLhpPrompt } from '../src/lib/mistral';

describe('Paket Surat Tugas & SPPD Unit Tests', () => {
    describe('Validation Schema (generateSppdSchema)', () => {
        it('should pass with valid SPPD data', () => {
            const validData = {
                sekolah_asal_nama: 'SD Negeri 2 Nangerang',
                kepala_sekolah_asal: "H. Ujang Ma'mun, S.Pd.I",
                nip_kepala_sekolah_asal: '196912122007011021',
                alamat_sekolah_asal: 'Jl. Wanayasa No. 12',
                sekolah_tujuan_nama: 'SDN 1 Legokhuni',
                kepala_sekolah_tujuan: 'Hj. Siti Rohmah, M.Pd',
                nip_kepala_sekolah_tujuan: '197505102005012003',
                daftar_guru: [
                    {
                        nama: 'Andris, S.Pd',
                        nip: '199305012022211003',
                        pangkat_golongan: 'Penata Muda / IX',
                        jabatan: 'Guru Kelas VI'
                    }
                ],
                tanggal_kegiatan: '2026-09-22',
                waktu_kegiatan: '08.00 s.d Selesai',
                tempat_kegiatan: 'SDN 1 Legokhuni',
                agenda: 'Workshop Analisis Capaian Pembelajaran Kurikulum Merdeka',
                alat_angkut: 'Sepeda Motor',
                tingkat_biaya: 'Biaya Transport Lokal',
                biaya_transport: 'Rp 20.000',
                mata_anggaran: 'Dana BOS Tahap II Tahun Anggaran 2026'
            };

            const res = validate(generateSppdSchema, validData);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.data.sekolah_asal_nama).toBe('SD Negeri 2 Nangerang');
                expect(res.data.daftar_guru.length).toBe(1);
            }
        });

        it('should pass with custom destination and kop_surat_url', () => {
            const customData = {
                sekolah_asal_nama: 'SD Negeri 1 Nangerang',
                kepala_sekolah_asal: 'Dra. Hj. Nunung',
                nip_kepala_sekolah_asal: '197001012000032001',
                alamat_sekolah_asal: 'Jl. Raya Wanayasa No. 45',
                kop_surat_url: 'https://example.com/kop-sdn1.png',
                sekolah_tujuan_nama: 'Gedung Guru PGRI Cabang Wanayasa',
                tempat_kegiatan: 'Gedung Guru PGRI Cabang Wanayasa',
                kepala_sekolah_tujuan: 'Ketua PGRI Cabang Wanayasa',
                nip_kepala_sekolah_tujuan: '-',
                daftar_guru: [{ nama: 'Budi, S.Pd', nip: '198801012015011002' }],
                tanggal_kegiatan: '2026-09-25',
                agenda: 'Konferensi Kerja Cabang PGRI'
            };

            const res = validate(generateSppdSchema, customData);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.data.tempat_kegiatan).toBe('Gedung Guru PGRI Cabang Wanayasa');
                expect(res.data.kop_surat_url).toBe('https://example.com/kop-sdn1.png');
            }
        });

        it('should fail when sekolah_asal_nama is missing', () => {
            const invalidData = {
                kepala_sekolah_asal: 'Kepala Sekolah',
                sekolah_tujuan_nama: 'SDN 1 Legokhuni',
                daftar_guru: [{ nama: 'Guru 1' }],
                tanggal_kegiatan: '2026-09-22',
                tempat_kegiatan: 'SDN 1 Legokhuni',
                agenda: 'Rapat KKG'
            };

            const res = validate(generateSppdSchema, invalidData);
            expect(res.success).toBe(false);
            if (!res.success) {
                expect(res.errors.some(e => e.field === 'sekolah_asal_nama')).toBe(true);
            }
        });

        it('should fail when daftar_guru is empty', () => {
            const invalidData = {
                sekolah_asal_nama: 'SDN 1 Wanayasa',
                kepala_sekolah_asal: 'Kepala Sekolah',
                sekolah_tujuan_nama: 'SDN 2 Wanayasa',
                daftar_guru: [],
                tanggal_kegiatan: '2026-09-22',
                tempat_kegiatan: 'SDN 2 Wanayasa',
                agenda: 'Rapat KKG'
            };

            const res = validate(generateSppdSchema, invalidData);
            expect(res.success).toBe(false);
        });
    });

    describe('Date Calculation & Formatting Helpers', () => {
        it('should calculate H+1 date strictly according to the reference rule', () => {
            expect(hitungHPlus1('2026-09-22')).toBe('2026-09-23');
            expect(hitungHPlus1('2026-09-30')).toBe('2026-10-01');
            expect(hitungHPlus1('2026-12-31')).toBe('2027-01-01');
            expect(hitungHPlus1('2026-02-28')).toBe('2026-03-01');
        });

        it('should format Indonesian dates accurately', () => {
            expect(formatTanggalIndo('2026-09-22')).toBe('22 September 2026');
            expect(formatHariTanggalIndo('2026-09-22')).toBe('Selasa, 22 September 2026');
        });
    });

    describe('AI LHP Prompt Builder', () => {
        it('should generate structured prompt containing context and constraints', () => {
            const prompt = buildSppdLhpPrompt({
                agenda: 'Penyusunan Modul Ajar Mendalam',
                tanggal_kegiatan: '2026-09-22',
                tempat_kegiatan: 'SDN 1 Wanayasa',
                daftar_guru_str: 'Andris, S.Pd',
                sekolah_asal_nama: 'SDN 2 Nangerang'
            });

            expect(prompt).toContain('Penyusunan Modul Ajar Mendalam');
            expect(prompt).toContain('SDN 2 Nangerang');
            expect(prompt).toContain('SDN 1 Wanayasa');
            expect(prompt).toContain('HASIL PELAKSANAAN TUGAS');
        });
    });

    describe('DOCX Document Engine (generateSppdBuffer)', () => {
        it('should create valid DOCX 4-in-1 buffer starting with PK zip header', async () => {
            const sppdInput = {
                sekolah_asal_nama: 'SD Negeri 2 Nangerang',
                kepala_sekolah_asal: "H. Ujang Ma'mun, S.Pd.I",
                nip_kepala_sekolah_asal: '196912122007011021',
                alamat_sekolah_asal: 'Desa Nangerang, Wanayasa',
                nomor_surat_tugas: '421.2 / 058 / SDN 2 Ngr / IX / 2026',
                nomor_sppd: '090 / 058 / SDN 2 Ngr / IX / 2026',
                sekolah_tujuan_nama: 'SDN 1 Legokhuni',
                kepala_sekolah_tujuan: 'Hj. Siti Rohmah, M.Pd',
                nip_kepala_sekolah_tujuan: '197505102005012003',
                daftar_guru: [
                    {
                        nama: 'Andris, S.Pd',
                        nip: '199305012022211003',
                        pangkat_golongan: 'Penata Muda / IX',
                        jabatan: 'Guru Kelas VI'
                    }
                ],
                tanggal_kegiatan: '2026-09-22',
                waktu_kegiatan: '08.00 WIB s.d Selesai',
                tempat_kegiatan: 'SDN 1 Legokhuni',
                agenda: 'Kegiatan Rutin KKG Gugus 3 Wanayasa',
                alat_angkut: 'Sepeda Motor',
                tingkat_biaya: 'Biaya Transport Lokal',
                biaya_transport: 'Rp 20.000',
                mata_anggaran: 'Dana BOS Tahap II TA 2026',
                lama_hari: '1 (satu) hari',
                tanggal_lhp: '2026-09-23',
                isi_lhp: '1. Mengikuti kegiatan pembukaan dan pengantar materi.\n2. Menyusun analisis capaian pembelajaran kurikulum merdeka.\n3. Berbagi praktik baik antar guru kelas di gugus 3.'
            };

            const buffer = await generateSppdBuffer(sppdInput, {
                kabupaten: 'Purwakarta',
                kecamatan: 'Wanayasa'
            });

            expect(buffer).toBeDefined();
            expect(buffer.length).toBeGreaterThan(1000);
            // Verify PK ZIP magic bytes for standard docx file
            expect(buffer[0]).toBe(0x50); // P
            expect(buffer[1]).toBe(0x4B); // K
            expect(buffer[2]).toBe(0x03);
            expect(buffer[3]).toBe(0x04);
        });
    });

    describe('Schema Auto-Healing & Legacy Resilience', () => {
        it('should auto-heal missing tipe_surat and metadata columns', async () => {
            const executedSql: string[] = [];
            const mockDb: any = {
                prepare: (sql: string) => ({
                    first: async () => {
                        executedSql.push(`CHECK: ${sql}`);
                        // Simulate columns do not exist
                        if (sql.includes('tipe_surat') || sql.includes('metadata')) {
                            throw new Error('no such column');
                        }
                        return null;
                    },
                    run: async () => {
                        executedSql.push(`RUN: ${sql}`);
                        return { success: true };
                    }
                })
            };

            const { ensureSuratUndanganSchema } = await import('../src/routes/surat');
            await ensureSuratUndanganSchema(mockDb);

            expect(executedSql.some(s => s.includes("ALTER TABLE surat_undangan ADD COLUMN tipe_surat"))).toBe(true);
            expect(executedSql.some(s => s.includes("ALTER TABLE surat_undangan ADD COLUMN metadata"))).toBe(true);
            expect(executedSql.some(s => s.includes("CREATE INDEX IF NOT EXISTS idx_surat_tipe"))).toBe(true);
        });

        it('should extract and parse legacy metadata embedded in isi_surat without data loss', () => {
            const rawPayload = {
                sekolah_asal_nama: 'SDN 1 Wanayasa',
                nomor_sppd: '090/001/SDN1/IX/2026',
                tanggal_kegiatan: '2026-09-20'
            };
            const isiLhp = '1. Laporan hasil kegiatan.\n2. Rekomendasi tindak lanjut.';
            const legacyStorage = `<!--SPPD_METADATA_JSON:${JSON.stringify(rawPayload)}-->\n${isiLhp}`;

            expect(legacyStorage.includes('<!--SPPD_METADATA_JSON:')).toBe(true);
            const match = legacyStorage.match(/<!--SPPD_METADATA_JSON:([\s\S]*?)-->/);
            expect(match).not.toBeNull();
            if (match) {
                const parsed = JSON.parse(match[1]);
                expect(parsed.sekolah_asal_nama).toBe('SDN 1 Wanayasa');
                expect(parsed.nomor_sppd).toBe('090/001/SDN1/IX/2026');

                const cleanedIsi = legacyStorage.replace(/<!--SPPD_METADATA_JSON:[\s\S]*?-->\n?/, '');
                expect(cleanedIsi).toBe(isiLhp);
            }
        });
    });
});
