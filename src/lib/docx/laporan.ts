/**
 * DOCX Document Generator for Surat and Program Kerja
 * Uses docx library to generate Word documents
 */

import {
    Document,
    Paragraph,
    TextRun,
    AlignmentType,
    HeadingLevel,
    PageBreak,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    Packer,
    Header,
    Footer,
    PageNumber,
    NumberFormat,
    convertInchesToTwip,
    TabStopType,
    LeaderType,
    HeightRule,
    VerticalAlign,
    ImageRun,
} from 'docx';


import { SuratData, ProkerData, LaporanData, KKGSettings, Kegiatan, RppInputData, RppContentData, FONT_FAMILY, FONT_SIZE_NORMAL, FONT_SIZE_SMALL, FONT_SIZE_HEADER, FONT_SIZE_TITLE } from './types';

import { sanitizeText, cleanMarkdownSymbols, parseMarkdownToTextRuns, createRichParagraph, createParagraph, parseMarkdownTable, createKegiatanTable, createTableCell, createLembarPengesahan, createSignatureCell, parseContentToParagraphs, createAgendaTable, createLampiranStruktur, base64toBuffer, getHeaderWithLogo, createMetadataTable, createSignatureBlock, base64ToBytes } from './helpers';

export function generateLaporanDocx(data: LaporanData, settings: KKGSettings): Document {
    const createSection = (title: string, content: string) => {
        return [
            createParagraph(title, {
                bold: true,
                alignment: AlignmentType.LEFT,
                spacing: { before: 240, after: 120 }
            }),
            ...parseContentToParagraphs(content || '-', [], settings)
        ];
    };

    const createChapterTitle = (title: string, subtitle?: string) => {
        const els = [
            new Paragraph({ children: [new PageBreak()] }),
            createParagraph(title, {
                bold: true,
                alignment: AlignmentType.CENTER,
                fontSize: FONT_SIZE_HEADER,
                spacing: { before: 240, after: subtitle ? 120 : 360 }
            })
        ];
        if (subtitle) {
            els.push(createParagraph(subtitle, {
                bold: true,
                alignment: AlignmentType.CENTER,
                fontSize: FONT_SIZE_HEADER,
                spacing: { after: 360 }
            }));
        }
        return els;
    };

    return new Document({
        creator: 'Portal Digital KKG Gugus 3 Wanayasa',
        title: data.judul_laporan,
        styles: {
            default: {
                document: {
                    run: { font: FONT_FAMILY, size: FONT_SIZE_NORMAL },
                    paragraph: { spacing: { line: 276 } }, // 1.15 spacing
                },
            },
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.25),
                    },
                    pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
                },
            },
            children: [
                // COVER
                new Paragraph({ spacing: { before: 1440 } }),
                createParagraph('LAPORAN KEGIATAN', { alignment: AlignmentType.CENTER, fontSize: 56, bold: true, spacing: { after: 240 } }),
                createParagraph((data.judul_laporan || '').toUpperCase(), { alignment: AlignmentType.CENTER, fontSize: 36, bold: true, spacing: { after: 240 } }),
                createParagraph(`Periode: ${data.periode || '-'}`, { alignment: AlignmentType.CENTER, fontSize: 28, bold: true, spacing: { after: 720 } }),

                new Paragraph({ spacing: { before: 720 } }),
                createParagraph('KELOMPOK KERJA GURU (KKG) GUGUS 3', { alignment: AlignmentType.CENTER, fontSize: 44, bold: true }),
                createParagraph('KECAMATAN WANAYASA', { alignment: AlignmentType.CENTER, fontSize: 44, bold: true }),
                createParagraph('KABUPATEN PURWAKARTA', { alignment: AlignmentType.CENTER, fontSize: 44, bold: true, spacing: { after: 480 } }),

                // BAB I
                ...createChapterTitle('BAB I', 'PENDAHULUAN'),
                ...createSection('A. Latar Belakang', data.pendahuluan_latar_belakang),
                ...createSection('B. Tujuan', data.pendahuluan_tujuan),
                ...createSection('C. Manfaat', data.pendahuluan_manfaat),

                // BAB II
                ...createChapterTitle('BAB II', 'PELAKSANAAN KEGIATAN'),
                ...createSection('A. Waktu dan Tempat', data.pelaksanaan_waktu_tempat),
                ...createSection('B. Materi Kegiatan', data.pelaksanaan_materi),
                ...createSection('C. Narasumber dan Peserta', data.pelaksanaan_peserta),

                // BAB III
                ...createChapterTitle('BAB III', 'HASIL KEGIATAN'),
                ...createSection('A. Uraian Jalannya Kegiatan', data.hasil_uraian),
                ...createSection('B. Tindak Lanjut', data.hasil_tindak_lanjut),
                ...createSection('C. Dampak', data.hasil_dampak),

                // BAB IV
                ...createChapterTitle('BAB IV', 'PENUTUP'),
                ...createSection('A. Simpulan', data.penutup_simpulan),
                ...createSection('B. Saran', data.penutup_saran),

                // SIGNATURE
                new Paragraph({ children: [new PageBreak()] }),
                ...createSignatureBlock({ created_at: data.created_at || new Date().toISOString() } as any, settings),

                // LAMPIRAN
                new Paragraph({ children: [new PageBreak()] }),
                createParagraph('LAMPIRAN', {
                    bold: true,
                    alignment: AlignmentType.CENTER,
                    fontSize: FONT_SIZE_HEADER,
                    spacing: { before: 240, after: 240 }
                })
            ],
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: 'Laporan Kegiatan KKG - ', font: FONT_FAMILY, size: 20 }),
                                new TextRun({ children: [PageNumber.CURRENT], font: FONT_FAMILY, size: 20 }),
                            ],
                        }),
                    ],
                }),
            },
        }],
    });
}


export async function generateLaporanBuffer(data: LaporanData, settings: KKGSettings): Promise<Uint8Array> {
    try {
        const doc = generateLaporanDocx(data, settings);
        const base64 = await Packer.toBase64String(doc);
        return base64ToBytes(base64);
    } catch (err: any) {
        console.error('generateLaporanBuffer error:', err);
        throw new Error(`Gagal membuat dokumen laporan: ${err.message}`);
    }
}
// ============================================
// RPP (Rencana Pelaksanaan Pembelajaran) DOCX Generator
// ============================================

