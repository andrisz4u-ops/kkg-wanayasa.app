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

export function createRppCell(
    content: string | (Paragraph | Table)[],
    options: {
        width?: number;
        bold?: boolean;
        shading?: string;
        alignment?: typeof AlignmentType[keyof typeof AlignmentType];
        vAlign?: 'top' | 'center' | 'bottom';
        colspan?: number;
    } = {}
): TableCell {
    const children: (Paragraph | Table)[] = typeof content === 'string'
        ? [new Paragraph({
            alignment: options.alignment || AlignmentType.LEFT,
            spacing: { after: 60, line: 276 },
            children: [new TextRun({
                text: String(content),
                font: FONT_FAMILY,
                size: FONT_SIZE_SMALL,
                bold: options.bold,
                color: '000000',
            })],
        })]
        : content;

    return new TableCell({
        width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
        columnSpan: options.colspan,
        shading: options.shading ? { fill: options.shading, type: 'clear', color: 'auto' } : undefined,
        verticalAlign: options.vAlign || VerticalAlign.TOP,
        margins: {
            top: convertInchesToTwip(0.05),
            bottom: convertInchesToTwip(0.05),
            left: convertInchesToTwip(0.1),
            right: convertInchesToTwip(0.1),
        },
        children,
    });
}

// Helper to format complex structures (like AI-generated Frage/Soal JSON) into readable text
export function formatComplexText(text: any): string {
    if (text === null || text === undefined) return '';
    
    // If it's an object or array, try to format questions/soal
    if (typeof text === 'object') {
        const soalArray = text.soal || (Array.isArray(text) ? text : null);
        if (Array.isArray(soalArray) && soalArray.length > 0) {
            const firstItem = soalArray[0];
            if (firstItem && (firstItem.pertanyaan || firstItem.question || firstItem.soal)) {
                return soalArray.map((s: any, idx: number) => {
                    const qNum = s.nomor || (idx + 1);
                    const qText = s.pertanyaan || s.question || s.soal || '';
                    let sStr = `${qNum}. ${qText}`;
                    if (s.pilihan && Array.isArray(s.pilihan)) {
                        sStr += '\n   ' + s.pilihan.map((p: any) => String(p)).join('\n   ');
                    } else if (s.options && Array.isArray(s.options)) {
                        sStr += '\n   ' + s.options.map((o: any) => String(o)).join('\n   ');
                    }
                    return sStr;
                }).join('\n');
            }
        }
        
        // General fallbacks for narrative fields that might be returned as objects
        if (text.isi && typeof text.isi === 'string') return text.isi;
        if (text.text && typeof text.text === 'string') return text.text;
        if (text.deskripsi && typeof text.deskripsi === 'string') return text.deskripsi;

        // Handle metode_pembelajaran object structure from AI
        // Format: { strategi_utama: "...", profil_lulusan: { keimanan_ketakwaan: "...", ... } }
        // Or Format: { strategi: "Discovery Learning", langkah_langkah: [...] }
        if (typeof text === 'object' && text !== null && !Array.isArray(text)) {
            const parts: string[] = [];
            
            if (text.strategi_utama && typeof text.strategi_utama === 'string') {
                parts.push(text.strategi_utama);
            }
            if (text.strategi && typeof text.strategi === 'string') {
                parts.push(`**Strategi:** ${text.strategi}`);
            }
            if (text.langkah_langkah && Array.isArray(text.langkah_langkah)) {
                parts.push(`**Langkah-langkah:**`);
                text.langkah_langkah.forEach((l: any) => parts.push(`- ${l}`));
            }

            if (text.profil_lulusan && typeof text.profil_lulusan === 'object') {
                const pl = text.profil_lulusan;
                const labelMap: Record<string, string> = {
                    keimanan_ketakwaan: 'Keimanan & Ketakwaan',
                    penalaran_kritis: 'Penalaran Kritis',
                    kolaborasi: 'Kolaborasi',
                    komunikasi: 'Komunikasi',
                    kreativitas: 'Kreativitas',
                    kebhinnekaan: 'Kebhinnekaan Global',
                    mandiri: 'Mandiri',
                };
                for (const [key, val] of Object.entries(pl)) {
                    if (typeof val === 'string' && val.trim()) {
                        const label = labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        parts.push(`**${label}:** ${val}`);
                    }
                }
            }
            
            // Also handle any other keys at top level
            const knownKeys = new Set(['strategi_utama', 'profil_lulusan', 'strategi', 'langkah_langkah', 'isi', 'text', 'deskripsi']);
            for (const [key, val] of Object.entries(text)) {
                if (!knownKeys.has(key)) {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    if (typeof val === 'string' && val.trim()) {
                        parts.push(`**${label}:** ${val}`);
                    } else if (Array.isArray(val) && val.every(i => typeof i === 'string')) {
                        parts.push(`**${label}:**`);
                        val.forEach((item: any) => parts.push(`- ${item}`));
                    }
                }
            }
            if (parts.length > 0) return parts.join('\n');
        }
        
        // Handle simple arrays of strings
        if (Array.isArray(text) && text.every(i => typeof i === 'string')) {
            return text.join('\n');
        }

        return JSON.stringify(text, null, 2);
    }

    if (typeof text === 'string') {
        const trimmed = text.trim();
        // Check if string contains "soal:" followed by JSON
        if (trimmed.toLowerCase().includes('soal:') && (trimmed.includes('[') || trimmed.includes('{'))) {
            try {
                const match = trimmed.match(/soal:?\s*(\[[\s\S]*\]|\{[\s\S]*\})/i);
                if (match) {
                    const parsed = JSON.parse(match[1]);
                    return formatComplexText(parsed);
                }
            } catch (e) { /* fall back to normal string */ }
        }
        // Check if full string is JSON
        if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && (trimmed.endsWith('}') || trimmed.endsWith(']'))) {
            try {
                const parsed = JSON.parse(trimmed);
                return formatComplexText(parsed);
            } catch (e) { /* fall back to normal string */ }
        }
    }

    return String(text);
}

// Helper: parse text lines into Paragraphs (handles bullets, numbered lists)
export function parseRppText(text: any, fontColor: string = '000000'): Paragraph[] {
    if (!text) return [new Paragraph({ children: [new TextRun({ text: '-', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })];

    const stringText = formatComplexText(text);

    const cleaned = stringText.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '');
    const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length === 0) return [new Paragraph({ children: [new TextRun({ text: '-', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })];

    return lines.map(line => {
        const isBullet = line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ');
        const isNumbered = /^\d+\./.test(line);

        let displayText = line;
        let indent = 0;

        if (isBullet) {
            displayText = '• ' + line.replace(/^[-•*]\s+/, '');
            indent = convertInchesToTwip(0.25);
        } else if (isNumbered) {
            indent = convertInchesToTwip(0.25);
        }

        const parts = displayText.split(/(\*\*[^*]+\*\*)/g);
        const runs: TextRun[] = parts.map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return new TextRun({
                    text: String(part.slice(2, -2)),
                    font: FONT_FAMILY,
                    size: FONT_SIZE_SMALL,
                    bold: true,
                    color: fontColor,
                });
            }
            return new TextRun({ text: String(part), font: FONT_FAMILY, size: FONT_SIZE_SMALL, color: fontColor });
        });

        return new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 60, line: 276 },
            indent: indent ? { left: indent, hanging: indent } : undefined,
            children: runs,
        });
    });
}

// Build the RPP DOCX document
export async function generateRppDocx(
    inputData: RppInputData,
    content: RppContentData,
    settings: KKGSettings,
    lampiran?: any
): Promise<Document> {
    const id = content.identifikasi || {};
    const ds = content.desain || {};
    const sp = ds.sarana_prasarana || {};
    const dif = ds.diferensiasi || {};
    const pertemuan = content.pertemuan || [];
    const asesmen = content.asesmen || {};

    let tahunGanjil = new Date().getFullYear().toString();
    let tahunGenap = tahunGanjil;
    
    // Gunakan tahun ajaran dari input form jika ada, jika tidak fallback ke settings
    const tahunAjaranValue = inputData.tahunAjaran || settings.tahun_ajaran;
    
    if (tahunAjaranValue && tahunAjaranValue.includes('/')) {
        const parts = tahunAjaranValue.split('/');
        tahunGanjil = parts[0].trim();
        tahunGenap = parts[1] ? parts[1].trim() : parts[0].trim();
    }
    
    const isGanjil = inputData.semester && inputData.semester.toLowerCase().includes('ganjil');
    const bulanStr = isGanjil ? 'Juli' : 'Januari';
    const tahunStr = isGanjil ? tahunGanjil : tahunGenap;
    
    let tanggalStr = `..................... ${bulanStr} ${tahunStr}`;

    let profilStr = Array.isArray(inputData.profilLulusan) 
        ? inputData.profilLulusan.join(', ') 
        : inputData.profilLulusan || '-';

    const renderTwoCols = (label: string, value: string) => {
        return new TableRow({
            children: [
                new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.12), right: convertInchesToTwip(0.08) },
                    children: [new Paragraph({ children: [new TextRun({ text: String(label), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })],
                }),
                new TableCell({
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: 0, right: 0 },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ':', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })],
                }),
                new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.12), right: convertInchesToTwip(0.12) },
                    children: [new Paragraph({ children: [new TextRun({ text: String(value || '-'), font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })],
                }),
            ]
        });
    };

    const sectionTitle = (title: string) => new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: String(title), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })]
    });

    const kopSuratContent: (Paragraph | Table)[] = [];
    if (settings.kop_surat_url) {
        try {
            const resp = await fetch(settings.kop_surat_url);
            if (resp.ok) {
                const arrBuf = await resp.arrayBuffer();
                let typeStr = resp.headers.get('content-type') || 'image/png';
                const imageType = typeStr.includes('jpeg') || typeStr.includes('jpg') ? 'jpg' : 'png';
                kopSuratContent.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 0 },
                    children: [
                        new ImageRun({
                            data: arrBuf,
                            transformation: { width: 650, height: 125 },
                            type: imageType as any,
                        })
                    ]
                }));
                kopSuratContent.push(new Paragraph({
                    spacing: { after: 80 },
                    border: {
                        bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000', space: 2 }
                    },
                    children: []
                }));
            }
        } catch (e) { }
    }

    if (kopSuratContent.length === 0) {
        let orgName = settings.nama_organisasi || settings.alamat_sekretariat?.split('\n')[0]?.trim() || 'KELOMPOK KERJA GURU (KKG)';
        let orgAddress = settings.alamat_sekretariat?.split('\n').slice(1).join(' | ').trim() || settings.alamat_sekretariat || '';
        
        kopSuratContent.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000' },
                left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.08), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 0 },
                                    children: [new TextRun({ text: String(orgName), font: FONT_FAMILY, size: 28, bold: true })]
                                }),
                                ...(orgAddress ? [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { after: 0 },
                                        children: [new TextRun({ text: String(orgAddress), font: FONT_FAMILY, size: 20 })]
                                    })
                                ] : [])
                            ]
                        })
                    ]
                })
            ]
        }));
        kopSuratContent.push(new Paragraph({ spacing: { after: 60 } }));
    }

    const judulSection: (Paragraph | Table)[] = [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [new TextRun({ text: 'RENCANA PELAKSANAAN PEMBELAJARAN (RPP)', font: FONT_FAMILY, size: FONT_SIZE_HEADER, bold: true, underline: {} })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'KURIKULUM MERDEKA', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })],
        }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                renderTwoCols('Satuan Pendidikan', inputData.namaSekolah),
                renderTwoCols('Nama Guru', inputData.namaGuru),
                renderTwoCols('Mata Pelajaran', inputData.mataPelajaran),
                renderTwoCols('Topik / Materi Pokok', inputData.topik),
                renderTwoCols('Kelas / Semester', `${inputData.jenjangKelas} / ${inputData.semester}`),
                renderTwoCols('Alokasi Waktu', inputData.alokasiWaktu),
                renderTwoCols('Jumlah Pertemuan', `${inputData.jumlahPertemuan} Pertemuan`),
            ]
        }),
        new Paragraph({ spacing: { after: 80 } }),
    ];

    const identifikasiSection: (Paragraph | Table)[] = [
        new Paragraph({
            spacing: { before: 160, after: 120 },
            shading: { fill: '1E293B', type: 'clear', color: 'auto' },
            children: [new TextRun({ text: 'I. IDENTIFIKASI', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, color: 'FFFFFF' })],
        }),
        new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: 'A. Analisis Kesiapan Murid', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, underline: {}, color: '1E40AF' })],
        }),
        ...parseRppText(id.kesiapan || '-'),
        new Paragraph({ spacing: { after: 80 } }),
        new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: 'B. Karakteristik Murid', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, underline: {}, color: '1E40AF' })],
        }),
        ...parseRppText(id.karakteristik || '-'),
        new Paragraph({ spacing: { after: 80 } }),
        new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: 'C. Kebutuhan Murid', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, underline: {}, color: '1E40AF' })],
        }),
        ...parseRppText(id.kebutuhan || '-'),
        new Paragraph({ spacing: { after: 80 } }),
    ];

    const desainSection: (Paragraph | Table)[] = [
        new Paragraph({
            spacing: { before: 160, after: 120 },
            shading: { fill: '1E293B', type: 'clear', color: 'auto' },
            children: [new TextRun({ text: 'II. DESAIN PEMBELAJARAN', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, color: 'FFFFFF' })],
        }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                ...([
                    { label: 'Capaian Pembelajaran (CP)', value: ds.capaian || '-' },
                    { label: 'Strategi Pembelajaran', value: inputData.strategi || '-' },
                    { label: 'Metode Relevan', value: ds.metode_relevan || ds.metode_pembelajaran || '-' },
                    { label: '1. Metode Pembelajaran', value: ds.metode_pembelajaran || '-' },
                    { label: '2. Sarana dan Prasarana', value: `Sumber Belajar: ${sp.sumber_belajar || '-'}\nMedia: ${sp.media || '-'}\nAlat Peraga: ${sp.alat_peraga || '-'}` },
                    { label: '3. Dimensi Profil Lulusan', value: profilStr || '-' },
                    { label: '4. Diferensiasi Pembelajaran', value: `Visual: ${dif.visual || '-'}\nAuditori: ${dif.auditori || '-'}\nKinestetik: ${dif.kinestetik || '-'}` },
                ].map(row => new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 33, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F8FAFC', type: 'clear', color: 'auto' },
                            margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                            verticalAlign: VerticalAlign.TOP,
                            children: [new Paragraph({ children: [new TextRun({ text: String(row.label), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })],
                        }),
                        new TableCell({
                            width: { size: 67, type: WidthType.PERCENTAGE },
                            margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                            verticalAlign: VerticalAlign.TOP,
                            children: parseRppText(row.value),
                        }),
                    ]
                })))
            ]
        }),
        new Paragraph({ spacing: { after: 80 } }),
    ];

    const skenarioSection: (Paragraph | Table)[] = [
        new Paragraph({
            spacing: { before: 160, after: 120 },
            shading: { fill: '1E293B', type: 'clear', color: 'auto' },
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'III. PENGALAMAN BELAJAR', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, color: 'FFFFFF' })],
        }),
    ];

    const phaseColors: any = {
        pendahuluan: 'EFF6FF',
        mindful: 'FEFCE8',
        meaningful: 'F0FDF4',
        joyful: 'EEF2FF',
        penutup: 'F8FAFC',
    };
    const phaseLabels: any = {
        pendahuluan: 'PENDAHULUAN',
        mindful: 'BERKESADARAN\n(Mindful)',
        meaningful: 'BERMAKNA\n(Meaningful)',
        joyful: 'GEMBIRA\n(Joyful)',
        penutup: 'PENUTUP',
    };

    pertemuan.forEach((p, idx) => {
        const k = p.kegiatan || {};
        const tuj = p.tujuan_pertemuan || p.tujuan || [];

        skenarioSection.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: '1a1a1a' },
                left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F8FAFC', type: 'clear', color: 'auto' },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.08), right: convertInchesToTwip(0.08) },
                            children: [new Paragraph({ children: [new TextRun({ text: `Pertemuan Ke-${p.nomor || idx + 1}`, font: FONT_FAMILY, size: FONT_SIZE_HEADER, bold: true })] })],
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F8FAFC', type: 'clear', color: 'auto' },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.08), right: convertInchesToTwip(0.08) },
                            children: [new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [new TextRun({ text: 'Prinsip: Mindful, Meaningful, Joyful', font: FONT_FAMILY, size: FONT_SIZE_SMALL, italics: true })]
                            })],
                        })
                    ]
                })
            ]
        }));
        skenarioSection.push(new Paragraph({ spacing: { after: 80 } }));

        if (tuj.length > 0) {
            skenarioSection.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                shading: { fill: 'FFFBEB', type: 'clear', color: 'auto' },
                                margins: { top: convertInchesToTwip(0.08), bottom: convertInchesToTwip(0.08), left: convertInchesToTwip(0.12), right: convertInchesToTwip(0.12) },
                                children: [
                                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Tujuan Pembelajaran Khusus:', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, underline: {} })] }),
                                    ...tuj.map((t, i) => new Paragraph({
                                        alignment: AlignmentType.JUSTIFIED,
                                        spacing: { after: 40, line: 276 },
                                        children: [new TextRun({ text: `${i + 1}. ${typeof t === 'object' ? JSON.stringify(t) : String(t)}`, font: FONT_FAMILY, size: FONT_SIZE_SMALL })],
                                    }))
                                ]
                            })
                        ]
                    })
                ]
            }));
            skenarioSection.push(new Paragraph({ spacing: { after: 80 } }));
        }

        skenarioSection.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    tableHeader: true,
                    children: [
                        new TableCell({
                            width: { size: 18, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F1F5F9', type: 'clear', color: 'auto' },
                            margins: { top: convertInchesToTwip(0.08), bottom: convertInchesToTwip(0.08), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                            verticalAlign: VerticalAlign.CENTER,
                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Fase', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })],
                        }),
                        new TableCell({
                            width: { size: 14, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F1F5F9', type: 'clear', color: 'auto' },
                            margins: { top: convertInchesToTwip(0.08), bottom: convertInchesToTwip(0.08), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                            verticalAlign: VerticalAlign.CENTER,
                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Waktu', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })],
                        }),
                        new TableCell({
                            width: { size: 68, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F1F5F9', type: 'clear', color: 'auto' },
                            margins: { top: convertInchesToTwip(0.08), bottom: convertInchesToTwip(0.08), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                            verticalAlign: VerticalAlign.CENTER,
                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Skenario Naratif', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })],
                        }),
                    ]
                }),
                ...(Object.entries(phaseLabels).map(([key, label]) => {
                    const phase = (k as any)[key] as { isi?: string; waktu?: string } | undefined;
                    if (!phase) return null;
                    const labelParts = String(label).split('\n');
                    return new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 18, type: WidthType.PERCENTAGE },
                                shading: { fill: phaseColors[key], type: 'clear', color: 'auto' },
                                margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: labelParts.map((part, i) => new TextRun({
                                        text: String(part),
                                        font: FONT_FAMILY,
                                        size: FONT_SIZE_SMALL,
                                        bold: i === 0,
                                        italics: i > 0,
                                        break: i > 0 ? 1 : 0,
                                    })),
                                })],
                            }),
                            new TableCell({
                                width: { size: 14, type: WidthType.PERCENTAGE },
                                margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: String(phase.waktu || '-'), font: FONT_FAMILY, size: FONT_SIZE_SMALL })],
                                })],
                            }),
                            new TableCell({
                                width: { size: 68, type: WidthType.PERCENTAGE },
                                margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                                verticalAlign: VerticalAlign.TOP,
                                children: parseRppText(phase.isi || '-'),
                            }),
                        ]
                    });
                }).filter(Boolean) as TableRow[])
            ]
        }));
        skenarioSection.push(new Paragraph({ spacing: { after: 120 } }));

        if (p.lkpd) {
            skenarioSection.push(new Paragraph({ children: [new PageBreak()] }));
            skenarioSection.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20 },
                children: [new TextRun({ text: 'LEMBAR KERJA PESERTA DIDIK (LKPD)', font: FONT_FAMILY, size: FONT_SIZE_HEADER, bold: true, underline: {} })],
            }));
            skenarioSection.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [new TextRun({ text: `Pertemuan ke-${p.nomor || idx + 1} | ${inputData.mataPelajaran} | ${inputData.jenjangKelas}`, font: FONT_FAMILY, size: FONT_SIZE_SMALL })],
            }));

            skenarioSection.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, children: [new Paragraph({ children: [new TextRun({ text: 'Nama Murid/Kelompok', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })] }),
                            new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, children: [new Paragraph({ children: [new TextRun({ text: ': ................................', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })] }),
                            new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, children: [new Paragraph({ children: [new TextRun({ text: 'Kelas / Semester', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })] }),
                            new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, children: [new Paragraph({ children: [new TextRun({ text: `: ${inputData.jenjangKelas} / ${inputData.semester}`, font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })] }),
                        ]
                    })
                ]
            }));
            skenarioSection.push(new Paragraph({ spacing: { after: 80 } }));

            skenarioSection.push(sectionTitle('A. Petunjuk, Identitas & Tujuan'));
            skenarioSection.push(...parseRppText(p.lkpd.identitas_petunjuk || '-'));
            skenarioSection.push(...parseRppText(p.lkpd.tujuan_siswa || '-'));
            skenarioSection.push(new Paragraph({ spacing: { after: 80 } }));
            skenarioSection.push(sectionTitle('B. Masalah / Kasus'));
            skenarioSection.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                shading: { fill: 'F8F9FA', type: 'clear', color: 'auto' },
                                margins: { top: convertInchesToTwip(0.1), bottom: convertInchesToTwip(0.1), left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
                                children: parseRppText(p.lkpd.masalah || '-'),
                            })
                        ]
                    })
                ]
            }));
            skenarioSection.push(new Paragraph({ spacing: { after: 80 } }));
            skenarioSection.push(sectionTitle('C. Aktivitas Murid'));
            skenarioSection.push(...parseRppText(p.lkpd.aktivitas || '-'));
            skenarioSection.push(new Paragraph({ spacing: { after: 80 } }));
            skenarioSection.push(sectionTitle('D. Hasil Kerja'));
            skenarioSection.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { top: convertInchesToTwip(0.15), bottom: convertInchesToTwip(1.5), left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
                                children: parseRppText(p.lkpd.hasil_kerja || '-'),
                            })
                        ]
                    })
                ]
            }));
            skenarioSection.push(new Paragraph({ spacing: { after: 80 } }));
            skenarioSection.push(sectionTitle('E. Soal Latihan / Penilaian'));
            skenarioSection.push(...parseRppText(p.lkpd.penilaian || '-'));
            skenarioSection.push(new Paragraph({ spacing: { after: 120 } }));
        }
    });

    const asesmenSection: (Paragraph | Table)[] = [
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
            spacing: { before: 160, after: 120 },
            shading: { fill: '1E293B', type: 'clear', color: 'auto' },
            children: [new TextRun({ text: 'IV. ASESMEN & REFLEKSI', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, color: 'FFFFFF' })],
        }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    tableHeader: true,
                    children: ['Jenis Asesmen', 'Keterangan'].map((h, i) => new TableCell({
                        width: { size: i === 0 ? 25 : 75, type: WidthType.PERCENTAGE },
                        shading: { fill: 'D1E7DD', type: 'clear', color: 'auto' },
                        margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(h), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })],
                    }))
                }),
                ...([{ label: 'Asesmen Formatif', value: asesmen.formatif || '-' }, { label: 'Asesmen Sumatif', value: asesmen.sumatif || '-' }].map(r => new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                            verticalAlign: VerticalAlign.TOP,
                            children: [new Paragraph({ children: [new TextRun({ text: String(r.label), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })],
                        }),
                        new TableCell({
                            width: { size: 75, type: WidthType.PERCENTAGE },
                            margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                            verticalAlign: VerticalAlign.TOP,
                            children: parseRppText(r.value),
                        })
                    ]
                })))
            ]
        }),
        new Paragraph({ spacing: { after: 80 } }),
    ];

    const ttdSection: (Paragraph | Table)[] = [
        new Paragraph({ spacing: { before: 200, after: 80 } }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE, size: 0, color: 'auto' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' }, left: { style: BorderStyle.NONE, size: 0, color: 'auto' }, right: { style: BorderStyle.NONE, size: 0, color: 'auto' }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' }, insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' } },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Mengetahui,', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'Kepala Sekolah', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 0 }, children: [new TextRun({ text: String(inputData.namaKepalaSekolah || '......................................'), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, underline: {} })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: `NIP. ${inputData.nipKepalaSekolah || '..............................'}`, font: FONT_FAMILY, size: FONT_SIZE_SMALL })] }),
                            ]
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: `Purwakarta, ${tanggalStr}`, font: FONT_FAMILY, size: FONT_SIZE_SMALL })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: inputData.jabatanGuru || 'Guru Pengampu', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 0 }, children: [new TextRun({ text: String(inputData.namaGuru || '......................................'), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true, underline: {} })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: `NIP. ${inputData.nipGuru || '..............................'}`, font: FONT_FAMILY, size: FONT_SIZE_SMALL })] }),
                            ]
                        })
                    ]
                })
            ]
        })
    ];

    const lampiranSection: (Paragraph | Table)[] = [];
    if (lampiran) {
        lampiranSection.push(new Paragraph({ children: [new PageBreak()] }));
        lampiranSection.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 120 },
            children: [new TextRun({ text: 'LAMPIRAN ASESMEN & RUBRIK PENILAIAN', font: FONT_FAMILY, size: FONT_SIZE_HEADER, bold: true, underline: {} })]
        }));
        const rubrikHeaderRow = (cols: string[], widths: number[]) => new TableRow({
            tableHeader: true,
            children: cols.map((h, i) => new TableCell({
                shading: { fill: 'E2E8F0', type: 'clear', color: 'auto' },
                width: { size: widths[i], type: WidthType.PERCENTAGE },
                margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(h), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })]
            }))
        });

        if (lampiran.kognitif) {
            lampiranSection.push(new Paragraph({ spacing: { before: 160, after: 60 }, shading: { fill: 'F1F5F9', type: 'clear', color: 'auto' }, children: [new TextRun({ text: '1. RUBRIK PENILAIAN KOGNITIF (Pengetahuan)', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] }));
            if (lampiran.kognitif.deskripsi) lampiranSection.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: String(lampiran.kognitif.deskripsi), font: FONT_FAMILY, size: FONT_SIZE_SMALL, italics: true })] }));
            lampiranSection.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    rubrikHeaderRow(['Kriteria / Indikator', 'Sangat Baik (4)', 'Baik (3)', 'Cukup (2)', 'Perlu Bimbingan (1)'], [28, 18, 18, 18, 18]),
                    ...(lampiran.kognitif.tabel || []).map((t: any) => new TableRow({
                        children: [
                            new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ children: [new TextRun({ text: String(t.kriteria || '-'), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })] }),
                            ...[t.skor_4, t.skor_3, t.skor_2, t.skor_1].map((a: any) => new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ children: [new TextRun({ text: String(a || '-'), font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })] }))
                        ]
                    }))
                ]
            }));
            lampiranSection.push(new Paragraph({ spacing: { after: 120 } }));
        }
        if (lampiran.keterampilan) {
            lampiranSection.push(new Paragraph({ spacing: { before: 120, after: 60 }, shading: { fill: 'F1F5F9', type: 'clear', color: 'auto' }, children: [new TextRun({ text: '2. RUBRIK PENILAIAN KETERAMPILAN (Praktik/Kinerja)', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] }));
            if (lampiran.keterampilan.deskripsi) lampiranSection.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: String(lampiran.keterampilan.deskripsi), font: FONT_FAMILY, size: FONT_SIZE_SMALL, italics: true })] }));
            lampiranSection.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    rubrikHeaderRow(['Aspek Keterampilan', 'Sangat Mahir (4)', 'Mahir (3)', 'Cukup (2)', 'Perlu Latihan (1)'], [28, 18, 18, 18, 18]),
                    ...(lampiran.keterampilan.tabel || []).map((t: any) => new TableRow({
                        children: [
                            new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ children: [new TextRun({ text: String(t.aspek || '-'), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })] }),
                            ...[t.skor_4, t.skor_3, t.skor_2, t.skor_1].map((a: any) => new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ children: [new TextRun({ text: String(a || '-'), font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })] }))
                        ]
                    }))
                ]
            }));
            lampiranSection.push(new Paragraph({ spacing: { after: 120 } }));
        }
        if (lampiran.sikap) {
            lampiranSection.push(new Paragraph({ spacing: { before: 120, after: 60 }, shading: { fill: 'F1F5F9', type: 'clear', color: 'auto' }, children: [new TextRun({ text: '3. JURNAL PENILAIAN SIKAP (Profil Pelajar Pancasila)', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] }));
            if (lampiran.sikap.deskripsi) lampiranSection.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: String(lampiran.sikap.deskripsi), font: FONT_FAMILY, size: FONT_SIZE_SMALL, italics: true })] }));
            if (lampiran.sikap.catatan) lampiranSection.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Catatan Guru: ', font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true }), new TextRun({ text: String(lampiran.sikap.catatan), font: FONT_FAMILY, size: FONT_SIZE_SMALL })] }));
            lampiranSection.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    rubrikHeaderRow(['No', 'Dimensi Sikap', 'Indikator Perilaku yang Diamati', 'Catatan Kejadian', 'Tindak Lanjut'], [6, 22, 38, 18, 16]),
                    ...(lampiran.sikap.indikator || []).map((t: any, i: number) => new TableRow({
                        children: [
                            new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i + 1), font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })] }),
                            new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, children: [new Paragraph({ children: [new TextRun({ text: String(t), font: FONT_FAMILY, size: FONT_SIZE_SMALL, bold: true })] })] }),
                            new TableCell({ width: { size: 38, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, children: [new Paragraph({ children: [new TextRun({ text: '...............................................................................', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })] }),
                            new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, children: [new Paragraph({ children: [new TextRun({ text: '', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })] }),
                            new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) }, children: [new Paragraph({ children: [new TextRun({ text: '', font: FONT_FAMILY, size: FONT_SIZE_SMALL })] })] }),
                        ]
                    }))
                ]
            }));
        }
    }

    const doc = new Document({
        creator: String(inputData.namaGuru || 'Portal Digital KKG'),
        title: `RPP ${inputData.mataPelajaran} - ${inputData.topik}`,
        description: `Rencana Pelaksanaan Pembelajaran ${inputData.mataPelajaran} Kelas ${inputData.jenjangKelas}`,
        styles: {
            default: {
                document: {
                    run: { font: FONT_FAMILY, size: FONT_SIZE_SMALL },
                    paragraph: { spacing: { line: 276 } }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.18) }
                    }
                },
                children: [
                    ...kopSuratContent,
                    ...judulSection,
                    ...identifikasiSection,
                    ...desainSection,
                    ...skenarioSection,
                    ...asesmenSection,
                    ...ttdSection,
                    ...lampiranSection
                ],
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({ text: `RPP ${inputData.mataPelajaran} | ${inputData.topik} | ${inputData.jenjangKelas} - Halaman `, font: FONT_FAMILY, size: 18 }),
                                    new TextRun({ children: [PageNumber.CURRENT], font: FONT_FAMILY, size: 18 }),
                                    new TextRun({ text: ' dari ', font: FONT_FAMILY, size: 18 }),
                                    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT_FAMILY, size: 18 }),
                                ]
                            })
                        ]
                    })
                }
            }
        ]
    });

    return doc;
}

export async function generateRppBuffer(
    inputData: RppInputData,
    content: RppContentData,
    settings: KKGSettings,
    lampiran?: any
): Promise<Uint8Array> {
    try {
        const doc = await generateRppDocx(inputData, content, settings, lampiran);
        const base64 = await Packer.toBase64String(doc);
        return base64ToBytes(base64);
    } catch (err: any) {
        console.error('generateRppBuffer error:', err);
        throw new Error(`Gagal membuat dokumen RPP: ${err.message}`);
    }
}
