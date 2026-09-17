import { describe, it, expect } from 'vitest';
import { calculateRpe, KALDIK_PURWAKARTA_2026_2027 } from '../src/lib/kaldik-purwakarta';
import { generateRpeDocxBuffer } from '../src/lib/docx/rpe';
import { generatePromesDocxBuffer } from '../src/lib/docx/promes';
import type { AnalisisCpDocxInput } from '../src/lib/docx/analisis-cp';
import analisisCp from '../src/routes/analisis-cp';

const sampleInput: AnalisisCpDocxInput = {
  metadata: {
    satuan_pendidikan: 'SD Negeri 1 Wanayasa',
    mata_pelajaran: 'Bahasa Inggris',
    fase: 'C',
    kelas: '5',
    fase_kelas: 'Fase C / Kelas 5',
    tahun_pembelajaran: '2026/2027',
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
          bab: 'Unit 1: What a Delicious Bakso!',
          cp: 'Murid memahami dan merespons teks lisan dan visual sederhana tentang makanan dan minuman.',
          materi_list: ['Food and Drinks', 'Taste and Texture'],
          items: [
            {
              kode_tp: '5.1.1',
              materi_pokok: 'Taste of Food',
              tp: 'Mengidentifikasi rasa makanan manis, asin, asam, pahit.',
              atp: 'Murid mengamati gambar makanan dan menyebutkan rasanya dalam bahasa Inggris.',
              alokasi_waktu: '2 JP'
            },
            {
              kode_tp: '5.1.2',
              materi_pokok: 'Describing Food',
              tp: 'Mendeskripsikan makanan favorit.',
              atp: 'Murid membuat kalimat sederhana tentang makanan favorit beserta rasanya.',
              alokasi_waktu: '2 JP'
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
          no: 6,
          bab: 'Unit 6: How Much is It?',
          cp: 'Murid menggunakan bahasa Inggris sederhana untuk berbelanja dan menyebutkan harga.',
          materi_list: ['Numbers 1-100', 'Shopping'],
          items: [
            {
              kode_tp: '5.6.1',
              materi_pokok: 'Price and Numbers',
              tp: 'Menyebutkan harga barang.',
              atp: 'Murid melakukan role play percakapan jual beli.',
              alokasi_waktu: '2 JP'
            }
          ]
        }
      ]
    }
  ]
};

describe('Kalender Pendidikan Purwakarta 2026/2027 & RPE Engine', () => {
  it('harus menghitung tepat 18 Minggu Efektif KBM untuk Semester 1 (Ganjil)', () => {
    const rpe1 = calculateRpe(1, 2, '5');
    expect(rpe1.semester).toBe(1);
    expect(rpe1.pekanEfektif).toBe(18);
    expect(rpe1.totalPekanKalender).toBe(30);
    expect(rpe1.pekanTidakEfektif).toBe(12);
    expect(rpe1.activeKbmWeeks).toHaveLength(18);

    // KBM dimulai pekan ke-4 (21 Juli 2026 pasca MPLS & Hari Jadi PWK)
    expect(rpe1.activeKbmWeeks[0]).toBe(4);
    expect(rpe1.weekStatusMap[3].status).toBe('MPLS');
    expect(rpe1.weekStatusMap[26].status).toBe('SAS');

    // Total alokasi 18 minggu x 2 JP = 36 JP
    expect(rpe1.totalJpTersedia).toBe(36);
  });

  it('harus menghitung tepat 18 Minggu Efektif untuk Semester 2 (Kelas 1-5)', () => {
    const rpe2 = calculateRpe(2, 2, '5');
    expect(rpe2.semester).toBe(2);
    expect(rpe2.pekanEfektif).toBe(18);
    expect(rpe2.activeKbmWeeks).toHaveLength(18);
    expect(rpe2.weekStatusMap[1].status).toBe('LBR'); // 1-8 Jan Libur Smt 1
    expect(rpe2.weekStatusMap[2].status).toBe('KBM'); // 11 Jan Masuk Smt 2
    expect(rpe2.weekStatusMap[7].status).toBe('LBR'); // Awal Ramadhan
    expect(rpe2.weekStatusMap[12].status).toBe('LBR'); // Libur Lebaran
    expect(rpe2.weekStatusMap[26].status).toBe('ASAT'); // ASAT / SAS Genap
  });

  it('harus menghitung 16 Minggu Efektif untuk Semester 2 khusus Kelas 6 (PSAJ)', () => {
    const rpeKelas6 = calculateRpe(2, 2, '6');
    expect(rpeKelas6.semester).toBe(2);
    expect(rpeKelas6.pekanEfektif).toBe(16);
    expect(rpeKelas6.pekanTidakEfektif).toBe(14);
  });

  it('harus menghasilkan buffer Word (.docx) yang valid untuk RPE', async () => {
    const buffer = await generateRpeDocxBuffer(sampleInput);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);
    // Header ZIP DOCX (PK\x03\x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });

  it('harus menghasilkan buffer DOCX RPE per semester secara spesifik', async () => {
    const bufferSem1 = await generateRpeDocxBuffer(sampleInput, 1);
    expect(bufferSem1).toBeInstanceOf(Uint8Array);
    expect(bufferSem1.length).toBeGreaterThan(1000);

    const bufferSem2 = await generateRpeDocxBuffer(sampleInput, 2);
    expect(bufferSem2).toBeInstanceOf(Uint8Array);
    expect(bufferSem2.length).toBeGreaterThan(1000);
  });

  it('harus menghasilkan buffer DOCX Promes yang terdistribusi sesuai Kaldik Purwakarta', async () => {
    const bufferPromes = await generatePromesDocxBuffer(sampleInput, 1);
    expect(bufferPromes).toBeInstanceOf(Uint8Array);
    expect(bufferPromes.length).toBeGreaterThan(1000);
    expect(bufferPromes[0]).toBe(0x50);
    expect(bufferPromes[1]).toBe(0x4b);
  });

  it('endpoint POST /docx/rpe harus mengembalikan berkas .docx dengan status 200', async () => {
    const req = new Request('http://localhost/docx/rpe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: sampleInput.metadata,
        semesters: sampleInput.semesters,
        semester: 1
      })
    });

    const res = await analisisCp.fetch(req, {} as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('wordprocessingml.document');
    expect(res.headers.get('Content-Disposition')).toContain('RPE_Bahasa_Inggris_Kelas_5_Semester_1.docx');

    const arrBuf = await res.arrayBuffer();
    const uint8 = new Uint8Array(arrBuf);
    expect(uint8[0]).toBe(0x50);
    expect(uint8[1]).toBe(0x4b);
  });
});
