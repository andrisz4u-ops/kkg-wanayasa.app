import { describe, it, expect } from 'vitest';
import { 
  distributeChaptersToSemesters, 
  buildStructurePrompt, 
  buildAnalisisCpPrompt, 
  getStandardCurriculumChapters 
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
                  atp: 'Peserta didik melakukan percobaan menggunakan cermin, gelas air, dan karton lubang.'
                },
                {
                  kode_tp: '5.2',
                  materi_pokok: '2. Indra Penglihatan (Mata)',
                  tp: 'Mengetahui bagian-bagian mata dan menjelaskan cara kerjanya.',
                  atp: 'Peserta didik mengamati model/gambar mata dan mengurutkan proses masuknya cahaya.'
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
                  atp: 'Peserta didik membuat alat peraga paru-paru dari botol bekas dan balon.'
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
