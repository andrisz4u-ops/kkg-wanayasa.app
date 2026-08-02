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

export async function generateSuratDocx(data: SuratData, settings: KKGSettings): Promise<Document> {
    // Content parsing moved inside sections to handle Lampiran splitting
    const header = await getHeaderWithLogo(settings);

    const doc = new Document({
        creator: 'Portal Digital KKG Gugus 3 Wanayasa',
        title: `Surat Undangan - ${data.jenis_kegiatan}`,
        description: `Surat undangan untuk ${data.jenis_kegiatan}`,
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
                headers: {
                    default: header,
                },
                children: [
                    // Metadata Table (Nomor, Lampiran, Perihal)
                    createMetadataTable(data),

                    // Body Content (Part 1)
                    ...parseContentToParagraphs(data.isi_surat.split('[LAMPIRAN_STRUKTUR]')[0], [], settings),

                    // Signature Block (Immediately after body)
                    ...createSignatureBlock(data, settings),

                    // Lampiran (if marker exists)
                    ...(data.isi_surat.includes('[LAMPIRAN_STRUKTUR]') ? createLampiranStruktur(settings) : []),
                ],
            },
        ],
    });

    return doc;
}




// ============================================
// Program Kerja Generator
// ============================================


export async function generateSuratBuffer(data: SuratData, settings: KKGSettings): Promise<Uint8Array> {
    try {
        const doc = await generateSuratDocx(data, settings);
        const base64 = await Packer.toBase64String(doc);
        return base64ToBytes(base64);
    } catch (err: any) {
        console.error('generateSuratBuffer error:', err);
        throw new Error(`Gagal membuat dokumen surat: ${err.message}`);
    }
}

