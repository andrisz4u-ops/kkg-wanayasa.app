import { describe, it, expect } from 'vitest';
import { 
  distributeChaptersToSemesters, 
  buildStructurePrompt, 
  buildAnalisisCpPrompt, 
  getStandardCurriculumChapters,
  getAllBookProfiles,
  validateAndRepairAnalysisResult,
  ensureAnalisisCpTables,
  replacePesertaDidik,
  repairAndEnrichIpasBabCp,
  default as analisisCpRoutes
} from '../src/routes/analisis-cp';
import { generateAnalisisCpDocxBuffer, type AnalisisCpDocxInput } from '../src/lib/docx/analisis-cp';
import { getOfficialCP, cpElementsData } from '../src/lib/cp-data';

describe('Analisis CP - Standard Official Curriculum Presets', () => {
  it('retrieves complete 8 chapters for Bahasa Indonesia Kelas 5 (Bergerak Bersama)', () => {
    const data = getStandardCurriculumChapters('Bahasa Indonesia', 'Kelas 5');
    expect(data).toBeDefined();
    expect(data?.chapters).toHaveLength(8);
    expect(data?.chapters[0].bab).toBe('Bab 1: Aku yang Unik');
    expect(data?.chapters[0].materi_pokok).toContain('Kata sifat');
    expect(data?.chapters[7].bab).toBe('Bab 8: Bergerak Bersama');

    const distributed = distributeChaptersToSemesters(data!.chapters);
    const sem1 = distributed.filter(c => c.semester === 1);
    const sem2 = distributed.filter(c => c.semester === 2);
    expect(sem1).toHaveLength(4);
    expect(sem2).toHaveLength(4);
  });

  it('retrieves complete 8 chapters for IPAS Kelas 5', () => {
    const data = getStandardCurriculumChapters('Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Kelas 5');
    expect(data).toBeDefined();
    expect(data?.chapters).toHaveLength(8);
    expect(data?.chapters[0].bab).toContain('Cahaya');
  });

  it('retrieves accurate official chapters for Bahasa Indonesia Kelas 3 (Kawan Seiring) without fallback to Kelas 5', () => {
    const data = getStandardCurriculumChapters('Bahasa Indonesia', 'Kelas 3');
    expect(data).toBeDefined();
    expect(data?.judul).toContain('Kawan Seiring');
    expect(data?.chapters).toHaveLength(8);
    expect(data?.chapters[0].bab).toBe('Bab 1: Ayo, Main!');
    expect(data?.chapters[0].bab).not.toContain('Aku yang Unik'); // Ensure not returning Kelas 5!
    expect(data?.chapters[7].bab).toBe('Bab 8: Sahabat dari Seberang');
  });

  it('retrieves distinct official books for Bahasa Indonesia across Kelas 1 to 6', () => {
    const k1 = getStandardCurriculumChapters('Bahasa Indonesia', 'Kelas 1');
    const k2 = getStandardCurriculumChapters('Bahasa Indonesia', 'Kelas 2');
    const k4 = getStandardCurriculumChapters('Bahasa Indonesia', 'Kelas 4');
    const k6 = getStandardCurriculumChapters('Bahasa Indonesia', 'Kelas 6');

    expect(k1?.judul).toContain('Aku Bisa!');
    expect(k2?.judul).toContain('Keluargaku Unik');
    expect(k4?.judul).toContain('Lihat Sekitar');
    expect(k6?.judul).toContain('Anak Indonesia Hebat');

    expect(k1?.chapters[0].bab).toContain('Bunyi Apa?');
    expect(k4?.chapters[0].bab).toContain('Sudah Besar');
  });

  it('retrieves official chapters for IPAS Kelas 3 (Kemendikbudristek)', () => {
    const data = getStandardCurriculumChapters('IPAS', 'Kelas 3');
    expect(data).toBeDefined();
    expect(data?.judul).toContain('IPAS');
    expect(data?.judul).toContain('Kelas III');
    expect(data?.chapters).toHaveLength(8);
    expect(data?.chapters[0].bab).toBe('Bab 1: Mari Kenali Hewan di Sekitar Kita');
  });

  it('does NOT fallback to Kelas 5 when an unsupported grade is requested', () => {
    const data = getStandardCurriculumChapters('Bahasa Indonesia', 'Kelas 99');
    expect(data).toBeNull();
  });

  it('retrieves complete chapters for local & new subjects (B.Sunda, Tatanen di Bale Atikan, AKPK, Koding)', () => {
    const sunda = getStandardCurriculumChapters('B.Sunda', 'Kelas 5');
    expect(sunda).toBeDefined();
    expect(sunda?.chapters).toHaveLength(8);
    expect(sunda?.chapters[0].bab).toContain('Kaulinan Barudak');

    const tdba = getStandardCurriculumChapters('Tatanen di Bale Atikan', 'Kelas 5');
    expect(tdba).toBeDefined();
    expect(tdba?.chapters).toHaveLength(8);
    expect(tdba?.chapters[0].bab).toContain('Panca Niti');

    const akpk = getStandardCurriculumChapters('AKPK', 'Kelas 5');
    expect(akpk).toBeDefined();
    expect(akpk?.chapters).toHaveLength(8);
    expect(akpk?.chapters[0].bab).toContain('Ajeg Nusantara');

    const koding = getStandardCurriculumChapters('Koding dan Kecerdasan Artifisial', 'Kelas 5');
    expect(koding).toBeDefined();
    expect(koding?.chapters).toHaveLength(8);
    expect(koding?.chapters[0].bab).toContain('Berpikir Komputasional');
  });

  it('verifies CP retrieval for all 12 subjects in Kurikulum Merdeka / BSKAP 046', () => {
    const subjects = [
      'Pendidikan Agama dan Budi Pekerti',
      'Pendidikan Pancasila',
      'Bahasa Indonesia',
      'Matematika',
      'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
      'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
      'Bahasa Inggris',
      'Seni Rupa',
      'Koding dan Kecerdasan Artifisial',
      'B.Sunda',
      'Tatanen di Bale Atikan',
      'AKPK'
    ];

    subjects.forEach(subject => {
      const cp = getOfficialCP(subject, 'Kelas 5');
      expect(cp, `CP for ${subject} must exist`).toBeTruthy();
      expect(typeof cp).toBe('string');
    });
  });
});

describe('Analisis CP - Semester Distribution Rules', () => {
  it('divides 10 BABs evenly (5 for Semester 1, 5 for Semester 2)', () => {
    const chapters = Array.from({ length: 10 }, (_, i) => ({
      no: i + 1,
      bab: `Bab ${i + 1}`,
      materi_pokok: [`Materi ${i + 1}.1`]
    }));

    const distributed = distributeChaptersToSemesters(chapters);
    expect(distributed).toHaveLength(10);

    const sem1 = distributed.filter(ch => ch.semester === 1);
    const sem2 = distributed.filter(ch => ch.semester === 2);

    expect(sem1).toHaveLength(5);
    expect(sem2).toHaveLength(5);
    expect(sem1.map(ch => ch.no)).toEqual([1, 2, 3, 4, 5]);
    expect(sem2.map(ch => ch.no)).toEqual([6, 7, 8, 9, 10]);
  });

  it('divides odd 9 BABs with larger portion in Semester 1 (Bab 1-5 in Smt 1, Bab 6-9 in Smt 2)', () => {
    const chapters = Array.from({ length: 9 }, (_, i) => ({
      no: i + 1,
      bab: `Bab ${i + 1}`,
      materi_pokok: [`Materi ${i + 1}.1`]
    }));

    const distributed = distributeChaptersToSemesters(chapters);
    expect(distributed).toHaveLength(9);

    const sem1 = distributed.filter(ch => ch.semester === 1);
    const sem2 = distributed.filter(ch => ch.semester === 2);

    expect(sem1).toHaveLength(5); // Math.ceil(9/2) = 5
    expect(sem2).toHaveLength(4); // 9 - 5 = 4
    expect(sem1.map(ch => ch.no)).toEqual([1, 2, 3, 4, 5]);
    expect(sem2.map(ch => ch.no)).toEqual([6, 7, 8, 9]);
  });

  it('divides 7 BABs with 4 in Semester 1 and 3 in Semester 2', () => {
    const chapters = Array.from({ length: 7 }, (_, i) => ({
      no: i + 1,
      bab: `Bab ${i + 1}`,
      materi_pokok: [`Materi ${i + 1}.1`]
    }));

    const distributed = distributeChaptersToSemesters(chapters);
    const sem1 = distributed.filter(ch => ch.semester === 1);
    const sem2 = distributed.filter(ch => ch.semester === 2);

    expect(sem1).toHaveLength(4);
    expect(sem2).toHaveLength(3);
  });

  it('keeps ALL 4 chapters in Semester 1 when target is Semester 1 (does NOT split in two)', () => {
    const chapters = Array.from({ length: 4 }, (_, i) => ({
      no: i + 1,
      bab: `Bab ${i + 1}`,
      materi_pokok: [`Materi ${i + 1}.1`]
    }));

    const distributed = distributeChaptersToSemesters(chapters, '1', '1');
    expect(distributed).toHaveLength(4);

    const sem1 = distributed.filter(ch => ch.semester === 1);
    const sem2 = distributed.filter(ch => ch.semester === 2);

    expect(sem1).toHaveLength(4);
    expect(sem2).toHaveLength(0);
    expect(distributed.every(ch => ch.semester === 1)).toBe(true);
  });

  it('keeps ALL 5 chapters in Semester 2 when target is Semester 2 (does NOT split in two)', () => {
    const chapters = Array.from({ length: 5 }, (_, i) => ({
      no: i + 1,
      bab: `Bab ${i + 1}`,
      materi_pokok: [`Materi ${i + 1}.1`]
    }));

    const distributed = distributeChaptersToSemesters(chapters, '2', '2');
    expect(distributed).toHaveLength(5);

    const sem1 = distributed.filter(ch => ch.semester === 1);
    const sem2 = distributed.filter(ch => ch.semester === 2);

    expect(sem1).toHaveLength(0);
    expect(sem2).toHaveLength(5);
    expect(distributed.every(ch => ch.semester === 2)).toBe(true);
  });
});

describe('Analisis CP - Official CP Integration & Prompt Building', () => {
  it('retrieves official CP from BSKAP No. 046 Tahun 2025 for IPAS Kelas 5 (Fase C)', () => {
    const cp = getOfficialCP('IPAS', 'Kelas 5');
    expect(cp).toBeTruthy();
    expect(typeof cp).toBe('string');
    expect(cp).toContain('Pemahaman IPAS');
    expect(cp).toContain('sistem organ tubuh');
  });

  it('builds structure extraction prompt including instructions for semester division', () => {
    const rawText = 'Bab 1 Sifat Cahaya\nBab 2 Ekosistem\nBab 3 Magnet';
    const prompt = buildStructurePrompt(rawText, 'IPAS', 'Kelas 5');
    expect(prompt).toContain('Asisten Pakar Kurikulum');
    expect(prompt).toContain('IPAS');
    expect(prompt).toContain('Semester 1');
    expect(prompt).toContain('Semester 2');
  });

  it('builds Analisis CP generation prompt with correct BSKAP guidelines and sequential Kode TP', () => {
    const baseCP = getOfficialCP('IPAS', 'Kelas 5');
    const elementsCP = cpElementsData['IPAS']?.['Fase C'];

    const prompt = buildAnalisisCpPrompt({
      namaSekolah: 'SDN 01 Meluai',
      mataPelajaran: 'IPAS',
      jenjangKelas: 'Kelas 5',
      fase: 'C',
      tahunAjaran: '2025/2026',
      chapters: [
        { no: 1, bab: 'Melihat Karena Cahaya', materi_pokok: ['Sifat Cahaya', 'Mata'], semester: 1 }
      ],
      targetSemester: 'all',
      baseCP,
      elementsCP
    });

    expect(prompt).toContain('SDN 01 Meluai');
    expect(prompt).toContain('ANALISIS CP, TP, DAN ATP');
    expect(prompt).toContain('5.1');
    expect(prompt).toContain('BSKAP No. 046 Tahun 2025');
  });

  it('builds structure extraction prompt explicitly forbidding splitting when Semester 1 is targeted', () => {
    const rawText = 'Bab 1 Sifat Cahaya\nBab 2 Ekosistem\nBab 3 Harmoni';
    const prompt = buildStructurePrompt(rawText, 'IPAS', 'Kelas 5', '1');
    expect(prompt).toContain('Target Semester: Khusus Semester 1');
    expect(prompt).toContain('BUKU KHUSUS SEMESTER 1');
    expect(prompt).toContain('Wajib tetapkan SEMUA bab ke "semester": 1');
    expect(prompt).toContain('DILARANG KERAS membagi bab ke Semester 2!');
  });

  it('validates and repairs analysis result by merging all chapters into target semester when single semester is selected', () => {
    const rawAiResult = {
      metadata: {
        satuan_pendidikan: 'SDN 1 Wanayasa',
        mata_pelajaran: 'IPAS',
        kelas: '5'
      },
      semesters: [
        {
          semester: 1,
          semester_label: 'SEMESTER 1',
          babs: [
            { no: 1, bab: 'Bab 1 Sifat Cahaya', items: [{ kode_tp: '5.1', materi_pokok: 'Cahaya', tp: 'TP 1', atp: 'ATP 1', alokasi_waktu: '4 JP' }] }
          ]
        },
        {
          semester: 2,
          semester_label: 'SEMESTER 2',
          babs: [
            { no: 2, bab: 'Bab 2 Magnet', items: [{ kode_tp: '5.2', materi_pokok: 'Magnet', tp: 'TP 2', atp: 'ATP 2', alokasi_waktu: '4 JP' }] }
          ]
        }
      ]
    };

    const repaired = validateAndRepairAnalysisResult(rawAiResult, [], {
      namaSekolah: 'SDN 1 Wanayasa',
      mataPelajaran: 'IPAS',
      jenjangKelas: 'Kelas 5',
      targetSemester: '1'
    });

    // Semesters array must contain ONLY Semester 1
    expect(repaired.semesters).toHaveLength(1);
    expect(repaired.semesters[0].semester).toBe(1);
    // Both Bab 1 and Bab 2 must be merged into Semester 1
    expect(repaired.semesters[0].babs).toHaveLength(2);
    expect(repaired.semesters[0].babs[0].bab).toContain('Sifat Cahaya');
    expect(repaired.semesters[0].babs[1].bab).toContain('Magnet');
  });
});

describe('Analisis CP - DOCX Document Generation', () => {
  it('generates a valid DOCX buffer for Analisis CP with multiple semesters and KOP', async () => {
    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        satuan_pendidikan: 'SDN 01 MELUAI',
        mata_pelajaran: 'IPAS',
        fase: 'C',
        kelas: '5',
        fase_kelas: 'C/5',
        tahun_pembelajaran: '2025/2026',
        kepala_sekolah: 'Hj. Siti Nurhaliza, M.Pd',
        nip_kepala_sekolah: '197501012000032001',
        guru: 'Ahmad Dahlan, S.Pd',
        nip_guru: '198801012015021002',
        sumber_buku: 'Buku Siswa IPAS Kelas 5'
      },
      semesters: [
        {
          semester: 1,
          semester_label: 'SEMESTER 1',
          babs: [
            {
              no: 1,
              bab: 'Melihat Karena Cahaya, Mendengar Karena Bunyi',
              cp: 'Pemahaman IPAS: Menjelaskan fenomena gelombang bunyi dan cahaya dalam kehidupan sehari-hari.',
              materi_list: ['1. Sifat Cahaya', '2. Indra Penglihatan (Mata)'],
              items: [
                {
                  kode_tp: '5.1',
                  materi_pokok: '1. Sifat Cahaya',
                  tp: 'Mendesain percobaan sederhana untuk membuktikan sifat cahaya dan menjelaskan hasilnya.',
                  atp: 'Murid melakukan percobaan menggunakan cermin, gelas air, dan karton lubang.'
                },
                {
                  kode_tp: '5.2',
                  materi_pokok: '2. Indra Penglihatan (Mata)',
                  tp: 'Mengetahui bagian-bagian mata dan menjelaskan cara kerjanya.',
                  atp: 'Murid mengamati model/gambar mata dan mengurutkan proses masuknya cahaya.'
                }
              ]
            }
          ]
        },
        {
          semester: 2,
          semester_label: 'SEMESTER 2',
          babs: [
            {
              no: 5,
              bab: 'Bagaimana Kita Hidup dan Bertumbuh',
              cp: 'Pemahaman IPAS: Merefleksikan sistem organ tubuh manusia yang dikaitkan dengan cara menjaga kesehatan tubuhnya.',
              materi_list: ['1. Sistem Pernapasan'],
              items: [
                {
                  kode_tp: '5.14',
                  materi_pokok: '1. Sistem Pernapasan',
                  tp: 'Mendeskripsikan mekanisme pernapasan pada manusia.',
                  atp: 'Murid membuat alat peraga paru-paru dari botol bekas dan balon.'
                }
              ]
            }
          ]
        }
      ]
    };

    const buffer = await generateAnalisisCpDocxBuffer(docxInput);
    expect(buffer).toBeDefined();
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe('Analisis CP - CP Kolaboratif & Self-Healing Tables', () => {
  it('ensures tables exist without error (self-healing D1)', async () => {
    const mockDb: any = {
      prepare: () => ({
        first: async () => { throw new Error('no such table: analisis_cp_history'); },
        run: async () => ({ success: true }),
        all: async () => ({ results: [] })
      }),
      batch: async () => []
    };

    await expect(ensureAnalisisCpTables(mockDb)).resolves.not.toThrow();
  });

  it('saves analysis to CP Kolaboratif and returns assigned ID', async () => {
    const user = { id: 1, nama: 'Guru Kolaboratif', sekolah: 'SDN 2 Nangerang' };
    const mockDb: any = {
      prepare: (query: string) => {
        const runner: any = {
          first: async () => {
            if (query.toLowerCase().includes('sessions')) return user;
            if (query.includes('SELECT 1 FROM analisis_cp_history')) return { 1: 1 };
            return { id: 1 };
          },
          run: async () => ({ results: [{ id: 42 }], success: true }),
          all: async () => ({ results: [] })
        };
        runner.bind = () => runner;
        return runner;
      },
      batch: async () => []
    };

    const res = await analisisCpRoutes.request('/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-session-token'
      },
      body: JSON.stringify({
        namaSekolah: 'SDN 2 Nangerang',
        mataPelajaran: 'Bahasa Indonesia',
        jenjangKelas: 'Kelas 3',
        fase: 'B',
        tahunAjaran: '2025/2026',
        sumberBuku: 'Buku Siswa Bahasa Indonesia Kelas 3',
        contentJson: { semesters: [{ semester: 1, babs: [{ no: 1 }] }] },
        isPublic: 1
      })
    }, { DB: mockDb });

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(42);
    expect(json.message).toContain('CP Kolaboratif');
  });

  it('retrieves CP Kolaboratif statistics for badge count', async () => {
    const user = { id: 1, nama: 'Guru Kolaboratif', sekolah: 'SDN 2 Nangerang' };
    const mockDb: any = {
      prepare: (query: string) => {
        const runner: any = {
          first: async () => {
            if (query.toLowerCase().includes('sessions')) return user;
            if (query.includes('WHERE is_public = 1')) return { total: 12 };
            if (query.includes('WHERE user_id = ?')) return { total: 3 };
            return { total: 12 };
          },
          all: async () => ({ results: [{ mata_pelajaran: 'Bahasa Indonesia', count: 5 }] }),
          run: async () => ({ success: true })
        };
        runner.bind = () => runner;
        return runner;
      },
      batch: async () => []
    };

    const res = await analisisCpRoutes.request('/kolaboratif/stats', {
      headers: {
        'Authorization': 'Bearer test-session-token'
      }
    }, { DB: mockDb });

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.total_cp).toBe(12);
    expect(json.data.my_cp).toBe(3);
    expect(json.data.per_mapel).toHaveLength(1);
  });

  it('serves /standard-chapters endpoint with accurate grade 1 chapters', async () => {
    const res = await analisisCpRoutes.request('/standard-chapters?mataPelajaran=Bahasa%20Indonesia&jenjangKelas=Kelas%201');
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.buku_judul).toContain('Aku Bisa!');
    expect(json.data.total_babs).toBe(8);
    expect(json.data.chapters[0].bab).toContain('Bunyi Apa?');
  });

  it('supports liking a collaborative CP item via POST /:id/like', async () => {
    const user = { id: 10, nama: 'Guru 1', role: 'guru' };
    const mockDb: any = {
      prepare: (query: string) => {
        const runner: any = {
          first: async () => {
            if (query.toLowerCase().includes('sessions')) return user;
            if (query.includes('SELECT like_count')) return { like_count: 5 };
            return { 1: 1 };
          },
          run: async () => ({ success: true })
        };
        runner.bind = () => runner;
        return runner;
      },
      batch: async () => []
    };

    const res = await analisisCpRoutes.request('/123/like', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-session-token'
      }
    }, { DB: mockDb });

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.like_count).toBe(5);
  });

  it('strictly converts any variant of "peserta didik" to "Murid" via replacePesertaDidik', () => {
    const dirtyData = {
      tp: 'Peserta didik mampu menghitung volume kubus.',
      atp: 'peserta didik melakukan penyelidikan konkret.',
      lkpd: 'LEMBAR KERJA PESERTA DIDIK (LKPD)',
      nested: [
        { desc: 'Seluruh PESERTA DIDIK mengikuti KBM.' }
      ]
    };

    const cleanData = replacePesertaDidik(dirtyData);
    expect(cleanData.tp).toBe('Murid mampu menghitung volume kubus.');
    expect(cleanData.atp).toBe('murid melakukan penyelidikan konkret.');
    expect(cleanData.lkpd).toBe('Lembar Kerja Murid (LKM)');
    expect(cleanData.nested[0].desc).toBe('Seluruh MURID mengikuti KBM.');
  });

  it('repairAndEnrichIpasBabCp correctly resolves dual elements [Pemahaman IPAS] and [Keterampilan Proses]', () => {
    const babGeografi = {
      no: 1,
      bab: 'Bab 1: Di Mana Indonesia Berada?',
      cp: '[ELEMEN: PEMAHAMAN IPAS] Menghasilkan upaya penghematan energi, serta pemanfaatan sumber energi alternatif dari sumber daya yang ada di sekitarnya sebagai upaya mitigasi perubahan iklim.',
      materi_list: ['1. Daratan dan Lautan di Indonesia', '2. Indonesia, Zamrud di Khatulistiwa'],
      items: [
        { kode_tp: '5.1', materi_pokok: 'Daratan dan Lautan', tp: 'Mengidentifikasi batas wilayah', atp: 'Murid mengamati peta Asia Tenggara' }
      ]
    };

    const repaired = repairAndEnrichIpasBabCp(babGeografi, 'C');
    expect(repaired).toContain('[Pemahaman IPAS]');
    expect(repaired).toContain('[Keterampilan Proses]');
    // Should NOT have the repetitive energy bug on geography bab
    expect(repaired).not.toContain('penghematan energi');
    expect(repaired).toContain('letak dan kondisi geografis');
    expect(repaired).toContain('Mengamati fenomena geografis pada peta');
  });

  it('validateAndRepairAnalysisResult ensures all IPAS chapters contain both Pemahaman IPAS and Keterampilan Proses', () => {
    const rawResult = {
      metadata: {
        mata_pelajaran: 'IPAS',
        kelas: '5'
      },
      semesters: [
        {
          semester: 1,
          babs: [
            {
              no: 1,
              bab: 'Bab 1: Di Mana Indonesia Berada?',
              cp: '[Pemahaman IPAS] Menghasilkan upaya penghematan energi...',
              items: [{ kode_tp: '5.1', materi_pokok: 'Peta', tp: 'Peta', atp: 'Peta' }]
            },
            {
              no: 2,
              bab: 'Bab 2: Majulah Daerahku!',
              cp: '[Pemahaman IPAS] Menghasilkan upaya penghematan energi...',
              items: [{ kode_tp: '5.2', materi_pokok: 'Ekonomi', tp: 'Ekonomi', atp: 'Ekonomi' }]
            }
          ]
        }
      ]
    };

    const res = validateAndRepairAnalysisResult(rawResult, [], {
      mataPelajaran: 'IPAS',
      jenjangKelas: 'Kelas 5'
    });

    const bab1 = res.semesters[0].babs[0];
    const bab2 = res.semesters[0].babs[1];

    expect(bab1.cp).toContain('[Pemahaman IPAS]');
    expect(bab1.cp).toContain('[Keterampilan Proses]');
    expect(bab1.cp).toContain('letak dan kondisi geografis');

    expect(bab2.cp).toContain('[Pemahaman IPAS]');
    expect(bab2.cp).toContain('[Keterampilan Proses]');
    expect(bab2.cp).toContain('kegiatan ekonomi');
  });

  it('buildAnalisisCpPrompt contains specific dual-element instructions when mataPelajaran is IPAS', () => {
    const prompt = buildAnalisisCpPrompt({
      namaSekolah: 'SDN 1 Wanayasa',
      mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
      jenjangKelas: 'Kelas 5',
      fase: 'C',
      tahunAjaran: '2025/2026',
      chapters: [],
      targetSemester: 'all',
      baseCP: 'CP Resmi',
      elementsCP: {}
    });

    expect(prompt).toContain('FORMAT DWI-ELEMEN UNTUK IPAS');
    expect(prompt).toContain('[Pemahaman IPAS]');
    expect(prompt).toContain('[Keterampilan Proses]');
  });

  describe('Book Structure Profiles & Publication Year System', () => {
    it('getAllBookProfiles returns official preset as default (is_default: true) when DB is empty', async () => {
      const profiles = await getAllBookProfiles(undefined, 'Bahasa Indonesia', 'Kelas 5');
      expect(profiles).toBeDefined();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThanOrEqual(1);

      const defaultProfile = profiles.find(p => p.is_default);
      expect(defaultProfile).toBeDefined();
      expect(defaultProfile?.buku_judul).toContain('Bergerak Bersama');
      expect(defaultProfile?.total_babs).toBe(8);
      expect(defaultProfile?.is_custom).toBe(false);
    });

    it('getAllBookProfiles sorts books by publication year descending and marks highest year as default', async () => {
      const mockDb: any = {
        prepare: (sql: string) => ({
          bind: (...args: any[]) => ({
            all: async () => ({
              results: [
                {
                  id: 101,
                  mata_pelajaran: 'IPAS',
                  jenjang_kelas: 'Kelas 5',
                  buku_judul: 'Buku Guru IPAS Kurikulum Merdeka (Edisi 2023)',
                  tahun_terbit: 2023,
                  penerbit: 'Pusat Kurikulum',
                  total_babs: 8,
                  chapters_json: JSON.stringify([
                    { no: 1, bab: 'Bab 1: Eksplorasi 2023', materi_pokok: ['Topik A'], semester: 1 }
                  ]),
                  created_at: '2025-01-01'
                },
                {
                  id: 102,
                  mata_pelajaran: 'IPAS',
                  jenjang_kelas: 'Kelas 5',
                  buku_judul: 'IPAS Terpadu SD Kelas V (Edisi Baru 2026)',
                  tahun_terbit: 2026,
                  penerbit: 'Penerbit Mandiri',
                  total_babs: 8,
                  chapters_json: JSON.stringify([
                    { no: 1, bab: 'Bab 1: Cahaya Masa Depan 2026', materi_pokok: ['Topik Sains Modern'], semester: 1 }
                  ]),
                  created_at: '2026-03-01'
                }
              ]
            })
          })
        })
      };

      const profiles = await getAllBookProfiles(mockDb, 'IPAS', 'Kelas 5');
      expect(profiles.length).toBeGreaterThanOrEqual(3); // 2026 (custom), 2024 (official preset), 2023 (custom)

      // Verify sorted strictly by tahun_terbit descending
      for (let i = 0; i < profiles.length - 1; i++) {
        expect(profiles[i].tahun_terbit).toBeGreaterThanOrEqual(profiles[i + 1].tahun_terbit);
      }

      // The 2026 edition MUST be marked as default
      expect(profiles[0].tahun_terbit).toBe(2026);
      expect(profiles[0].is_default).toBe(true);
      expect(profiles[0].buku_judul).toContain('2026');

      // Subsequent profiles MUST NOT be marked as default
      for (let i = 1; i < profiles.length; i++) {
        expect(profiles[i].is_default).toBe(false);
      }
    });

    it('GET /book-profiles API endpoint returns HTTP 200 with profiles and default_profile', async () => {
      const req = new Request('http://localhost/book-profiles?mataPelajaran=Bahasa%20Indonesia&jenjangKelas=Kelas%205');
      const res = await analisisCpRoutes.fetch(req, {} as any);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.profiles)).toBe(true);
      expect(body.data.default_profile).toBeDefined();
      expect(body.data.default_profile.is_default).toBe(true);
      expect(body.data.default_profile.chapters.length).toBe(8);
    });
  });
});
