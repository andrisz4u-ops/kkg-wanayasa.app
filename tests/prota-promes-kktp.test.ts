import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { generateProtaDocxBuffer } from '../src/lib/docx/prota';
import { generatePromesDocxBuffer } from '../src/lib/docx/promes';
import { generateKktpDocxBuffer } from '../src/lib/docx/kktp';
import { generateAnalisisCpDocxBuffer } from '../src/lib/docx/analisis-cp';
import { generateRpeDocxBuffer } from '../src/lib/docx/rpe';
import type { AnalisisCpDocxInput } from '../src/lib/docx/analisis-cp';
import analisisCp from '../src/routes/analisis-cp';

async function getDocumentXml(buffer: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) throw new Error('word/document.xml not found in docx');
  return await docXmlFile.async('string');
}

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
              atp: 'Murid melakukan penyelidikan pembuktian sifat cahaya merambat lurus dan menembus benda bening.',
              alokasi_waktu: '2 JP'
            },
            {
              kode_tp: '5.2',
              materi_pokok: 'Indra Penglihatan',
              tp: 'Menjelaskan bagian dan fungsi mata.',
              atp: 'Murid mengamati bagan mata manusia dan mendiskusikan mekanisme penglihatan.',
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
              atp: 'Murid membuat model sederhana organ pernapasan dan mengamati alur udara.',
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

  it('should generate PROMES with true A4 Landscape orientation (width: 16838, height: 11906)', async () => {
    const buffer = await generatePromesDocxBuffer(sampleInput, 1);
    const xml = await getDocumentXml(buffer);
    expect(xml).toContain('w:orient="landscape"');
    expect(xml).toContain('w:w="16838"');
    expect(xml).toContain('w:h="11906"');
  });

  it('should generate PROTA with true A4 Landscape orientation (width: 16838, height: 11906)', async () => {
    const buffer = await generateProtaDocxBuffer(sampleInput);
    const xml = await getDocumentXml(buffer);
    expect(xml).toContain('w:orient="landscape"');
    expect(xml).toContain('w:w="16838"');
    expect(xml).toContain('w:h="11906"');
  });

  it('should generate KKTP with true A4 Landscape orientation (width: 16838, height: 11906)', async () => {
    const buffer = await generateKktpDocxBuffer(sampleInput);
    const xml = await getDocumentXml(buffer);
    expect(xml).toContain('w:orient="landscape"');
    expect(xml).toContain('w:w="16838"');
    expect(xml).toContain('w:h="11906"');
  });

  it('should generate Analisis CP with true A4 Landscape orientation (width: 16838, height: 11906)', async () => {
    const buffer = await generateAnalisisCpDocxBuffer(sampleInput);
    const xml = await getDocumentXml(buffer);
    expect(xml).toContain('w:orient="landscape"');
    expect(xml).toContain('w:w="16838"');
    expect(xml).toContain('w:h="11906"');
  });

  it('should generate RPE with true A4 Portrait orientation (width: 11906, height: 16838)', async () => {
    const buffer = await generateRpeDocxBuffer(sampleInput, 1);
    const xml = await getDocumentXml(buffer);
    expect(xml).toContain('w:orient="portrait"');
    expect(xml).toContain('w:w="11906"');
    expect(xml).toContain('w:h="16838"');
  });

  it('should scale Kop Surat image proportionally without cutting off in landscape and portrait', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const kopBuf = fs.readFileSync(path.resolve(__dirname, '../public/static/kop_surat.png'));

    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any) => {
      if (String(url).includes('kop_surat')) {
        return new Response(kopBuf, {
          headers: { 'Content-Type': 'image/png' }
        });
      }
      return origFetch(url);
    }) as any;

    try {
      const inputWithKop: AnalisisCpDocxInput = {
        ...sampleInput,
        metadata: {
          ...sampleInput.metadata,
          kop_surat_url: 'http://localhost/static/kop_surat.png'
        }
      };

      // Test in Promes (Landscape)
      const promesBuf = await generatePromesDocxBuffer(inputWithKop, 1);
      const promesXml = await getDocumentXml(promesBuf);
      expect(promesXml).toContain('w:drawing');
      // 720 px * 9525 = 6858000 EMUs
      expect(promesXml).toContain('cx="6858000"');

      // Test in RPE (Portrait)
      const rpeBuf = await generateRpeDocxBuffer(inputWithKop, 1);
      const rpeXml = await getDocumentXml(rpeBuf);
      expect(rpeXml).toContain('w:drawing');
      // 620 px * 9525 = 5905500 EMUs
      expect(rpeXml).toContain('cx="5905500"');
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('should center align signatures for KS and Guru across all generated documents', async () => {
    const promesBuf = await generatePromesDocxBuffer(sampleInput, 1);
    const promesXml = await getDocumentXml(promesBuf);
    expect(promesXml).toContain('Mengetahui');
    expect(promesXml).toContain('w:jc w:val="center"');

    const protaBuf = await generateProtaDocxBuffer(sampleInput);
    const protaXml = await getDocumentXml(protaBuf);
    expect(protaXml).toContain('w:jc w:val="center"');

    const kktpBuf = await generateKktpDocxBuffer(sampleInput);
    const kktpXml = await getDocumentXml(kktpBuf);
    expect(kktpXml).toContain('w:jc w:val="center"');

    const analisisBuf = await generateAnalisisCpDocxBuffer(sampleInput);
    const analisisXml = await getDocumentXml(analisisBuf);
    expect(analisisXml).toContain('w:jc w:val="center"');

    const rpeBuf = await generateRpeDocxBuffer(sampleInput, 1);
    const rpeXml = await getDocumentXml(rpeBuf);
    expect(rpeXml).toContain('w:jc w:val="center"');
  });

  it('should format signature titimangsa with Juli for Prota & Semester 1, and Januari for Semester 2', async () => {
    // Prota (1 year) -> Juli
    const protaBuf = await generateProtaDocxBuffer(sampleInput);
    const protaXml = await getDocumentXml(protaBuf);
    expect(protaXml).toContain('Purwakarta, 13 Juli 2025');

    // Promes Semester 1 -> Juli
    const promesSem1Buf = await generatePromesDocxBuffer(sampleInput, 1);
    const promesSem1Xml = await getDocumentXml(promesSem1Buf);
    expect(promesSem1Xml).toContain('Purwakarta, 13 Juli 2025');

    // Promes Semester 2 -> Januari
    const promesSem2Buf = await generatePromesDocxBuffer(sampleInput, 2);
    const promesSem2Xml = await getDocumentXml(promesSem2Buf);
    expect(promesSem2Xml).toContain('Purwakarta, 11 Januari 2026');

    // Analisis CP (annual) -> Juli
    const analisisBuf = await generateAnalisisCpDocxBuffer(sampleInput);
    const analisisXml = await getDocumentXml(analisisBuf);
    expect(analisisXml).toContain('Purwakarta, 13 Juli 2025');

    // KKTP Semester 1 & Semester 2
    const kktpSem1Buf = await generateKktpDocxBuffer(sampleInput, 1);
    const kktpSem1Xml = await getDocumentXml(kktpSem1Buf);
    expect(kktpSem1Xml).toContain('Purwakarta, 13 Juli 2025');

    const kktpSem2Buf = await generateKktpDocxBuffer(sampleInput, 2);
    const kktpSem2Xml = await getDocumentXml(kktpSem2Buf);
    expect(kktpSem2Xml).toContain('Purwakarta, 11 Januari 2026');

    // RPE Semester 1 & Semester 2
    const rpeSem1Buf = await generateRpeDocxBuffer(sampleInput, 1);
    const rpeSem1Xml = await getDocumentXml(rpeSem1Buf);
    expect(rpeSem1Xml).toContain('Purwakarta, 13 Juli 2025');

    const rpeSem2Buf = await generateRpeDocxBuffer(sampleInput, 2);
    const rpeSem2Xml = await getDocumentXml(rpeSem2Buf);
    expect(rpeSem2Xml).toContain('Purwakarta, 11 Januari 2026');
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
