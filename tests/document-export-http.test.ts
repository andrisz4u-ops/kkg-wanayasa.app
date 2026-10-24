// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import app from '../src/index';
import { request } from '../public/static/js/http-client.js';
import { migratedDatabase } from './helpers/migrated-db';
import { validateAndRepairProgramResult } from '../src/routes/program-sekolah';

let db: ReturnType<typeof migratedDatabase>;
beforeEach(() => {
  db = migratedDatabase();
  db.sqlite.exec("INSERT INTO users(id,nama,email,password_hash,role,is_approved) VALUES(900,'Guru Fixture','export@fixture.invalid','x','user',1); INSERT INTO sessions(id,user_id,expires_at) VALUES('export-fixture',900,datetime('now','+1 day'));");
  vi.stubGlobal('document', { cookie: 'csrf_token=export-csrf' });
  vi.stubGlobal('fetch', vi.fn((path: string, init?: RequestInit) => {
    if (!path.startsWith('/api/')) throw new Error('Unexpected external request in document export fixture');
    const headers = new Headers(init?.headers); headers.set('Cookie', 'session=export-fixture; csrf_token=export-csrf');
    return app.request(`http://localhost${path}`, { ...init, headers }, { DB: db as any, ENVIRONMENT: 'development' });
  }));
});
afterEach(() => { db.close(); vi.unstubAllGlobals(); });

describe('actual document exports through client transport and application middleware', () => {
  it.each([
    ['/rpp/docx', {
      inputData: { namaSekolah: 'SD Fixture', mataPelajaran: 'Matematika', topik: 'Pecahan', jenjangKelas: 'Kelas 5', jumlahPertemuan: 1 },
      content: { identifikasi: {}, desain: {}, pertemuan: [{ nomor: 1, tujuan_pertemuan: ['Mengenal pecahan'], kegiatan: { pendahuluan: { isi: 'Mengamati kertas' } } }] },
    }],
    ['/analisis-cp/docx/atp-elemen', {
      metadata: { satuan_pendidikan: 'SD Fixture', mata_pelajaran: 'Matematika', kelas: '1', fase: 'A' },
      semesters: [{ semester: 1, babs: [{ no: 1, bab: 'Bilangan', cp: 'Mengenal bilangan', items: [{ kode_tp: '1.1', materi_pokok: 'Bilangan', tp: 'Mengenal angka', atp: 'Mengamati angka', alokasi_waktu: '2 JP' }] }] }],
    }],
  ])('returns a real Word archive for %s', async (path, body) => {
    const response = await request(path as string, { method: 'POST', body: body as Record<string, unknown> });
    expect(response.headers.get('content-type')).toContain('wordprocessingml');
    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    expect(await zip.file('word/document.xml')!.async('string')).toContain('Fixture');
  });

  it('exports an assembled Program Sekolah through the same protected transport', async () => {
    db.sqlite.exec("UPDATE users SET role='admin', role_label='admin' WHERE id=900");
    const program = validateAndRepairProgramResult({}, { template: '7kaih', identitas: { namaSekolah: 'SD Fixture', tahunAjaran: '2026/2027', penyusun: 'Guru Fixture' } });
    const response = await request('/program-sekolah/docx', { method: 'POST', body: program });
    expect(response.headers.get('content-type')).toContain('wordprocessingml');
    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    expect(await zip.file('word/document.xml')!.async('string')).toContain('Fixture');
  });
});
