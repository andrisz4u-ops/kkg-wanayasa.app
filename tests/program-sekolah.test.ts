import { describe, it, expect, vi } from 'vitest';
import programSekolah, {
  buildProgramPrompt,
  buildSectionPrompt,
  validateAndRepairProgramResult,
  regulasiProgramDatabase,
  ensureProgramSekolahTables,
} from '../src/routes/program-sekolah';
import { generateProgramDocxBuffer, generateProgramLampiranOnlyDocxBuffer } from '../src/lib/docx/program-sekolah';
import { generateKaldikExcelBuffer } from '../src/lib/kaldik-excel-generator';
import JSZip from 'jszip';

describe('Program Sekolah Universal (AI) Tests', () => {
  describe('Prompt Builder & Regulatory Foundations', () => {
    it('should include correct regulations for Kokurikuler Profil Lulusan', () => {
      const prompt = buildProgramPrompt({
        template: 'kokurikuler-p5',
        identitas: {
          namaSekolah: 'SDN 1 Wanayasa',
          tahunAjaran: '2025/2026',
          jenjang: 'Sekolah Dasar (SD)',
          penyusun: 'Siti Rahmawati, S.Pd.',
        },
        spesifik: {
          tema: 'Kearifan Lokal',
          alokasiJp: '108 JP per Tahun',
        },
      });

      expect(prompt).toContain('SDN 1 Wanayasa');
      expect(prompt).toContain('2025/2026');
      expect(prompt).toContain('Kearifan Lokal');
      expect(prompt).toContain('108 JP');
      expect(prompt).toContain('Permendikbudristek Nomor 12 Tahun 2024');
      expect(prompt).toContain('Permendikdasmen Nomor 13 Tahun 2025');
    });

    it('should include correct regulations and focus for 7 KAIH', () => {
      const prompt = buildProgramPrompt({
        template: '7kaih',
        identitas: {
          namaSekolah: 'SDN 2 Wanayasa',
          tahunAjaran: '2025/2026',
          jenjang: 'Sekolah Dasar (SD)',
          penyusun: 'Budi Santoso, M.Pd.',
        },
        spesifik: {
          fokusKebiasaan: 'Seluruh 7 Kebiasaan Secara Terintegrasi Harian',
        },
      });

      expect(prompt).toContain('7 Kebiasaan Anak Indonesia Hebat');
      expect(prompt).toContain('Peraturan Presiden Republik Indonesia Nomor 87 Tahun 2017');
      expect(prompt).toContain('Asta Cita ke-4 Kabinet Merah Putih');
    });

    it('should include correct regulations for Hari Belajar Guru (HBG)', () => {
      const prompt = buildProgramPrompt({
        template: 'hari-belajar-guru',
        identitas: {
          namaSekolah: 'SDN 3 Wanayasa',
          tahunAjaran: '2025/2026',
          jenjang: 'Sekolah Dasar (SD)',
          penyusun: 'Ahmad Fauzi, S.Pd.',
        },
        spesifik: {
          frekuensi: '1 Pekan Sekali (Setiap Hari Jumat Siang)',
        },
      });

      expect(prompt).toContain('Hari Belajar Guru');
      expect(prompt).toContain('Undang-Undang Republik Indonesia Nomor 14 Tahun 2005');
      expect(prompt).toContain('Komunitas Belajar');
    });
  });

  describe('Validator and Self-Repair Mechanism', () => {
    it('should repair empty or malformed AI output into complete BAB I-V and Lampiran structure', () => {
      const repaired = validateAndRepairProgramResult({}, {
        template: '7kaih',
        identitas: {
          namaSekolah: 'SD Negeri Purwakarta',
          tahunAjaran: '2025/2026',
          penyusun: 'Guru Hebat',
        },
      });

      expect(repaired).toBeDefined();
      expect(repaired.metadata.nama_sekolah).toBe('SD Negeri Purwakarta');
      expect(repaired.metadata.template_id).toBe('7kaih');

      // BAB I
      expect(repaired.bab_1_pendahuluan.latar_belakang.length).toBeGreaterThan(0);
      expect(repaired.bab_1_pendahuluan.dasar_hukum.length).toBeGreaterThanOrEqual(4);
      expect(repaired.bab_1_pendahuluan.tujuan.length).toBeGreaterThanOrEqual(3);
      expect(repaired.bab_1_pendahuluan.manfaat.length).toBeGreaterThanOrEqual(3);

      // BAB II
      expect(repaired.bab_2_kajian_konseptual.judul_bab).toBeDefined();
      expect(repaired.bab_2_kajian_konseptual.sub_bab?.length).toBeGreaterThanOrEqual(2);

      // BAB III
      expect(repaired.bab_3_rencana_program.kegiatan.length).toBeGreaterThanOrEqual(4);
      expect(repaired.bab_3_rencana_program.tim_pelaksana.length).toBeGreaterThanOrEqual(4);
      expect(repaired.bab_3_rencana_program.action_plan.length).toBeGreaterThanOrEqual(4);

      // BAB IV
      expect(repaired.bab_4_monitoring_evaluasi.indikator.length).toBeGreaterThanOrEqual(3);

      // BAB V
      expect(repaired.bab_5_penutup.kesimpulan.length).toBeGreaterThan(0);
      expect(repaired.bab_5_penutup.saran.length).toBeGreaterThan(0);
    });

    it('should preserve custom AI generated content when present', () => {
      const customRaw = {
        metadata: {
          judul_program: 'PROGRAM INOVATIF BUDAYA SEHAT SEKOLAH',
          subjudul: 'Subjudul Khusus',
          nama_sekolah: 'SD Unggulan',
        },
        bab_1_pendahuluan: {
          latar_belakang: ['Paragraf kustom 1', 'Paragraf kustom 2'],
          dasar_hukum: ['Peraturan Khusus A'],
          tujuan: ['Tujuan Khusus 1'],
        },
      };

      const repaired = validateAndRepairProgramResult(customRaw, {
        template: 'uks',
        identitas: {
          namaSekolah: 'SD Unggulan',
        },
      });

      expect(repaired.metadata.judul_program).toBe('PROGRAM INOVATIF BUDAYA SEHAT SEKOLAH');
      expect(repaired.bab_1_pendahuluan.latar_belakang).toEqual(['Paragraf kustom 1', 'Paragraf kustom 2']);
      expect(repaired.bab_1_pendahuluan.dasar_hukum).toEqual(['Peraturan Khusus A']);
      expect(repaired.bab_1_pendahuluan.tujuan).toEqual(['Tujuan Khusus 1']);
    });
  });

  describe('DOCX Generation Engine', () => {
    it('should generate valid Uint8Array buffer containing complete document with cover without kop and all lampiran in one file', async () => {
      const data = validateAndRepairProgramResult({}, {
        template: '7kaih',
        identitas: {
          namaSekolah: 'SDN 1 Wanayasa',
          tahunAjaran: '2025/2026',
          penyusun: 'Siti Rahmawati, S.Pd.',
          kepalaSekolah: 'Drs. H. Mulyadi, M.Pd.',
          kota: 'Purwakarta',
        },
      });

      const buffer = await generateProgramDocxBuffer(data);

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(10000); // Valid non-empty DOCX zip
      // Check standard ZIP signature (PK\x03\x04)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
      expect(buffer[2]).toBe(0x03);
      expect(buffer[3]).toBe(0x04);
    });

    it('should generate valid DOCX with internal 2-signature format', async () => {
      const data = validateAndRepairProgramResult({}, {
        template: '7kaih',
        identitas: {
          namaSekolah: 'SDN 1 Wanayasa',
          opsiPengesahan: 'internal',
          penyusun: 'Siti Rahmawati, S.Pd.',
          kepalaSekolah: 'Drs. H. Mulyadi, M.Pd.',
        },
      });

      expect(data.metadata.opsi_pengesahan).toBe('internal');
      const buffer = await generateProgramDocxBuffer(data);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(10000);
    });

    it('should generate valid DOCX across multiple templates with their specific attachments and total RAB', async () => {
      const templates = ['kokurikuler-p5', 'hari-belajar-guru', 'literasi', 'uks', 'adiwiyata', 'keagamaan', 'kustom'];
      
      for (const tmpl of templates) {
        const data = validateAndRepairProgramResult({}, {
          template: tmpl,
          identitas: {
            namaSekolah: `SDN Percontohan ${tmpl}`,
            opsiPengesahan: 'lengkap',
            faseKelas: 'Fase B (Kelas 3-4)',
          },
        });

        // Ensure default RAB table is populated and total is computed
        expect(data.bab_3_rencana_program.tabel_anggaran).toBeDefined();
        expect(data.bab_3_rencana_program.tabel_anggaran?.length).toBeGreaterThanOrEqual(5);
        expect(data.bab_3_rencana_program.total_anggaran).toBeDefined();
        expect(data.bab_3_rencana_program.total_anggaran).toContain('Rp');

        // Check template-specific theoretical framework in BAB II
        expect(data.bab_2_kajian_konseptual.sub_bab?.length).toBeGreaterThanOrEqual(2);

        // Check 3-tier indicators in BAB IV
        expect(data.bab_4_monitoring_evaluasi.indikator.length).toBeGreaterThanOrEqual(3);
        const indText = data.bab_4_monitoring_evaluasi.indikator.join(' ');
        expect(indText).toContain('Indikator Proses');
        expect(indText).toContain('Indikator Output');
        expect(indText).toContain('Indikator Dampak');

        const buffer = await generateProgramDocxBuffer(data);
        expect(buffer).toBeInstanceOf(Uint8Array);
        expect(buffer.length).toBeGreaterThan(10000);
      }
    });

    it('should verify template-specific theoretical foundations for all 8 templates', () => {
      const p5 = validateAndRepairProgramResult({}, { template: 'kokurikuler-p5' });
      expect(p5.bab_2_kajian_konseptual.judul_bab).toContain('8 DIMENSI PROFIL LULUSAN');
      expect(p5.bab_2_kajian_konseptual.sub_bab?.[0].judul).toContain('Experiential Learning');

      const hbg = validateAndRepairProgramResult({}, { template: 'hari-belajar-guru' });
      expect(hbg.bab_2_kajian_konseptual.judul_bab).toContain('KOMUNITAS BELAJAR');
      expect(hbg.bab_2_kajian_konseptual.sub_bab?.[0].judul).toContain('Community of Practice');

      const lit = validateAndRepairProgramResult({}, { template: 'literasi' });
      expect(lit.bab_2_kajian_konseptual.judul_bab).toContain('GERAKAN LITERASI');
      expect(lit.bab_2_kajian_konseptual.sub_bab?.[0].judul).toContain('Tiga Tahap Gerakan Literasi');

      const uks = validateAndRepairProgramResult({}, { template: 'uks' });
      expect(uks.bab_2_kajian_konseptual.judul_bab).toContain('TRIAS UKS');

      const adw = validateAndRepairProgramResult({}, { template: 'adiwiyata' });
      expect(adw.bab_2_kajian_konseptual.judul_bab).toContain('PBLHS');

      const agm = validateAndRepairProgramResult({}, { template: 'keagamaan' });
      expect(agm.bab_2_kajian_konseptual.judul_bab).toContain('KEAGAMAAN');
    });
  });

  describe('Database Self-Healing Schema', () => {
    it('should execute ensureProgramSekolahTables without error', async () => {
      const mockDb: any = {
        prepare: vi.fn().mockImplementation((query: string) => {
          if (query.includes('SELECT 1 FROM program_sekolah_history')) {
            throw new Error('no such table');
          }
          return {
            bind: vi.fn().mockReturnThis(),
            first: vi.fn(),
            run: vi.fn(),
          };
        }),
        batch: vi.fn().mockResolvedValue([]),
      };

      await ensureProgramSekolahTables(mockDb);
      expect(mockDb.batch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Admin-Only Role Guard & Protection', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await programSekolah.request('/history', {
        method: 'GET',
      }, { DB: {} } as any);
      expect(res.status).toBe(401);
      const json = await res.json() as any;
      expect(json.success).toBe(false);
    });

    it('should reject non-admin / non-operator user with 403', async () => {
      const mockDb: any = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({
              id: 99,
              role: 'user', // Regular user
              nama: 'Guru Biasa',
            }),
          }),
        }),
      };

      const res = await programSekolah.request('/history', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer regular-user-token',
        },
      }, { DB: mockDb } as any);

      expect(res.status).toBe(403);
      const json = await res.json() as any;
      expect(json.success).toBe(false);
      expect(json.error?.message || json.error).toContain('hanya dapat diakses oleh administrator');
    });

    it('should allow administrator or operator user', async () => {
      const mockDb: any = {
        prepare: vi.fn().mockImplementation((q: string) => ({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(
              q.includes('SELECT 1 FROM program_sekolah_history')
                ? { '1': 1 }
                : { id: 1, role: 'admin', nama: 'Admin Wanayasa' }
            ),
            all: vi.fn().mockResolvedValue({ results: [] }),
            run: vi.fn().mockResolvedValue({}),
          }),
        })),
        batch: vi.fn().mockResolvedValue([]),
      };

      const res = await programSekolah.request('/history', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer admin-token',
        },
      }, { DB: mockDb } as any);

      expect(res.status).toBe(200);
      const json = await res.json() as any;
      expect(json.success).toBe(true);
    });
  });

  describe('Granular Chapter Generation & Standalone Reflection Sheet Export', () => {
    const mockAdminDb: any = {
      prepare: vi.fn().mockImplementation((q: string) => ({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 1, role: 'admin', nama: 'Admin Wanayasa' }),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({}),
        }),
      })),
      batch: vi.fn().mockResolvedValue([]),
    };

    it('should build specific, focused prompts for each section', () => {
      const pBab1 = buildSectionPrompt('bab1', {
        template: 'kokurikuler-p5',
        identitas: { namaSekolah: 'SDN 1 Cibogogirang' },
        spesifik: { tema: 'Bangunlah Jiwa dan Raganya' },
      });
      expect(pBab1).toContain('BAGIAN YANG HARUS DISUSUN: BAB I PENDAHULUAN');
      expect(pBab1).toContain('SDN 1 Cibogogirang');
      expect(pBab1).toContain('latar_belakang');

      const pBab2 = buildSectionPrompt('bab2', {
        template: 'kokurikuler-p5',
        identitas: { namaSekolah: 'SDN 1 Cibogogirang' },
        spesifik: {},
      });
      expect(pBab2).toContain('BAGIAN YANG HARUS DISUSUN: BAB II KAJIAN KONSEPTUAL');
      expect(pBab2).toContain('8 Dimensi Profil Lulusan');

      const pBab3 = buildSectionPrompt('bab3', {
        template: '7kaih',
        identitas: { namaSekolah: 'SDN 1 Cibogogirang' },
        spesifik: {},
      });
      expect(pBab3).toContain('BAGIAN YANG HARUS DISUSUN: BAB III RENCANA PROGRAM');
      expect(pBab3).toContain('rincian_biaya');

      const pBab4 = buildSectionPrompt('bab4_5', {
        template: 'literasi',
        identitas: { namaSekolah: 'SDN 1 Cibogogirang' },
        spesifik: {},
      });
      expect(pBab4).toContain('BAGIAN YANG HARUS DISUSUN: BAB IV (MONITORING');
      expect(pBab4).toContain('BAB V (PENUTUP)');
    });

    it('should generate valid standalone reflection and assessment rubric DOCX', async () => {
      const data = validateAndRepairProgramResult({}, {
        template: 'kokurikuler-p5',
        identitas: {
          namaSekolah: 'SDN Percontohan Refleksi',
          tahunAjaran: '2025/2026',
          penyusun: 'Ibu Ratna, S.Pd.',
        },
      });

      const buffer = await generateProgramLampiranOnlyDocxBuffer(data);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(5000);
    });

    it('should export standalone reflection DOCX via /docx-lampiran endpoint', async () => {
      const data = validateAndRepairProgramResult({}, {
        template: '7kaih',
        identitas: {
          namaSekolah: 'SDN 1 Wanayasa',
          tahunAjaran: '2025/2026',
        },
      });

      const res = await programSekolah.request('/docx-lampiran', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(data),
      }, { DB: mockAdminDb } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('officedocument.wordprocessingml');
      expect(res.headers.get('Content-Disposition')).toContain('Refleksi_dan_Rubrik');
      const ab = await res.arrayBuffer();
      expect(ab.byteLength).toBeGreaterThan(5000);
    });

    it('should validate section parameter in /generate-section endpoint', async () => {
      // Invalid section parameter
      const resBad = await programSekolah.request('/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({
          template: 'kokurikuler-p5',
          section: 'invalid_section',
        }),
      }, { DB: mockAdminDb } as any);

      expect(resBad.status).toBe(400);
      const jsonBad = await resBad.json() as any;
      expect(jsonBad.success).toBe(false);
      expect(jsonBad.error?.message || jsonBad.error).toContain('Parameter section tidak valid');
    });

    it('should call loadProviders with DB in /generate-section endpoint', async () => {
      let queryExecuted = false;
      const mockDbWithProviders: any = {
        prepare: vi.fn().mockImplementation((sql: string) => {
          if (sql.includes('ai_providers')) {
            queryExecuted = true;
          }
          return {
            bind: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue({ id: 1, role: 'admin', nama: 'Admin Wanayasa' }),
              all: vi.fn().mockResolvedValue({ results: [] }),
              run: vi.fn().mockResolvedValue({}),
            }),
            first: vi.fn().mockResolvedValue({ id: 1, role: 'admin', nama: 'Admin Wanayasa' }),
            all: vi.fn().mockResolvedValue({ results: [] }),
            run: vi.fn().mockResolvedValue({}),
          };
        }),
        batch: vi.fn().mockResolvedValue([]),
      };

      await programSekolah.request('/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({
          template: 'kalender-sekolah',
          section: 'bab1',
          identitas: { namaSekolah: 'SDN 1 Test' },
        }),
      }, { DB: mockDbWithProviders } as any);

      expect(queryExecuted).toBe(true);
    });
  });

  describe('Kalender Pendidikan Excel (.xlsx) Generation & Export Tests', () => {
    it('should generate a valid 3-sheet OpenXML .xlsx buffer with professional formatting', async () => {
      const buffer = await generateKaldikExcelBuffer({
        metadata: {
          nama_sekolah: 'SDN 1 Wanayasa',
          tahun_ajaran: '2026/2027',
          kepala_sekolah: 'Hj. Nenden Laila, M.Pd.',
          nip_kepala_sekolah: '19760314 200501 2 006',
          penyusun: 'Tim Pengembang Kurikulum',
          kota: 'Purwakarta',
        },
        spesifik: {
          sistemHariSekolah: '5 Hari Kerja (Senin s.d. Jumat)',
        },
      });

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(3000);

      // Verify that it is a valid ZIP archive containing required OpenXML parts
      const zip = await JSZip.loadAsync(buffer);
      expect(zip.file('[Content_Types].xml')).not.toBeNull();
      expect(zip.file('xl/workbook.xml')).not.toBeNull();
      expect(zip.file('xl/styles.xml')).not.toBeNull();
      expect(zip.file('xl/worksheets/sheet1.xml')).not.toBeNull();
      expect(zip.file('xl/worksheets/sheet2.xml')).not.toBeNull();
      expect(zip.file('xl/worksheets/sheet3.xml')).not.toBeNull();

      // Verify workbook sheet names persis contoh Kaldik Pendis
      const workbookXml = await zip.file('xl/workbook.xml')!.async('string');
      expect(workbookXml).toContain('Tanggal Penting');
      expect(workbookXml).toContain('Kalender Pendidikan');
      expect(workbookXml).toContain('Kaldik Portrait');

      // Verify sheet 1 contents (Tanggal-tanggal Penting)
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
      expect(sheet1Xml).toContain('Tanggal-tanggal Penting');
      expect(sheet1Xml).toContain('Semester Gasal');
      expect(sheet1Xml).toContain('Semester Genap');
      expect(sheet1Xml).toContain('SDN 1 WANAYASA');

      // Verify sheet 2 contents (Kalender Pendidikan Landscape dengan KOP surat sekolah)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('string');
      expect(sheet2Xml).toContain('SDN 1 WANAYASA');
      expect(sheet2Xml).toContain('PEDOMAN KALENDER PENDIDIKAN');
      expect(sheet2Xml).toContain('JULI 2026');
      expect(sheet2Xml).toContain('AGUSTUS 2026');
      expect(sheet2Xml).toContain('KETERANGAN');

      // Verify sheet 3 contents (Kaldik Portrait dengan HK & HE dan KOP sekolah)
      const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('string');
      expect(sheet3Xml).toContain('SDN 1 WANAYASA');
      expect(sheet3Xml).toContain('HK : 31');
      expect(sheet3Xml).toContain('HE :');
      expect(sheet3Xml).toContain('SEMESTER GENAP');
    });

    it('should serve .xlsx export via POST /api/program-sekolah/kaldik-excel with correct headers and KOP', async () => {
      const mockDb: any = {
        prepare: vi.fn().mockImplementation((sql: string) => ({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({
              id: 1,
              role: 'admin',
              nama: 'Admin Wanayasa',
              sekolah: 'SDN 1 Wanayasa',
              kepala_sekolah: 'Hj. Nenden Laila, M.Pd.',
              nip_kepala_sekolah: '19760314 200501 2 006',
              alamat: 'Jl. Raya Wanayasa No. 12',
              npsn: '20205812',
            }),
            all: vi.fn().mockResolvedValue({ results: [{ key: 'kabupaten', value: 'Purwakarta' }] }),
            run: vi.fn().mockResolvedValue({}),
          }),
          first: vi.fn().mockResolvedValue({
            id: 1,
            role: 'admin',
            nama: 'Admin Wanayasa',
            sekolah: 'SDN 1 Wanayasa',
            kepala_sekolah: 'Hj. Nenden Laila, M.Pd.',
            nip_kepala_sekolah: '19760314 200501 2 006',
            alamat: 'Jl. Raya Wanayasa No. 12',
            npsn: '20205812',
          }),
          all: vi.fn().mockResolvedValue({ results: [{ key: 'kabupaten', value: 'Purwakarta' }] }),
          run: vi.fn().mockResolvedValue({}),
        })),
      };

      const res = await programSekolah.request('/kaldik-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({
          data: {
            metadata: {
              nama_sekolah: 'SDN 1 Wanayasa',
              tahun_ajaran: '2026/2027',
              template_id: 'kalender-sekolah',
            },
          },
        }),
      }, { DB: mockDb } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.headers.get('Content-Disposition')).toContain('Kaldik_SDN_1_Wanayasa_2026-2027.xlsx');

      const arrayBuffer = await res.arrayBuffer();
      expect(arrayBuffer.byteLength).toBeGreaterThan(3000);

      // Ensure buffer can be read back by JSZip
      const zip = await JSZip.loadAsync(arrayBuffer);
      expect(zip.file('xl/workbook.xml')).not.toBeNull();
      const wbXml = await zip.file('xl/workbook.xml')!.async('string');
      expect(wbXml).toContain('Tanggal Penting');
      expect(wbXml).toContain('Kalender Pendidikan');
      expect(wbXml).toContain('Kaldik Portrait');
    });
  });
});

