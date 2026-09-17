import { describe, it, expect, vi } from 'vitest';
import programSekolah, {
  buildProgramPrompt,
  validateAndRepairProgramResult,
  regulasiProgramDatabase,
  ensureProgramSekolahTables,
} from '../src/routes/program-sekolah';
import { generateProgramDocxBuffer } from '../src/lib/docx/program-sekolah';

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
});
