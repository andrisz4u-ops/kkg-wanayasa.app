/**
 * DOCX Document Generator for Paket Surat Perintah Tugas (SPT),
 * Surat Perjalanan Dinas (SPD/SPPD Lembar 1), Lembar Visum SPD, dan Laporan Hasil Pekerjaan (LHP)
 */

import {
    Document,
    Paragraph,
    TextRun,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    Packer,
    convertInchesToTwip,
    VerticalAlign,
    ImageRun,
} from 'docx';

import { SppdData, KKGSettings, FONT_FAMILY, FONT_SIZE_NORMAL, FONT_SIZE_SMALL, FONT_SIZE_HEADER, FONT_SIZE_TITLE } from './types';
import { base64toBuffer, base64ToBytes, generateKopSuratDocx } from './helpers';
import { LOGO_PEMDA_BASE64 } from '../logos';

const BULAN_INDONESIA = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const HARI_INDONESIA = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export function formatTanggalIndo(dateStr?: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m < 12) {
            return `${d} ${BULAN_INDONESIA[m]} ${y}`;
        }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${BULAN_INDONESIA[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatHariTanggalIndo(dateStr?: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) {
            return `${HARI_INDONESIA[dateObj.getDay()]}, ${d} ${BULAN_INDONESIA[m]} ${y}`;
        }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${HARI_INDONESIA[d.getDay()]}, ${d.getDate()} ${BULAN_INDONESIA[d.getMonth()]} ${d.getFullYear()}`;
}

export function hitungHPlus1(dateStr?: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const nextDate = new Date(y, m, d + 1);
        const ry = nextDate.getFullYear();
        const rm = String(nextDate.getMonth() + 1).padStart(2, '0');
        const rd = String(nextDate.getDate()).padStart(2, '0');
        return `${ry}-${rm}-${rd}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + 1);
    const ry = d.getFullYear();
    const rm = String(d.getMonth() + 1).padStart(2, '0');
    const rd = String(d.getDate()).padStart(2, '0');
    return `${ry}-${rm}-${rd}`;
}

const tableBorderThin = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
};

const tableBorderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

function createKopSekolahTable(sekolahNama: string, alamatSekolah?: string, settings?: KKGSettings): Table {
    let pemdaBuffer: Uint8Array | null = null;
    try {
        if (LOGO_PEMDA_BASE64) {
            pemdaBuffer = base64toBuffer(LOGO_PEMDA_BASE64);
        }
    } catch { }

    const cleanSekolahNama = (sekolahNama || 'SD NEGERI').toUpperCase();
    const cleanKabupaten = (settings?.kabupaten || 'PURWAKARTA').toUpperCase();
    const cleanKecamatan = settings?.kecamatan || 'Wanayasa';
    const cleanAlamat = alamatSekolah || `Kecamatan ${cleanKecamatan}, Kabupaten ${settings?.kabupaten || 'Purwakarta'}`;

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.DOUBLE, size: 16, color: '000000' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: pemdaBuffer ? [
                                    new ImageRun({
                                        data: pemdaBuffer,
                                        transformation: { width: 65, height: 75 },
                                        type: 'png',
                                    })
                                ] : [],
                            })
                        ],
                        borders: tableBorderNone,
                    }),
                    new TableCell({
                        width: { size: 85, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 20 },
                                children: [
                                    new TextRun({ text: `PEMERINTAH KABUPATEN ${cleanKabupaten}`, bold: true, size: 24, font: FONT_FAMILY }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 20 },
                                children: [
                                    new TextRun({ text: 'DINAS PENDIDIKAN', bold: true, size: 26, font: FONT_FAMILY }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 20 },
                                children: [
                                    new TextRun({ text: `SATUAN PENDIDIKAN FORMAL ${cleanSekolahNama}`, bold: true, size: 26, font: FONT_FAMILY }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 60 },
                                children: [
                                    new TextRun({ text: cleanAlamat, italic: true, size: 20, font: FONT_FAMILY }),
                                ],
                            }),
                        ],
                        borders: tableBorderNone,
                    }),
                ],
            }),
        ],
    });
}

export async function generateSppdDocx(data: SppdData, settings?: KKGSettings): Promise<Document> {
    const tglKegiatanIndo = formatTanggalIndo(data.tanggal_kegiatan);
    const hariTglIndo = formatHariTanggalIndo(data.tanggal_kegiatan);
    const tglLhp = data.tanggal_lhp || hitungHPlus1(data.tanggal_kegiatan);
    const tglLhpIndo = formatTanggalIndo(tglLhp);

    const guruList = (data.daftar_guru && data.daftar_guru.length > 0)
        ? data.daftar_guru
        : [{ nama: 'Guru Kelas', nip: '-', pangkat_golongan: '-', jabatan: 'Guru Kelas' }];

    const guruUtama = guruList[0];
    const pengikutList = guruList.slice(1);
    const pengikutStr = pengikutList.length > 0
        ? pengikutList.map(g => `${g.nama} (${g.jabatan || 'Guru'})`).join(', ')
        : '-';

    const nomorSPT = data.nomor_surat_tugas || `421.2 / 058 / ${data.sekolah_asal_nama.replace(/\s+/g, '')} / IX / 2026`;
    const nomorSPPD = data.nomor_sppd || `090 / 058 / ${data.sekolah_asal_nama.replace(/\s+/g, '')} / IX / 2026`;

    // Standard Page margins (1 inch top, bottom, right; 1.25 inch left)
    const pageMargins = {
        top: convertInchesToTwip(0.8),
        right: convertInchesToTwip(0.8),
        bottom: convertInchesToTwip(0.8),
        left: convertInchesToTwip(1),
    };

    // Prepare KOP Surat (custom image from school account or dynamic table kop)
    let kopSuratNodes: (Paragraph | Table)[] = [];
    if (data.kop_surat_url) {
        try {
            kopSuratNodes = await generateKopSuratDocx(data.kop_surat_url, false);
        } catch (e) {
            console.warn('[SPPD DOCX] Failed to generate kop from URL:', e);
        }
    }

    const kopSection1 = kopSuratNodes.length > 0
        ? kopSuratNodes
        : [createKopSekolahTable(data.sekolah_asal_nama, data.alamat_sekolah_asal, settings)];

    const kopSection4 = kopSuratNodes.length > 0
        ? kopSuratNodes
        : [createKopSekolahTable(data.sekolah_asal_nama, data.alamat_sekolah_asal, settings)];

    // ==========================================
    // SECTION 1: SURAT PERINTAH TUGAS (SPT)
    // ==========================================
    const sectionSPT = {
        properties: { page: { margin: pageMargins } },
        children: [
            ...kopSection1,
            new Paragraph({ spacing: { before: 180, after: 40 }, alignment: AlignmentType.CENTER, children: [
                new TextRun({ text: 'SURAT PERINTAH TUGAS', bold: true, underline: {}, size: 26, font: FONT_FAMILY })
            ]}),
            new Paragraph({ spacing: { after: 160 }, alignment: AlignmentType.CENTER, children: [
                new TextRun({ text: `Nomor : ${nomorSPT}`, size: 22, font: FONT_FAMILY })
            ]}),

            // Dasar Penugasan
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderNone,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 15, type: WidthType.PERCENTAGE },
                                borders: tableBorderNone,
                                children: [new Paragraph({ children: [new TextRun({ text: 'Dasar', bold: true, font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })],
                            }),
                            new TableCell({
                                width: { size: 3, type: WidthType.PERCENTAGE },
                                borders: tableBorderNone,
                                children: [new Paragraph({ children: [new TextRun({ text: ':', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })],
                            }),
                            new TableCell({
                                width: { size: 82, type: WidthType.PERCENTAGE },
                                borders: tableBorderNone,
                                children: [new Paragraph({ children: [new TextRun({ text: data.dasar_surat || 'Surat Undangan dari Pengurus Kelompok Kerja Guru (KKG) Gugus 3 Wanayasa', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })],
                            }),
                        ],
                    }),
                ],
            }),

            new Paragraph({ spacing: { before: 140, after: 80 }, children: [
                new TextRun({ text: 'MEMERINTAHKAN :', bold: true, font: FONT_FAMILY, size: FONT_SIZE_SMALL })
            ]}),
            new Paragraph({ spacing: { after: 80 }, children: [
                new TextRun({ text: `Kepala ${data.sekolah_asal_nama} Kecamatan Wanayasa Kabupaten Purwakarta menugaskan kepada:`, font: FONT_FAMILY, size: FONT_SIZE_SMALL })
            ]}),

            // Tabel Daftar Guru
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderThin,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_FAMILY, size: 20 })] })] }),
                            new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nama', bold: true, font: FONT_FAMILY, size: 20 })] })] }),
                            new TableCell({ width: { size: 26, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NIP', bold: true, font: FONT_FAMILY, size: 20 })] })] }),
                            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Pangkat / Gol', bold: true, font: FONT_FAMILY, size: 20 })] })] }),
                            new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Jabatan', bold: true, font: FONT_FAMILY, size: 20 })] })] }),
                        ],
                    }),
                    ...guruList.map((g, idx) => new TableRow({
                        children: [
                            new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font: FONT_FAMILY, size: 20 })] })] }),
                            new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: g.nama, bold: true, font: FONT_FAMILY, size: 20 })] })] }),
                            new TableCell({ width: { size: 26, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: g.nip || '-', font: FONT_FAMILY, size: 20 })] })] }),
                            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: g.pangkat_golongan || '-', font: FONT_FAMILY, size: 20 })] })] }),
                            new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: g.jabatan || 'Guru', font: FONT_FAMILY, size: 20 })] })] }),
                        ],
                    })),
                ],
            }),

            // Untuk
            new Paragraph({ spacing: { before: 140, after: 60 }, children: [
                new TextRun({ text: `Untuk : Mengikuti kegiatan Kelompok Kerja Guru (KKG) Gugus 3 Wanayasa, yang akan dilaksanakan pada:`, font: FONT_FAMILY, size: FONT_SIZE_SMALL })
            ]}),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderNone,
                rows: [
                    new TableRow({ children: [
                        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: 'Hari / Tanggal', font: FONT_FAMILY, size: 20 })] })] }),
                        new TableCell({ width: { size: 3, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: ':', font: FONT_FAMILY, size: 20 })] })] }),
                        new TableCell({ width: { size: 72, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: hariTglIndo, bold: true, font: FONT_FAMILY, size: 20 })] })] }),
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: 'Waktu', font: FONT_FAMILY, size: 20 })] })] }),
                        new TableCell({ width: { size: 3, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: ':', font: FONT_FAMILY, size: 20 })] })] }),
                        new TableCell({ width: { size: 72, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: `${data.waktu_kegiatan || '08.00 WIB s.d Selesai'}`, font: FONT_FAMILY, size: 20 })] })] }),
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: 'Tempat', font: FONT_FAMILY, size: 20 })] })] }),
                        new TableCell({ width: { size: 3, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: ':', font: FONT_FAMILY, size: 20 })] })] }),
                        new TableCell({ width: { size: 72, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: data.tempat_kegiatan, font: FONT_FAMILY, size: 20 })] })] }),
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: 'Keperluan / Acara', font: FONT_FAMILY, size: 20 })] })] }),
                        new TableCell({ width: { size: 3, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: ':', font: FONT_FAMILY, size: 20 })] })] }),
                        new TableCell({ width: { size: 72, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({ children: [new TextRun({ text: data.agenda, bold: true, font: FONT_FAMILY, size: 20 })] })] }),
                    ]}),
                ],
            }),

            new Paragraph({ spacing: { before: 120, after: 120 }, children: [
                new TextRun({ text: 'Demikian Surat Perintah Tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab dan melaporkan hasilnya setelah kegiatan selesai.', font: FONT_FAMILY, size: FONT_SIZE_SMALL })
            ]}),

            // Tanda Tangan KS Asal
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderNone,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({})] }),
                            new TableCell({
                                width: { size: 45, type: WidthType.PERCENTAGE },
                                borders: tableBorderNone,
                                children: [
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Dikeluarkan di : Wanayasa`, font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Pada tanggal   : ${tglKegiatanIndo}`, font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'Kepala Sekolah,', font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 480 }, children: [new TextRun({ text: '', font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: data.kepala_sekolah_asal, bold: true, underline: {}, font: FONT_FAMILY, size: 22 })] }),
                                    new Paragraph({ children: [new TextRun({ text: `NIP. ${data.nip_kepala_sekolah_asal || '-'}`, font: FONT_FAMILY, size: 20 })] }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    };

    // ==========================================
    // SECTION 2: SURAT PERJALANAN DINAS (SPD) LEMBAR I
    // ==========================================
    const sectionSPD = {
        properties: { page: { margin: pageMargins } },
        children: [
            // Header kanan atas
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderNone,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({})] }),
                            new TableCell({
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                borders: tableBorderNone,
                                children: [
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: 'Lembar Ke : I', font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: 'Kode No    : -', font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `Nomor       : ${nomorSPPD}`, font: FONT_FAMILY, size: 18 })] }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            new Paragraph({ spacing: { after: 40 }, alignment: AlignmentType.CENTER, children: [
                new TextRun({ text: 'SURAT PERJALANAN DINAS (SPD)', bold: true, underline: {}, size: 26, font: FONT_FAMILY })
            ]}),
            new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER, children: [
                new TextRun({ text: `Nomor : ${nomorSPPD}`, size: 20, font: FONT_FAMILY })
            ]}),

            // Tabel 10 Poin Standar SPPD
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderThin,
                rows: [
                    // 1
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Pejabat Pembuat Komitmen / Pejabat yang memberi perintah', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: `Kepala ${data.sekolah_asal_nama}`, bold: true, font: FONT_FAMILY, size: 19 })] })] }),
                    ]}),
                    // 2
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '2.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Nama Pegawai yang diperintahkan', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [
                            new Paragraph({ children: [new TextRun({ text: guruUtama.nama, bold: true, font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: `NIP. ${guruUtama.nip || '-'}`, font: FONT_FAMILY, size: 18 })] }),
                        ]}),
                    ]}),
                    // 3
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '3.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [
                            new Paragraph({ children: [new TextRun({ text: 'a. Pangkat dan Golongan ruang gaji', font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: 'b. Jabatan / Instansi', font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: 'c. Tingkat Biaya Perjalanan Dinas', font: FONT_FAMILY, size: 19 })] }),
                        ]}),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [
                            new Paragraph({ children: [new TextRun({ text: `a. ${guruUtama.pangkat_golongan || '-'}`, font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: `b. ${guruUtama.jabatan || 'Guru'} / ${data.sekolah_asal_nama}`, font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: `c. ${data.tingkat_biaya || 'Tingkat C / Biaya Transport Lokal'}`, font: FONT_FAMILY, size: 19 })] }),
                        ]}),
                    ]}),
                    // 4
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '4.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Maksud Perjalanan Dinas', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: data.agenda, font: FONT_FAMILY, size: 19 })] })] }),
                    ]}),
                    // 5
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '5.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Alat angkut yang dipergunakan', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: data.alat_angkut || 'Kendaraan Pribadi / Sepeda Motor', font: FONT_FAMILY, size: 19 })] })] }),
                    ]}),
                    // 6
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '6.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [
                            new Paragraph({ children: [new TextRun({ text: 'a. Tempat berangkat', font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: 'b. Tempat tujuan', font: FONT_FAMILY, size: 19 })] }),
                        ]}),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [
                            new Paragraph({ children: [new TextRun({ text: `a. ${data.sekolah_asal_nama}`, font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: `b. ${data.tempat_kegiatan}`, font: FONT_FAMILY, size: 19 })] }),
                        ]}),
                    ]}),
                    // 7
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '7.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [
                            new Paragraph({ children: [new TextRun({ text: 'a. Lamanya Perjalanan Dinas', font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: 'b. Tanggal berangkat', font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: 'c. Tanggal harus kembali/tiba', font: FONT_FAMILY, size: 19 })] }),
                        ]}),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [
                            new Paragraph({ children: [new TextRun({ text: `a. ${data.lama_hari || '1 (satu) hari'}`, font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: `b. ${tglKegiatanIndo}`, font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: `c. ${tglKegiatanIndo}`, font: FONT_FAMILY, size: 19 })] }),
                        ]}),
                    ]}),
                    // 8
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '8.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Pengikut : Nama', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: pengikutStr, font: FONT_FAMILY, size: 19 })] })] }),
                    ]}),
                    // 9
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '9.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [
                            new Paragraph({ children: [new TextRun({ text: 'Pembebanan Anggaran:', font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: 'a. Instansi', font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: 'b. Akun / Mata Anggaran', font: FONT_FAMILY, size: 19 })] }),
                        ]}),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [
                            new Paragraph({ children: [new TextRun({ text: '', font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: `a. ${data.sekolah_asal_nama}`, font: FONT_FAMILY, size: 19 })] }),
                            new Paragraph({ children: [new TextRun({ text: `b. ${data.mata_anggaran || 'Dana BOS'}`, font: FONT_FAMILY, size: 19 })] }),
                        ]}),
                    ]}),
                    // 10
                    new TableRow({ children: [
                        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '10.', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Keterangan lain-lain', font: FONT_FAMILY, size: 19 })] })] }),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorderThin, children: [new Paragraph({ children: [new TextRun({ text: '-', font: FONT_FAMILY, size: 19 })] })] }),
                    ]}),
                ],
            }),

            // Tanda Tangan SPPD Lembar 1
            new Paragraph({ spacing: { before: 120 }, children: [] }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderNone,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({})] }),
                            new TableCell({
                                width: { size: 45, type: WidthType.PERCENTAGE },
                                borders: tableBorderNone,
                                children: [
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Dikeluarkan di : ${settings?.kecamatan || 'Wanayasa'}`, font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Pada tanggal   : ${tglKegiatanIndo}`, font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'Kepala Sekolah,', font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 460 }, children: [new TextRun({ text: '', font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: data.kepala_sekolah_asal, bold: true, underline: {}, font: FONT_FAMILY, size: 22 })] }),
                                    new Paragraph({ children: [new TextRun({ text: `NIP. ${data.nip_kepala_sekolah_asal || '-'}`, font: FONT_FAMILY, size: 20 })] }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    };

    // ==========================================
    // SECTION 3: LEMBAR VISUM SPPD (LEMBAR KEDUA)
    // ==========================================
    const sectionVisum = {
        properties: { page: { margin: pageMargins } },
        children: [
            // Header Visum
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderNone,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 55, type: WidthType.PERCENTAGE },
                                borders: tableBorderNone,
                                children: [
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `SPPD No : ${nomorSPPD}`, bold: true, font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Berangkat dari : ${data.sekolah_asal_nama}`, font: FONT_FAMILY, size: 19 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `(Tempat Kedudukan)`, italic: true, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Ke : ${data.tempat_kegiatan}`, font: FONT_FAMILY, size: 19 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Pada tanggal : ${tglKegiatanIndo}`, font: FONT_FAMILY, size: 19 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'Kepala Sekolah Asal,', font: FONT_FAMILY, size: 19 })] }),
                                    new Paragraph({ spacing: { after: 440 }, children: [new TextRun({ text: '', font: FONT_FAMILY, size: 19 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: data.kepala_sekolah_asal, bold: true, underline: {}, font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ children: [new TextRun({ text: `NIP. ${data.nip_kepala_sekolah_asal || '-'}`, font: FONT_FAMILY, size: 18 })] }),
                                ],
                            }),
                            new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({})] }),
                        ],
                    }),
                ],
            }),

            new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }),

            // Tabel Grid Visum (2 Kolom)
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderThin,
                rows: [
                    // Row 1: Kedatangan & Keberangkatan di Tempat Tujuan
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: tableBorderThin,
                                children: [
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: `I. Tiba di : ${data.tempat_kegiatan}`, bold: true, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `   Pada tanggal : ${tglKegiatanIndo}`, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Kepala Sekolah / Pejabat di Tempat Tujuan,`, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: '', font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: data.kepala_sekolah_tujuan || '(..................................................)', bold: true, underline: {}, font: FONT_FAMILY, size: 19 })] }),
                                    new Paragraph({ children: [new TextRun({ text: `NIP. ${data.nip_kepala_sekolah_tujuan || '........................................'}`, font: FONT_FAMILY, size: 17 })] }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: tableBorderThin,
                                children: [
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: `Berangkat dari : ${data.tempat_kegiatan}`, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: `Ke : ${data.sekolah_asal_nama}`, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Pada tanggal : ${tglKegiatanIndo}`, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Kepala Sekolah / Pejabat di Tempat Tujuan,`, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: '', font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: data.kepala_sekolah_tujuan || '(..................................................)', bold: true, underline: {}, font: FONT_FAMILY, size: 19 })] }),
                                    new Paragraph({ children: [new TextRun({ text: `NIP. ${data.nip_kepala_sekolah_tujuan || '........................................'}`, font: FONT_FAMILY, size: 17 })] }),
                                ],
                            }),
                        ],
                    }),
                    // Row 2: Kedatangan Kembali di Sekolah Asal & Pemeriksaan
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: tableBorderThin,
                                children: [
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: `II. Tiba di : ${data.sekolah_asal_nama}`, bold: true, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: `    (Tempat Kedudukan)`, italic: true, font: FONT_FAMILY, size: 17 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `    Pada tanggal : ${tglKegiatanIndo}`, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Kepala Sekolah Asal,`, font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: '', font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: data.kepala_sekolah_asal, bold: true, underline: {}, font: FONT_FAMILY, size: 19 })] }),
                                    new Paragraph({ children: [new TextRun({ text: `NIP. ${data.nip_kepala_sekolah_asal || '-'}`, font: FONT_FAMILY, size: 17 })] }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: tableBorderThin,
                                children: [
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'Telah diperiksa dengan keterangan bahwa perjalanan tersebut di atas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.', italic: true, font: FONT_FAMILY, size: 17 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'Kepala Sekolah Asal,', font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: '', font: FONT_FAMILY, size: 18 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: data.kepala_sekolah_asal, bold: true, underline: {}, font: FONT_FAMILY, size: 19 })] }),
                                    new Paragraph({ children: [new TextRun({ text: `NIP. ${data.nip_kepala_sekolah_asal || '-'}`, font: FONT_FAMILY, size: 17 })] }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            // Klausul Keuangan Negara
            new Paragraph({ spacing: { before: 100, after: 30 }, children: [
                new TextRun({ text: 'III. CATATAN LAIN-LAIN / PERHATIAN:', bold: true, font: FONT_FAMILY, size: 18 })
            ]}),
            new Paragraph({ spacing: { after: 40 }, children: [
                new TextRun({ text: 'PPK yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.', italic: true, font: FONT_FAMILY, size: 17 })
            ]}),
        ],
    };

    // ==========================================
    // SECTION 4: LAPORAN HASIL PEKERJAAN (LHP)
    // ==========================================
    const defaultLhpPoints = [
        `Telah mengikuti seluruh rangkaian agenda kegiatan KKG dengan materi "${data.agenda}" secara aktif dan penuh tanggung jawab.`,
        `Memahami dan menguasai langkah-langkah implementasi materi kegiatan serta melakukan praktik penyusunan dokumen pembelajaran bersama kelompok guru gugus.`,
        `Berpartisipasi aktif dalam diskusi kelompok kerja guru dalam memecahkan kendala pembelajaran di satuan pendidikan masing-masing.`,
        `Menyepakati tindak lanjut kegiatan untuk diterapkan secara langsung pada pembelajaran di kelas dan didesiminasikan kepada pendidik lainnya di ${data.sekolah_asal_nama}.`
    ];

    let lhpParagraphs: Paragraph[] = [];
    if (data.isi_lhp && data.isi_lhp.trim().length > 0) {
        const rawLines = data.isi_lhp.split('\n').map(l => l.trim()).filter(Boolean);
        lhpParagraphs = rawLines.map(line => new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: line, font: FONT_FAMILY, size: 20 })]
        }));
    } else {
        lhpParagraphs = defaultLhpPoints.map((pt, i) => new Paragraph({
            spacing: { after: 40 },
            children: [
                new TextRun({ text: `${i + 1}. `, bold: true, font: FONT_FAMILY, size: 20 }),
                new TextRun({ text: pt, font: FONT_FAMILY, size: 20 })
            ]
        }));
    }

    const sectionLHP = {
        properties: { page: { margin: pageMargins } },
        children: [
            ...kopSection4,
            new Paragraph({ spacing: { before: 140, after: 40 }, alignment: AlignmentType.CENTER, children: [
                new TextRun({ text: 'LAPORAN HASIL PEKERJAAN', bold: true, underline: {}, size: 26, font: FONT_FAMILY })
            ]}),
            new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER, children: [
                new TextRun({ text: `Kegiatan Kelompok Kerja Guru (KKG) Gugus 3 Wanayasa`, size: 20, font: FONT_FAMILY })
            ]}),

            // Kepada Yth
            new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'Kepada Yth.', font: FONT_FAMILY, size: 20 })] }),
            new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Kepala ${data.sekolah_asal_nama}`, bold: true, font: FONT_FAMILY, size: 20 })] }),
            new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'di Tempat', font: FONT_FAMILY, size: 20 })] }),

            // Poin-poin LHP
            new Paragraph({ spacing: { after: 30 }, children: [
                new TextRun({ text: '1. Dasar Penugasan:', bold: true, font: FONT_FAMILY, size: 20 })
            ]}),
            new Paragraph({ spacing: { after: 60, left: 360 }, children: [
                new TextRun({ text: `Surat Perintah Tugas Nomor: ${nomorSPT} tertanggal ${tglKegiatanIndo}.`, font: FONT_FAMILY, size: 20 })
            ]}),

            new Paragraph({ spacing: { after: 30 }, children: [
                new TextRun({ text: '2. Waktu dan Tempat Pelaksanaan:', bold: true, font: FONT_FAMILY, size: 20 })
            ]}),
            new Paragraph({ spacing: { after: 20, left: 360 }, children: [
                new TextRun({ text: `- Hari / Tanggal : ${hariTglIndo}`, font: FONT_FAMILY, size: 20 })
            ]}),
            new Paragraph({ spacing: { after: 20, left: 360 }, children: [
                new TextRun({ text: `- Waktu           : ${data.waktu_kegiatan || '08.00 WIB s.d Selesai'}`, font: FONT_FAMILY, size: 20 })
            ]}),
            new Paragraph({ spacing: { after: 60, left: 360 }, children: [
                new TextRun({ text: `- Tempat          : ${data.tempat_kegiatan}`, font: FONT_FAMILY, size: 20 })
            ]}),

            new Paragraph({ spacing: { after: 30 }, children: [
                new TextRun({ text: '3. Maksud dan Tujuan:', bold: true, font: FONT_FAMILY, size: 20 })
            ]}),
            new Paragraph({ spacing: { after: 60, left: 360 }, children: [
                new TextRun({ text: data.agenda, font: FONT_FAMILY, size: 20 })
            ]}),

            new Paragraph({ spacing: { after: 30 }, children: [
                new TextRun({ text: '4. Hasil Pelaksanaan Tugas:', bold: true, font: FONT_FAMILY, size: 20 })
            ]}),
            ...lhpParagraphs.map(p => {
                p.spacing = { ...p.spacing, left: 360 };
                return p;
            }),

            new Paragraph({ spacing: { before: 40, after: 30 }, children: [
                new TextRun({ text: '5. Tindak Lanjut:', bold: true, font: FONT_FAMILY, size: 20 })
            ]}),
            new Paragraph({ spacing: { after: 60, left: 360 }, children: [
                new TextRun({ text: `Mengimplementasikan hasil kegiatan dalam kegiatan pembelajaran di kelas serta mengimbaskan kepada rekan guru di ${data.sekolah_asal_nama}.`, font: FONT_FAMILY, size: 20 })
            ]}),

            new Paragraph({ spacing: { after: 30 }, children: [
                new TextRun({ text: '6. Penutup:', bold: true, font: FONT_FAMILY, size: 20 })
            ]}),
            new Paragraph({ spacing: { after: 120, left: 360 }, children: [
                new TextRun({ text: 'Demikian laporan hasil pekerjaan ini disampaikan sebagai bentuk pertanggungjawaban atas penugasan yang telah dilaksanakan dengan penuh tanggung jawab.', font: FONT_FAMILY, size: 20 })
            ]}),

            // Tanda Tangan LHP (Wajib H+1 !)
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorderNone,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, borders: tableBorderNone, children: [new Paragraph({})] }),
                            new TableCell({
                                width: { size: 45, type: WidthType.PERCENTAGE },
                                borders: tableBorderNone,
                                children: [
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `Wanayasa, ${tglLhpIndo}`, font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'Pegawai yang Melaporkan,', font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 440 }, children: [new TextRun({ text: '', font: FONT_FAMILY, size: 20 })] }),
                                    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: guruUtama.nama, bold: true, underline: {}, font: FONT_FAMILY, size: 22 })] }),
                                    new Paragraph({ children: [new TextRun({ text: `NIP. ${guruUtama.nip || '-'}`, font: FONT_FAMILY, size: 20 })] }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    };

    return new Document({
        creator: `Portal Digital KKG Wanayasa`,
        title: `Paket Surat Tugas & SPPD - ${data.sekolah_asal_nama}`,
        description: `Dokumen Surat Perintah Tugas, SPD, Visum, dan LHP untuk ${data.agenda}`,
        styles: {
            default: {
                document: {
                    run: { font: FONT_FAMILY, size: FONT_SIZE_NORMAL },
                    paragraph: { spacing: { line: 260 } },
                },
            },
        },
        sections: [
            sectionSPT,
            sectionSPD,
            sectionVisum,
            sectionLHP,
        ],
    });
}

export async function generateSppdBuffer(data: SppdData, settings?: KKGSettings): Promise<Uint8Array> {
    try {
        const doc = await generateSppdDocx(data, settings);
        const base64 = await Packer.toBase64String(doc);
        return base64ToBytes(base64);
    } catch (err: any) {
        console.error('generateSppdBuffer error:', err);
        throw new Error(`Gagal membuat dokumen SPPD: ${err.message}`);
    }
}
