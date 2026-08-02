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

const DEFAULT_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Logo_Kabupaten_Purwakarta.png';


export function sanitizeText(text: any): string {
    if (text === null || text === undefined) return '';
    const str = String(text);
    // Remove control characters that are invalid in XML and can cause DOCX corruption
    // This allows: tab (\t), line feed (\n), carriage return (\r)
    return str.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '');
}

export function cleanMarkdownSymbols(text: string): string {
    const sanitized = sanitizeText(text);
    return sanitized
        // Remove bold markers **text** or __text__
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        // Remove italic markers *text* or _text_
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        // Remove headers ###
        .replace(/^#{1,6}\s+/gm, '')
        // Remove bullet markers at start
        .replace(/^[\*\-•]\s+/gm, '• ')
        // Remove markdown links [text](url) -> text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove code backticks
        .replace(/`([^`]+)`/g, '$1')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
}

// Parse markdown text into TextRun array with formatting
export function parseMarkdownToTextRuns(text: string, baseFontSize: number = FONT_SIZE_NORMAL): TextRun[] {
    const sanitizedText = sanitizeText(text);
    const runs: TextRun[] = [];
    let remaining = sanitizedText;

    // Pattern to match bold (**text**) and italic (*text*)
    const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_)/;

    while (remaining.length > 0) {
        const match = remaining.match(pattern);

        if (!match || match.index === undefined) {
            // No more formatting, add remaining as plain text
            if (remaining.trim()) {
                runs.push(new TextRun({
                    text: remaining,
                    font: FONT_FAMILY,
                    size: baseFontSize,
                }));
            }
            break;
        }

        // Add text before the match as plain text
        if (match.index > 0) {
            runs.push(new TextRun({
                text: remaining.substring(0, match.index),
                font: FONT_FAMILY,
                size: baseFontSize,
            }));
        }

        // Determine if it's bold or italic
        const fullMatch = match[0];
        const isBold = fullMatch.startsWith('**') || fullMatch.startsWith('__');
        const content = match[2] || match[3] || match[4] || match[5] || '';

        runs.push(new TextRun({
            text: content,
            font: FONT_FAMILY,
            size: baseFontSize,
            bold: isBold,
            italics: !isBold,
        }));

        // Move past the match
        remaining = remaining.substring(match.index + fullMatch.length);
    }

    return runs.length > 0 ? runs : [new TextRun({ text: text, font: FONT_FAMILY, size: baseFontSize })];
}

// Create paragraph with rich text (markdown parsed)
export function createRichParagraph(text: string, options: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    spacing?: { before?: number; after?: number; line?: number };
    indent?: { left?: number; right?: number; firstLine?: number };
    fontSize?: number;
    color?: string;
    parseMarkdown?: boolean;
} = {}): Paragraph {
    const parseMarkdown = options.parseMarkdown !== false; // Default true

    let children: TextRun[];

    if (parseMarkdown && !options.bold) {
        // Parse markdown formatting
        children = parseMarkdownToTextRuns(text, options.fontSize || FONT_SIZE_NORMAL);
    } else {
        // Use plain text with options
        const cleanedText = cleanMarkdownSymbols(text);
        children = [
            new TextRun({
                text: cleanedText,
                font: FONT_FAMILY,
                size: options.fontSize || FONT_SIZE_NORMAL,
                bold: options.bold,
                italics: options.italic,
                underline: options.underline ? {} : undefined,
                color: options.color,
            }),
        ];
    }

    return new Paragraph({
        alignment: options.alignment || AlignmentType.JUSTIFIED,
        spacing: options.spacing || { after: 120, line: 276 },
        indent: options.indent,
        children: children,
    });
}

export function createParagraph(text: string, options: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    spacing?: { before?: number; after?: number; line?: number };
    indent?: { left?: number; right?: number; firstLine?: number };
    fontSize?: number;
    color?: string;
} = {}): Paragraph {
    // Clean markdown symbols from text
    const cleanedText = cleanMarkdownSymbols(text);

    return new Paragraph({
        alignment: options.alignment || AlignmentType.JUSTIFIED,
        spacing: options.spacing || { after: 120, line: 276 },
        indent: options.indent,
        children: [
            new TextRun({
                text: cleanedText,
                font: FONT_FAMILY,
                size: options.fontSize || FONT_SIZE_NORMAL,
                bold: options.bold,
                italics: options.italic,
                underline: options.underline ? {} : undefined,
                color: options.color,
            }),
        ],
    });
}

// Parse markdown table to DOCX Table
export function parseMarkdownTable(lines: string[]): Table | null {
    if (lines.length < 2) return null;

    const rows: string[][] = [];
    for (const line of lines) {
        if (line.includes('---')) continue; // Skip separator line
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length > 0) {
            rows.push(cells);
        }
    }

    if (rows.length === 0) return null;

    const tableRows = rows.map((row, rowIndex) => {
        const isHeader = rowIndex === 0;
        return new TableRow({
            tableHeader: isHeader,
            children: row.map(cellText => new TableCell({
                shading: isHeader ? { fill: '2E7D32', type: 'clear', color: 'auto' } : undefined,
                margins: {
                    top: convertInchesToTwip(0.05),
                    bottom: convertInchesToTwip(0.05),
                    left: convertInchesToTwip(0.1),
                    right: convertInchesToTwip(0.1),
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: cleanMarkdownSymbols(cellText),
                                font: FONT_FAMILY,
                                size: FONT_SIZE_SMALL,
                                bold: isHeader,
                                color: isHeader ? 'FFFFFF' : '000000',
                            }),
                        ],
                    }),
                ],
            })),
        });
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
    });
}

// Create Kegiatan Table from structured data
export function createKegiatanTable(kegiatan: any[]): Table {
    const headerRow = new TableRow({
        tableHeader: true,
        children: ['No', 'Nama Kegiatan', 'Waktu', 'Penanggung Jawab', 'Anggaran', 'Indikator'].map(text =>
            new TableCell({
                shading: { fill: '1565C0', type: 'clear', color: 'auto' },
                margins: {
                    top: convertInchesToTwip(0.08),
                    bottom: convertInchesToTwip(0.08),
                    left: convertInchesToTwip(0.1),
                    right: convertInchesToTwip(0.1),
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: text,
                                font: FONT_FAMILY,
                                size: FONT_SIZE_SMALL,
                                bold: true,
                                color: 'FFFFFF',
                            }),
                        ],
                    }),
                ],
            })
        ),
    });

    const dataRows = kegiatan.map((k, i) =>
        new TableRow({
            children: [
                createTableCell(String(i + 1), AlignmentType.CENTER),
                createTableCell(k.nama_kegiatan || '-', AlignmentType.LEFT),
                createTableCell(k.waktu_pelaksanaan || '-', AlignmentType.CENTER),
                createTableCell(k.penanggung_jawab || '-', AlignmentType.LEFT),
                createTableCell(k.anggaran || '-', AlignmentType.RIGHT),
                createTableCell(k.indikator || '-', AlignmentType.LEFT),
            ],
        })
    );

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
    });
}

export function createTableCell(text: string, alignment: typeof AlignmentType[keyof typeof AlignmentType]): TableCell {
    return new TableCell({
        margins: {
            top: convertInchesToTwip(0.05),
            bottom: convertInchesToTwip(0.05),
            left: convertInchesToTwip(0.1),
            right: convertInchesToTwip(0.1),
        },
        children: [
            new Paragraph({
                alignment: alignment,
                children: [
                    new TextRun({
                        text: text,
                        font: FONT_FAMILY,
                        size: FONT_SIZE_SMALL,
                    }),
                ],
            }),
        ],
    });
}

// Create Lembar Pengesahan
export function createLembarPengesahan(settings: KKGSettings, createdAt: string): (Paragraph | Table)[] {
    const dateStr = new Date(createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return [
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ spacing: { before: 480 } }),
        createParagraph('LEMBAR PENGESAHAN', {
            bold: true,
            alignment: AlignmentType.CENTER,
            fontSize: FONT_SIZE_TITLE,
            spacing: { after: 480 }
        }),
        createParagraph('PROGRAM KERJA', {
            bold: true,
            alignment: AlignmentType.CENTER,
            fontSize: FONT_SIZE_HEADER,
            spacing: { after: 120 }
        }),
        createParagraph('KELOMPOK KERJA GURU (KKG) GUGUS 3', {
            bold: true,
            alignment: AlignmentType.CENTER,
            fontSize: FONT_SIZE_HEADER,
            spacing: { after: 120 }
        }),
        createParagraph('KECAMATAN WANAYASA KABUPATEN PURWAKARTA', {
            bold: true,
            alignment: AlignmentType.CENTER,
            fontSize: FONT_SIZE_HEADER,
            spacing: { after: 480 }
        }),
        new Paragraph({ spacing: { after: 240 } }),
        createParagraph(`Disahkan di Wanayasa, pada tanggal ${dateStr}`, {
            alignment: AlignmentType.CENTER,
            spacing: { after: 480 }
        }),
        // Signature Table
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        createSignatureCell('Mengetahui,\nKepala UPT Pendidikan\nKec. Wanayasa'),
                        createSignatureCell('Pembina,\nPengawas Sekolah'),
                        createSignatureCell('Ketua KKG Gugus 3\nWanayasa'),
                    ],
                }),
                new TableRow({
                    children: [
                        createSignatureCell('\n\n\n\n'),
                        createSignatureCell('\n\n\n\n'),
                        createSignatureCell('\n\n\n\n'),
                    ],
                }),
                new TableRow({
                    children: [
                        createSignatureCell('_____________________\nNIP. ......................', true),
                        createSignatureCell('_____________________\nNIP. ......................', true),
                        createSignatureCell(settings.nama_ketua ? `${settings.nama_ketua}\nNIP. ......................` : '_____________________\nNIP. ......................', true),
                    ],
                }),
            ],
        }),
    ];
}

export function createSignatureCell(text: string, underline: boolean = false): TableCell {
    const lines = text.split('\n');
    return new TableCell({
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
        },
        children: lines.map((line, idx) =>
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [
                    new TextRun({
                        text: line,
                        font: FONT_FAMILY,
                        size: FONT_SIZE_NORMAL,
                        bold: idx === lines.length - 1 && underline && !line.includes('NIP'),
                        underline: idx === lines.length - 1 && underline && !line.includes('NIP') && !line.includes('_') ? {} : undefined,
                    }),
                ],
            })
        ),
    });
}

// Placeholder for createLampiranStruktur removed (duplicate)

export function parseContentToParagraphs(content: string, kegiatan: Kegiatan[] = [], settings?: KKGSettings): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];
    const lines = content.split('\n');

    let i = 0;
    let tableLines: string[] = [];
    let inTable = false;
    let agendaBuffer: { key: string; value: string }[] = [];

    // Skip any cover page content that AI might have written at the BEGINNING
    // (Cover page is generated separately by the system)
    // Only skip the first few lines that match cover page patterns
    let skippedCoverLines = 0;
    const maxCoverLinesToSkip = 15; // Maximum lines to check for cover content

    while (i < lines.length && skippedCoverLines < maxCoverLinesToSkip) {
        const trimmed = lines[i].trim().toUpperCase();

        // Skip empty lines at the very beginning
        if (trimmed === '' && skippedCoverLines === 0) {
            i++;
            continue;
        }

        // Check if this line looks like cover page content
        const isCoverContent = (
            trimmed === 'PROGRAM KERJA' ||
            trimmed === 'PROGRAM KERJA TAHUNAN' ||
            trimmed.startsWith('KELOMPOK KERJA GURU') ||
            trimmed.startsWith('KKG GUGUS') ||
            trimmed.startsWith('GUGUS 3') ||
            trimmed.startsWith('KECAMATAN WANAYASA') ||
            trimmed.startsWith('KABUPATEN PURWAKARTA') ||
            trimmed.match(/^TAHUN\s+(AJARAN|PELAJARAN)/i) !== null ||
            trimmed.match(/^\d{4}\/\d{4}$/) !== null ||
            trimmed === 'DINAS PENDIDIKAN'
        );

        if (isCoverContent) {
            skippedCoverLines++;
            i++;
            continue;
        }

        // Found actual content (like KATA PENGANTAR), stop skipping
        break;
    }

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Detect table start
        if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
            inTable = true;
            tableLines.push(trimmedLine);
            i++;
            continue;
        }

        // End of table
        if (inTable && !trimmedLine.startsWith('|')) {
            const table = parseMarkdownTable(tableLines);
            if (table) {
                elements.push(table);
            }
            tableLines = [];
            inTable = false;
        }

        if (!trimmedLine) {
            elements.push(new Paragraph({ spacing: { after: 0 } }));
            i++;
            continue;
        }
        // Check for special markers
        if (trimmedLine === '[TABEL_KEGIATAN]' && kegiatan && kegiatan.length > 0) {
            // Flush agenda buffer if needed
            if (agendaBuffer.length > 0) {
                elements.push(createAgendaTable(agendaBuffer));
                agendaBuffer = [];
            }
            elements.push(createKegiatanTable(kegiatan));
            i++;
            continue;
        }

        // Agenda Detection Logic
        const cleanedLine = cleanMarkdownSymbols(trimmedLine);
        const agendaMatch = cleanedLine.match(/^(Hari\/Tanggal|Waktu|Tempat|Acara|Agenda)\s*[:]\s*(.*)$/i);

        if (agendaMatch) {
            let key = agendaMatch![1];
            const value = agendaMatch[2];

            // Normalize Key Case
            key = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
            if (key.toLowerCase() === 'hari/tanggal') key = 'Hari/Tanggal'; // Special Case

            agendaBuffer.push({ key, value });
            i++;
            continue;
        } else if (agendaBuffer.length > 0) {
            // End of agenda block, flush it
            elements.push(createAgendaTable(agendaBuffer));
            agendaBuffer = [];
        }

        if (trimmedLine === '[LAMPIRAN_STRUKTUR]') {
            elements.push(...createLampiranStruktur(settings || {}));
            i++;
            continue;
        }

        if (trimmedLine === '[TABEL_RAB]') {
            // Skip RAB marker, AI should generate actual table
            i++;
            continue;
        }

        // Section markers (---)
        if (trimmedLine === '---') {
            i++;
            continue;
        }

        // IMPORTANT: Detect Table of Contents entries FIRST (before BAB headers)
        // Format: Title ... page or Title ..... page (with dots)
        const tocMatch = trimmedLine.match(/^(.+?)\s*\.{3,}\s*(\d+|[ivxIVX]+)$/);
        if (tocMatch) {
            const tocTitle = cleanMarkdownSymbols(tocMatch[1].trim());
            const tocPage = tocMatch[2];

            // Determine if it's a main BAB entry or sub-entry
            const isBabEntry = tocTitle.match(/^BAB\s+[IVX\d]+/i);
            const isSubEntry = tocTitle.match(/^\s*[A-Z]\.\s+/) || tocTitle.startsWith('    ');

            // Create TOC entry with tab stop and leader
            elements.push(new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { after: 60 },
                indent: isSubEntry ? { left: convertInchesToTwip(0.3) } : undefined,
                tabStops: [
                    {
                        type: TabStopType.RIGHT,
                        position: convertInchesToTwip(6),
                        leader: LeaderType.DOT,
                    }
                ],
                children: [
                    new TextRun({
                        text: tocTitle.trim(),
                        font: FONT_FAMILY,
                        size: FONT_SIZE_NORMAL,
                        bold: isBabEntry ? true : false,
                    }),
                    new TextRun({
                        text: '\t' + tocPage,
                        font: FONT_FAMILY,
                        size: FONT_SIZE_NORMAL,
                        bold: isBabEntry ? true : false,
                    }),
                ],
            }));
            i++;
            continue;
        }

        // BAB headers - add page break before each BAB (only for actual headers, not TOC entries)
        if (trimmedLine.match(/^BAB\s+[IVX\d]+/i) && !trimmedLine.includes('...')) {
            // Add page break before BAB
            elements.push(new Paragraph({ children: [new PageBreak()] }));
            elements.push(createParagraph(cleanMarkdownSymbols(trimmedLine), {
                bold: true,
                alignment: AlignmentType.CENTER,
                fontSize: FONT_SIZE_HEADER,
                spacing: { before: 480, after: 120 }
            }));

            // Check if next line is the BAB title (like PENDAHULUAN)
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine && !nextLine.match(/^[A-Z]\.\s+/) && !nextLine.match(/^BAB\s+/) &&
                    !nextLine.match(/^\d+\./) && nextLine === nextLine.toUpperCase() && nextLine.length < 50) {
                    // This is the BAB subtitle
                    elements.push(createParagraph(cleanMarkdownSymbols(nextLine), {
                        bold: true,
                        alignment: AlignmentType.CENTER,
                        fontSize: FONT_SIZE_HEADER,
                        spacing: { after: 360 }
                    }));
                    i += 2;
                    continue;
                }
            }
            i++;
            continue;
        }

        // Sub-section headers (KATA PENGANTAR, DAFTAR ISI, LEMBAR PENGESAHAN, etc.)
        if (trimmedLine.match(/^(KATA PENGANTAR|DAFTAR ISI|LEMBAR PENGESAHAN|LAMPIRAN)$/i)) {
            elements.push(new Paragraph({ children: [new PageBreak()] }));
            elements.push(createParagraph(cleanMarkdownSymbols(trimmedLine), {
                bold: true,
                alignment: AlignmentType.CENTER,
                fontSize: FONT_SIZE_HEADER,
                spacing: { before: 240, after: 240 }
            }));
            i++;
            continue;
        }

        // Sub-BAB headers (A. B. C.)
        if (trimmedLine.match(/^[A-Z]\.\s+/)) {
            elements.push(createParagraph(cleanMarkdownSymbols(trimmedLine), {
                bold: true,
                alignment: AlignmentType.LEFT,
                spacing: { before: 240, after: 120 }
            }));
            i++;
            continue;
        }

        // Numbered list
        if (trimmedLine.match(/^\d+\.\s+/)) {
            elements.push(createParagraph(cleanMarkdownSymbols(trimmedLine), {
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: convertInchesToTwip(0.3) },
                spacing: { after: 80 }
            }));
            i++;
            continue;
        }

        // Bullet list
        if (trimmedLine.match(/^[-•]\s+/)) {
            elements.push(createParagraph(cleanMarkdownSymbols(trimmedLine), {
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: convertInchesToTwip(0.5) },
                spacing: { after: 80 }
            }));
            i++;
            continue;
        }

        // Indented sub-items
        if (trimmedLine.match(/^\s+[-•]\s+/) || line.match(/^\s{3,}/)) {
            elements.push(createParagraph(cleanMarkdownSymbols(trimmedLine), {
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: convertInchesToTwip(0.75) },
                spacing: { after: 80 }
            }));
            i++;
            continue;
        }

        // Normal paragraph
        elements.push(createParagraph(cleanMarkdownSymbols(trimmedLine), {
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 60, line: 276 }
        }));
        i++;
    }

    // Handle remaining table lines
    if (tableLines.length > 0) {
        const table = parseMarkdownTable(tableLines);
        if (table) {
            elements.push(table);
        }
    }

    // Handle remaining agenda buffer
    if (agendaBuffer.length > 0) {
        elements.push(createAgendaTable(agendaBuffer));
    }

    return elements;
}

// Helper to create Agenda Table (Key : Value aligned)
export function createAgendaTable(agendaItems: { key: string; value: string }[]): Table {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
        },
        rows: agendaItems.map((item, index) => {
            const isLast = index === agendaItems.length - 1;
            // Add extra spacing after the last item to separate from "Kehadiran..."
            const spacing = isLast ? { after: 240, line: 276 } : { after: 60, line: 276 };

            return new TableRow({
                children: [
                    new TableCell({
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [createParagraph(item.key, { spacing: spacing })],
                    }),
                    new TableCell({
                        width: { size: 2, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [createParagraph(":", { spacing: spacing, alignment: AlignmentType.CENTER })],
                    }),
                    new TableCell({
                        width: { size: 73, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [createParagraph(item.value, { spacing: spacing })],
                    }),
                ],
            });
        }),
    });
}

// Helper to create Organizational Structure Attachment
export function createLampiranStruktur(settings: KKGSettings): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];

    // Page Break & Header
    elements.push(new Paragraph({
        children: [new PageBreak()],
    }));
    elements.push(createParagraph('LAMPIRAN', {
        bold: true,
        alignment: AlignmentType.CENTER,
        fontSize: FONT_SIZE_HEADER,
        spacing: { after: 120 }
    }));
    elements.push(createParagraph('STRUKTUR ORGANISASI KKG GUGUS 3 WANAYASA', {
        bold: true,
        alignment: AlignmentType.CENTER,
        fontSize: FONT_SIZE_TITLE,
        spacing: { after: 360 }
    }));

    // TABLE 1: PENGURUS INTI
    elements.push(createParagraph('A. PENGURUS INTI', {
        bold: true,
        alignment: AlignmentType.LEFT,
        fontSize: FONT_SIZE_NORMAL,
        spacing: { after: 120 }
    }));

    const intiData = [
        // Pembina & Ketua Gugus 3 removed as requested
        ['Ketua KKG Gugus', 'Maman Rukman, S.Pd'],
        ['Sekretaris', 'Andris Hadiansyah, S.Pd'],
        ['Bendahara', 'Reny Srimulyani A, S.Pd'],
        ['Sarana Prasarana', "Ulfa Laiza Ul'ul, S.Pd"],
        ['Humas', 'Harun, S.Pd'],
    ];

    const intiRows = intiData.map(row =>
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({ text: row[0], spacing: { after: 60 } })],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: row[1], bold: true, font: FONT_FAMILY, size: FONT_SIZE_NORMAL })],
                        spacing: { after: 60 }
                    })],
                    width: { size: 60, type: WidthType.PERCENTAGE },
                }),
            ],
        })
    );

    // Unsafe modification removed. Bold applied directly above.


    elements.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: intiRows,
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
        }
    }));

    elements.push(new Paragraph({ spacing: { after: 360 } }));

    // TABLE 2: GURU PENDAMPING
    elements.push(createParagraph('B. GURU PENDAMPING KELAS', {
        bold: true,
        alignment: AlignmentType.LEFT,
        fontSize: FONT_SIZE_NORMAL,
        spacing: { after: 120 }
    }));

    const pendampingData = [
        ['1', 'Kelas 1', 'Lena Marlina, S.Pd', 'SDN Nagrog'],
        ['2', 'Kelas 2', 'Ade Setiawati, S.Pd', 'SDN 2 Nangerang'],
        ['3', 'Kelas 3', 'Tuti Sutiawati, S.Pd', 'SDIT Al-Qalam'],
        ['4', 'Kelas 4', 'Nur', 'SDN 2 Cibuntu'],
        ['5', 'Kelas 5', 'Ujang Aip, S.Pd', 'SDN Sakambang'],
        ['6', 'Kelas 6', 'Eti Sumiati, S.Pd', 'SDN 1 Cibuntu'],
        ['7', 'KKGA', 'Soleh Muslim, S.Pd.I', 'SDN 1 Cibuntu'],
        ['8', 'KKGO', 'Ahmad, S.Pd', 'SDN 1 Nangerang'],
    ];

    const pendampingRows = [
        new TableRow({
            tableHeader: true,
            children: [
                { text: 'No', width: 5 },
                { text: 'Kelas/Jabatan', width: 20 },
                { text: 'Nama', width: 35 },
                { text: 'Sekolah', width: 40 }
            ].map(col =>
                new TableCell({
                    width: { size: col.width, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                        children: [new TextRun({ text: col.text, bold: true, font: FONT_FAMILY, size: FONT_SIZE_NORMAL })],
                        alignment: AlignmentType.CENTER
                    })],
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: "E0E0E0" }
                })
            )
        }),
        ...pendampingData.map(row =>
            new TableRow({
                children: [
                    new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: row[0], alignment: AlignmentType.CENTER })] }),
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: row[1] })] }),
                    new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: row[2], bold: true })] })] }),
                    new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: row[3] })] }),
                ],
            })
        )
    ];

    elements.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: pendampingRows,
    }));

    return elements;
}

// Duplicate interfaces removed


import { LOGO_KKG_BASE64, LOGO_PEMDA_BASE64 } from '../logos';

// Helper function to decode Base64 string to Uint8Array (Node.js & Browser compatible)
export function base64toBuffer(base64: string): Uint8Array {
    if (typeof atob === 'undefined') {
        return new Uint8Array(Buffer.from(base64, 'base64'));
    }
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

export async function getHeaderWithLogo(settings: KKGSettings): Promise<Header> {
    // 1. Prepare Logo Buffers
    let pemdaBuffer: Uint8Array | null = null;
    let kkgBuffer: Uint8Array | null = null;

    try {
        if (LOGO_PEMDA_BASE64) {
            pemdaBuffer = base64toBuffer(LOGO_PEMDA_BASE64);
        }
        if (LOGO_KKG_BASE64) {
            kkgBuffer = base64toBuffer(LOGO_KKG_BASE64);
        }
    } catch (e) {
        console.error('Failed to process logos:', e);
    }

    // 2. Prepare Header Text
    const titleText = [
        { text: 'PEMERINTAH KABUPATEN PURWAKARTA', size: 24, bold: true }, // 12pt
        { text: 'DINAS PENDIDIKAN', size: 28, bold: true }, // 14pt (Main Title)
        { text: 'KELOMPOK KERJA GURU (KKG) GUGUS 3', size: 24, bold: true }, // 12pt
        { text: 'KECAMATAN WANAYASA', size: 24, bold: true }, // 12pt
        { text: settings.alamat_sekretariat || 'Kp peuntas Rt 08/03 Desa Nangerang, Kec. Wanayasa, Kab. Purwakarta', size: 22, bold: false, italic: true }, // 11pt
    ];

    const imageSize = { width: 70, height: 80 };

    return new Header({
        children: [
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    bottom: { style: BorderStyle.THICK, size: 24, color: "000000" },
                    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
                },
                rows: [
                    new TableRow({
                        children: [
                            // LEFT COLUMN: Logo Pemda
                            new TableCell({
                                width: { size: 15, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: pemdaBuffer ? [
                                            new ImageRun({
                                                data: pemdaBuffer,
                                                transformation: imageSize,
                                                type: 'png',
                                            })
                                        ] : [],
                                    }),
                                ],
                                borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } },
                            }),
                            // CENTER COLUMN: Teks
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: titleText.map(t => new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 0, before: 0 },
                                    children: [
                                        new TextRun({
                                            text: t.text,
                                            font: FONT_FAMILY,
                                            size: t.size,
                                            bold: t.bold,
                                            italics: t.italic,
                                        }),
                                    ],
                                })),
                                borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } },
                            }),
                            // RIGHT COLUMN: Logo KKG
                            new TableCell({
                                width: { size: 15, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: kkgBuffer ? [
                                            new ImageRun({
                                                data: kkgBuffer,
                                                transformation: imageSize,
                                                type: 'png',
                                            })
                                        ] : [],
                                    }),
                                ],
                                borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } },
                            }),
                        ],
                    }),
                ],
            }),
            new Paragraph({ spacing: { after: 240 } }), // Spacing after header
        ],
    });
}

// Helper function to create the metadata table (Nomor, Lampiran, Perihal) using 3 columns
export function createMetadataTable(data: SuratData): Table {
    const commonBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
        },
        rows: [
            // Row 1: Nomor
            new TableRow({
                children: [
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: commonBorders, children: [createParagraph('Nomor', { spacing: { after: 0 } })] }),
                    new TableCell({ width: { size: 2, type: WidthType.PERCENTAGE }, borders: commonBorders, children: [createParagraph(':', { spacing: { after: 0 }, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ width: { size: 83, type: WidthType.PERCENTAGE }, borders: commonBorders, children: [createParagraph(data.nomor_surat, { spacing: { after: 0 } })] }),
                ]
            }),
            // Row 2: Lampiran
            new TableRow({
                children: [
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: commonBorders, children: [createParagraph('Lampiran', { spacing: { after: 0 } })] }),
                    new TableCell({ width: { size: 2, type: WidthType.PERCENTAGE }, borders: commonBorders, children: [createParagraph(':', { spacing: { after: 0 }, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ width: { size: 83, type: WidthType.PERCENTAGE }, borders: commonBorders, children: [createParagraph('-', { spacing: { after: 0 } })] }),
                ]
            }),
            // Row 3: Perihal
            new TableRow({
                children: [
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: commonBorders, children: [createParagraph('Perihal', { spacing: { after: 240 } })] }),
                    new TableCell({ width: { size: 2, type: WidthType.PERCENTAGE }, borders: commonBorders, children: [createParagraph(':', { spacing: { after: 240 }, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ width: { size: 83, type: WidthType.PERCENTAGE }, borders: commonBorders, children: [createParagraph(`Undangan ${data.jenis_kegiatan}`, { bold: true, spacing: { after: 240 } })] }),
                ]
            }),
        ],
    });
}

// Helper function to create the signature block
export function createSignatureBlock(data: SuratData, settings: KKGSettings): (Paragraph | Table)[] {
    const dateStr = `Wanayasa, ${new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    return [
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 60, type: WidthType.PERCENTAGE },
                            children: []
                        }),
                        new TableCell({
                            width: { size: 40, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({ text: dateStr, font: FONT_FAMILY, size: FONT_SIZE_NORMAL }),
                                    ],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({ text: 'Ketua KKG Gugus 3 Wanayasa', font: FONT_FAMILY, size: FONT_SIZE_NORMAL }),
                                    ],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 720 }, // Reduced space
                                    children: [
                                        new TextRun({
                                            text: settings.nama_ketua || data.penanggung_jawab || 'H. UJANG MA\'MUN, S.Pd.I',
                                            font: FONT_FAMILY,
                                            size: FONT_SIZE_NORMAL,
                                            bold: true,
                                            underline: {},
                                        }),
                                    ],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: settings.nip_ketua ? `NIP. ${settings.nip_ketua}` : 'NIP. ................................',
                                            font: FONT_FAMILY,
                                            size: FONT_SIZE_SMALL
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
        // Add Tembusan Section
        new Paragraph({ spacing: { before: 240 } }),
        new Paragraph({
            children: [new TextRun({ text: 'Tembusan:', font: FONT_FAMILY, size: FONT_SIZE_SMALL, underline: {} })],
        }),
        new Paragraph({
            children: [new TextRun({ text: '1. Pengawas Pembina Gugus 3', font: FONT_FAMILY, size: FONT_SIZE_SMALL })],
        }),
        new Paragraph({
            children: [new TextRun({ text: '2. Ketua Gugus 3', font: FONT_FAMILY, size: FONT_SIZE_SMALL })],
        }),
    ];
}

// ============================================
// Surat Generator
// ============================================


export function base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

