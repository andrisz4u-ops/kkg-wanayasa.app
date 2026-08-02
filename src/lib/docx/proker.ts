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

export function generateProkerDocx(data: ProkerData, settings: KKGSettings): Document {
    // Parse content with kegiatan data for structured table
    const contentElements = parseContentToParagraphs(data.isi_dokumen, data.kegiatan, settings);

    // Create lembar pengesahan
    const lembarPengesahan = createLembarPengesahan(settings, data.created_at);

    const doc = new Document({
        creator: 'Portal Digital KKG Gugus 3 Wanayasa',
        title: `Program Kerja KKG - Tahun Ajaran ${data.tahun_ajaran}`,
        description: `Program Kerja Tahunan KKG Gugus 3 Wanayasa`,
        styles: {
            default: {
                document: {
                    run: {
                        font: FONT_FAMILY,
                        size: FONT_SIZE_NORMAL,
                    },
                    paragraph: {
                        spacing: { line: 276 }, // 1.15 line spacing
                    },
                },
            },
        },
        sections: [
            // Cover Page Section (without page number)
            {
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1.25),
                        },
                    },
                    titlePage: true,
                },
                children: [
                    // Cover Page
                    new Paragraph({ spacing: { before: 1440 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                        children: [
                            new TextRun({
                                text: 'PROGRAM KERJA',
                                font: FONT_FAMILY,
                                size: 56, // 28pt
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: 'KELOMPOK KERJA GURU (KKG)',
                                font: FONT_FAMILY,
                                size: 44, // 22pt
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: 'GUGUS 3 KECAMATAN WANAYASA',
                                font: FONT_FAMILY,
                                size: 44,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 480 },
                        children: [
                            new TextRun({
                                text: 'KABUPATEN PURWAKARTA',
                                font: FONT_FAMILY,
                                size: 44,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({ spacing: { before: 240 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        border: {
                            top: { style: BorderStyle.DOUBLE, size: 6, color: '000000' },
                            bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000' },
                            left: { style: BorderStyle.DOUBLE, size: 6, color: '000000' },
                            right: { style: BorderStyle.DOUBLE, size: 6, color: '000000' },
                        },
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({
                                text: `TAHUN AJARAN ${data.tahun_ajaran}`,
                                font: FONT_FAMILY,
                                size: 40,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({ spacing: { before: 720 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: 'DINAS PENDIDIKAN',
                                font: FONT_FAMILY,
                                size: FONT_SIZE_HEADER,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: 'KABUPATEN PURWAKARTA',
                                font: FONT_FAMILY,
                                size: FONT_SIZE_HEADER,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120 },
                        children: [
                            new TextRun({
                                text: new Date(data.created_at).getFullYear().toString(),
                                font: FONT_FAMILY,
                                size: FONT_SIZE_HEADER,
                            }),
                        ],
                    }),
                ],
            },
            // Lembar Pengesahan Section
            {
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1.25),
                        },
                    },
                },
                children: [...lembarPengesahan],
            },
            // Main Content Section
            {
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1.25),
                        },
                        pageNumbers: {
                            start: 1,
                            formatType: NumberFormat.DECIMAL,
                        },
                    },
                },
                children: [...contentElements],
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: 'Program Kerja KKG Gugus 3 Wanayasa - Halaman ',
                                        font: FONT_FAMILY,
                                        size: 20,
                                    }),
                                    new TextRun({
                                        children: [PageNumber.CURRENT],
                                        font: FONT_FAMILY,
                                        size: 20,
                                    }),
                                ],
                            }),
                        ],
                    }),
                },
            },
        ],
    });

    return doc;
}

// ============================================
// Export to Buffer (Cloudflare Workers compatible)
// ============================================

// Helper: Convert base64 string to Uint8Array (works in all JS runtimes)

export async function generateProkerBuffer(data: ProkerData, settings: KKGSettings): Promise<Uint8Array> {
    try {
        const doc = generateProkerDocx(data, settings);
        const base64 = await Packer.toBase64String(doc);
        return base64ToBytes(base64);
    } catch (err: any) {
        console.error('generateProkerBuffer error:', err);
        throw new Error(`Gagal membuat dokumen proker: ${err.message}`);
    }
}

// ============================================
// Laporan Kegiatan Generator
// ============================================

