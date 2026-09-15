import { describe, it, expect } from 'vitest';
import { generateProtaDocxBuffer } from '../src/lib/docx/prota';
import { generatePromesDocxBuffer } from '../src/lib/docx/promes';
import { generateKktpDocxBuffer } from '../src/lib/docx/kktp';
import type { AnalisisCpDocxInput } from '../src/lib/docx/analisis-cp';
import analisisCp from '../src/routes/analisis-cp';

const sampleInput: AnalisisCpDocxInput = {
  metadata: {
    satuan_pendidikan: 'SD Negeri 1 Wanayasa',
    mata_pelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
    fase: 'C',
    kelas: '5',
    fase_kelas: 'Fase C / Kelas 5',
    tahun_pembelajaran: '2025/2026',
    guru: 'Budi Santoso, S.Pd.',
    nip_guru: '198501012010011001',
    kepala_sekolah: 'Hj. Siti Rahmah, M.Pd.',
    nip_kepala_sekolah: '197502021999032001',
  },
  semesters: [
    {
      semester: 1,
      semester_label: 'SEMESTER 1',
      babs: [
        {
          no: 1,
          bab: 'Bab 1: Melihat Karena Cahaya, Mendengar Karena Bunyi',
          cp: 'Pemahaman IPAS: Menjelaskan sifat-sifat bunyi dan cahaya melalui penyelidikan sederhana.',
          materi_list: ['Sifat Cahaya', 'Indra Penglihatan'],
          items: [
            {
              kode_tp: '5.1',
              materi_pokok: 'Sifat Cahaya',
              tp: 'Mendesain percobaan pembuktian sifat cahaya.',
              atp: 'Peserta didik melakukan penyelidikan pembuktian sifat cahaya merambat lurus dan menembus benda bening.',
              alokasi_waktu: '2 JP'
            },
            {
              kode_tp: '5.2',
              materi_pokok: 'Indra Penglihatan',
              tp: 'Menjelaskan bagian dan fungsi mata.',
              atp: 'Peserta didik mengamati bagan mata manusia dan mendiskusikan mekanisme penglihatan.',
              alokasi_waktu: '3 JP'
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
          bab: 'Bab 5: Bagaimana Kita Hidup dan Bertumbuh',
          cp: 'Pemahaman IPAS: Menganalisis sistem pernapasan dan pencernaan makanan manusia.',
          materi_list: ['Sistem Pernapasan', 'Sistem Pencernaan'],
          items: [
            {
              kode_tp: '5.5',
              materi_pokok: 'Sistem Pernapasan',
              tp: 'Mengidentifikasi organ pernapasan manusia.',
              atp: 'Peserta didik membuat model sederhana organ pernapasan dan mengamati alur udara.',
              alokasi_waktu: '2 JP'
            }
          ]
        }
      ]
    }
  ]
};

describe('4-in-1 Engine DOCX Generators (Prota, Promes, KKTP)', () => {
  it('should generate valid Word (.docx) buffer for Program Tahunan (PROTA)', async () => {
    const buffer = await generateProtaDocxBuffer(sampleInput);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);
    // Standard DOCX zip header (PK\x03\x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });

  it('should generate valid Word (.docx) buffer for Program Semester (PROMES)', async () => {
    const buffer = await generatePromesDocxBuffer(sampleInput);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('should generate valid Word (.docx) buffer for specific semester in PROMES', async () => {
    const bufferSem1 = await generatePromesDocxBuffer(sampleInput, 1);
    expect(bufferSem1).toBeInstanceOf(Uint8Array);
    expect(bufferSem1.length).toBeGreaterThan(1000);

    const bufferSem2 = await generatePromesDocxBuffer(sampleInput, 2);
    expect(bufferSem2).toBeInstanceOf(Uint8Array);
    expect(bufferSem2.length).toBeGreaterThan(1000);
  });

  it('should generate valid Word (.docx) buffer for Kriteria Ketercapaian (KKTP)', async () => {
    const buffer = await generateKktpDocxBuffer(sampleInput);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('should generate valid Word (.docx) buffer for specific semester in KKTP', async () => {
    const buffer = await generateKktpDocxBuffer(sampleInput, 1);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe('Analisis CP Endpoints for Prota, Promes, KKTP', () => {
  const mockEnv: any = {
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          all: async () => ({ results: [] }),
          run: async () => ({ results: [{ id: 1 }] })
        })
      })
    }
  };

  it('POST /docx/prota should return .docx stream with proper headers', async () => {
    const res = await analisisCp.fetch(
      new Request('http://localhost/docx/prota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleInput)
      }),
      mockEnv
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('openxmlformats-officedocument');
    expect(res.headers.get('Content-Disposition')).toContain('PROTA_');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('POST /docx/promes should return .docx stream with proper headers', async () => {
    const res = await analisisCp.fetch(
      new Request('http://localhost/docx/promes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sampleInput, semester: 1 })
      }),
      mockEnv
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('openxmlformats-officedocument');
    expect(res.headers.get('Content-Disposition')).toContain('PROMES_');
  });

  it('POST /docx/kktp should return .docx stream with proper headers', async () => {
    const res = await analisisCp.fetch(
      new Request('http://localhost/docx/kktp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleInput)
      }),
      mockEnv
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('openxmlformats-officedocument');
    expect(res.headers.get('Content-Disposition')).toContain('KKTP_');
  });
});
