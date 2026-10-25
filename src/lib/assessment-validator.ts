/**
 * Assessment Quality Gate & AI Verifier Engine
 * Standar Penulisan Soal Puspendik Kemendikbudristek & BSKAP No. 046 Tahun 2025
 * 
 * Pipeline 3-Tier:
 * Tier 1: Deterministic Heuristics & Rule-Based Sanitizer (Zero Latency)
 * Tier 2: AI Pedagogical Verifier & Critic (LLM-as-a-Judge / Self-Correction)
 * Tier 3: Auto-Healing, Quality Scoring (0-100), and Audit Trail Injection
 */

import { AIService } from '../services/ai';
import { generateVisualStimulus, detectStimulusFromSoalText, isKnownVisualType, VISUAL_RENDERER_REGISTRY } from './visual-engine';

export interface QuestionAuditDetail {
    status: 'verified' | 'repaired' | 'flagged';
    quality_score: number; // 0 - 100
    key_verified: boolean;
    kaidah_puspendik: boolean;
    hots_valid: boolean;
    distraktor_homogen: boolean;
    notes?: string;
    repaired_fields?: string[];
}

export interface AssessmentAuditSummary {
    total_reviewed: number;
    passed_count: number;
    repaired_count: number;
    flagged_count: number;
    overall_quality_score: number;
    verifier_model?: string;
    verified_at: string;
}

export interface HeuristicIssue {
    type: 'KEY_NOT_FOUND' | 'FORBIDDEN_PHRASE' | 'DUPLICATE_OPTIONS' | 'ORPHAN_STIMULUS' | 'MISMATCHED_IMAGE' | 'LENGTH_BIAS' | 'EMPTY_OPTION' | 'OPTION_COUNT_MISMATCH';
    field: string;
    message: string;
    autoFixable: boolean;
}

/**
 * Normalisasi string untuk perbandingan teks
 */
function normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isRecord(value: any): value is Record<string, any> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function renderKnownVisual(spec: any) {
    if (!isRecord(spec) || typeof spec.type !== 'string' || !isKnownVisualType(spec.type) ||
        (spec.params != null && !isRecord(spec.params))) return null;
    try {
        return generateVisualStimulus({ ...spec, type: spec.type });
    } catch {
        return null;
    }
}

function isImageUnavailable(item: any): boolean {
    return item.imageUnavailable === true || item.gambar?.imageUnavailable === true;
}

function hasUsableVisual(item: any): boolean {
    if (isImageUnavailable(item)) return false;
    const image = item.gambar;
    const sources = typeof image === 'string' ? [image] : [image?.url, image?.dataUri, image?.src, image?.data, image?.gambar];
    const hasSource = sources.some(source => typeof source === 'string' &&
        /^(?:https?:\/\/\S+|\/(?!\/)\S+|blob:\S+|data:image\/(?:png|jpe?g|gif|webp|svg\+xml)[;,]\S+)/i.test(source.trim()));
    const hasSvg = [item.svg, image?.svg].some(svg => typeof svg === 'string' && /<svg\b[^>]*>[\s\S]*<\/svg\s*>/i.test(svg));
    return hasSource || hasSvg || !!renderKnownVisual(item.visual_stimulus)?.svg;
}

const FIGURE_REFERENCE_PATTERN = /\b(?:perhatikan|amatilah|lihat(?:lah)?|cermati|berdasarkan)\b[\s\S]{0,80}?\b(?:gambar|foto|diagram|grafik|bagan|ilustrasi)\b|\b(?:gambar|foto|diagram|grafik|bagan|ilustrasi)\s+(?:berikut|di\s+bawah|di\s+samping|tersebut)\b|\b(?:tanda\s+panah|panah\s+menunjuk)\b/i;

function requiresVisual(item: any): boolean {
    return item.imageRequired === true || item.visual_required === true || FIGURE_REFERENCE_PATTERN.test(String(item.soal || ''));
}

function equalValues(left: any, right: any): boolean {
    if (left === right) return true;
    if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) !== Array.isArray(right)) return false;
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every(key =>
        Object.prototype.hasOwnProperty.call(right, key) && equalValues(left[key], right[key]));
}

function changedQuestionFields(original: any, healed: any): string[] {
    return [...new Set([...Object.keys(original), ...Object.keys(healed)])]
        .filter(key => key !== 'audit' && !equalValues(original[key], healed[key]));
}

const MEANINGFUL_REPAIR_FIELDS = new Set(['soal', 'opsi', 'kunci', 'gambar', 'visual_stimulus',
    'gambar_keyword', 'gambar_prompt_en', 'svg', 'imageUnavailable', 'imageRequired', 'visual_required']);

function meaningfulRepairFields(fields: string[]): string[] {
    return fields.filter(field => MEANINGFUL_REPAIR_FIELDS.has(field));
}

/** Accepted stem repairs must keep the known SVG and its renderer specification together. */
function reconcileRepairedVisual(item: any, original: any): void {
    const spec = item.visual_stimulus;
    if (item.soal === original.soal || isImageUnavailable(item) || !renderKnownVisual(spec) ||
        (item.gambar && item.gambar.type !== 'svg')) return;

    const detected = detectStimulusFromSoalText(String(item.soal || ''), '');
    if (!detected) return;
    const currentRenderer = VISUAL_RENDERER_REGISTRY[spec.type.toLowerCase()];
    const detectedRenderer = VISUAL_RENDERER_REGISTRY[detected.type.toLowerCase()];
    if (currentRenderer.render !== detectedRenderer?.render) {
        delete item.visual_stimulus;
        delete item.svg;
        item.gambar = { imageUnavailable: true, imageUnavailableReason: 'required_diagram_missing' };
        return;
    }

    const numbers = new Set((String(item.soal).match(/\d+(?:[.,]\d+)?/g) || []).map(value => Number(value.replace(',', '.'))));
    const params = { ...spec.params };
    for (const [key, value] of Object.entries(detected.params || {})) {
        if (typeof value === 'number' && numbers.has(value)) params[key] = value;
    }
    if (equalValues(params, spec.params || {})) return;
    const reconciled = { ...spec, params };
    const rendered = renderKnownVisual(reconciled);
    if (!rendered) {
        delete item.visual_stimulus;
        delete item.svg;
        item.gambar = { imageUnavailable: true, imageUnavailableReason: 'required_diagram_missing' };
        return;
    }
    item.visual_stimulus = reconciled;
    item.gambar = { url: rendered.dataUri, svg: rendered.svg, credit: rendered.credit, title: rendered.title, type: 'svg' };
    delete item.svg;
}

/**
 * Frasa-frasa yang dilarang keras dalam kaidah baku penulisan soal Puspendik
 */
const FORBIDDEN_OPTION_PATTERNS = [
    /semua\s+(?:jawaban|pilihan|pernyataan)\s+(?:di\s+atas\s+)?benar/i,
    /semua\s+(?:jawaban|pilihan|pernyataan)\s+(?:di\s+atas\s+)?salah/i,
    /(?:jawaban|pilihan)\s+[a-d]\s+dan\s+[a-d]\s+benar/i,
    /tidak\s+ada\s+(?:jawaban|pilihan)\s+yang\s+benar/i,
    /benar\s+semua/i,
    /salah\s+semua/i
];

/**
 * Tier 1: Validasi Heuristik Deterministik per Butir Soal PG
 */
export function validateQuestionHeuristics(item: any, jenjangKelas?: string): {
    isValid: boolean;
    issues: HeuristicIssue[];
    healedItem: any;
} {
    const issues: HeuristicIssue[] = [];
    const healed = { ...item };

    const isEarlyGrade = jenjangKelas && (
        jenjangKelas.includes('Kelas 1') || 
        jenjangKelas.includes('Kelas 2') || 
        jenjangKelas.includes('Kelas 3') || 
        jenjangKelas.toLowerCase().includes('fase a')
    );

    const validOptionKeys = isEarlyGrade ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];

    // 1. Periksa Opsi
    if (!healed.opsi || typeof healed.opsi !== 'object') {
        issues.push({
            type: 'EMPTY_OPTION',
            field: 'opsi',
            message: 'Opsi jawaban tidak berformat objek valid',
            autoFixable: false
        });
    } else {
        const optionKeys = Object.keys(healed.opsi).map(k => k.toUpperCase());
        const cleanedOpsi: Record<string, string> = {};

        for (const k of validOptionKeys) {
            const rawVal = healed.opsi[k] ?? healed.opsi[k.toLowerCase()] ?? '';
            cleanedOpsi[k] = String(rawVal).trim();
            if (!cleanedOpsi[k]) {
                issues.push({
                    type: 'EMPTY_OPTION',
                    field: `opsi.${k}`,
                    message: `Opsi ${k} tidak boleh kosong`,
                    autoFixable: false
                });
            }
        }
        healed.opsi = cleanedOpsi;

        // 2. Deteksi Frasa Terlarang Puspendik di Opsi
        for (const [key, val] of Object.entries(cleanedOpsi)) {
            for (const pattern of FORBIDDEN_OPTION_PATTERNS) {
                if (pattern.test(val)) {
                    issues.push({
                        type: 'FORBIDDEN_PHRASE',
                        field: `opsi.${key}`,
                        message: `Opsi ${key} melanggar kaidah Puspendik ("${val}")`,
                        autoFixable: true
                    });
                }
            }
        }

        // 3. Deteksi Opsi Duplikat
        const valuesList = Object.entries(cleanedOpsi);
        for (let i = 0; i < valuesList.length; i++) {
            for (let j = i + 1; j < valuesList.length; j++) {
                if (valuesList[i][1] && valuesList[j][1] && normalizeText(valuesList[i][1]) === normalizeText(valuesList[j][1])) {
                    issues.push({
                        type: 'DUPLICATE_OPTIONS',
                        field: `opsi.${valuesList[j][0]}`,
                        message: `Opsi ${valuesList[i][0]} dan ${valuesList[j][0]} memiliki teks yang sama`,
                        autoFixable: false
                    });
                }
            }
        }

        // 4. Periksa Kunci Jawaban vs Opsi
        let normalizedKey = String(healed.kunci || '').trim().toUpperCase();
        // Jika kunci ditulis lengkap misal "A. Opsi", ambil huruf pertamanya
        if (normalizedKey.length > 1 && /^[A-D][\.\:\s]/.test(normalizedKey)) {
            normalizedKey = normalizedKey.charAt(0);
        }

        if (!validOptionKeys.includes(normalizedKey)) {
            // Cek apakah kunci berisi teks dari salah satu opsi
            let matchedKey: string | null = null;
            for (const [k, v] of Object.entries(cleanedOpsi)) {
                if (normalizeText(v) === normalizeText(normalizedKey)) {
                    matchedKey = k;
                    break;
                }
            }

            if (matchedKey) {
                healed.kunci = matchedKey;
            } else {
                issues.push({
                    type: 'KEY_NOT_FOUND',
                    field: 'kunci',
                    message: `Kunci jawaban "${healed.kunci}" tidak terdapat dalam opsi (${validOptionKeys.join(', ')})`,
                    autoFixable: false
                });
            }
        } else {
            healed.kunci = normalizedKey;
        }

        // 5. Length Bias Check (Kunci terlalu panjang vs rata-rata distraktor)
        const keyText = cleanedOpsi[healed.kunci] || '';
        const distractorLengths = Object.entries(cleanedOpsi)
            .filter(([k]) => k !== healed.kunci)
            .map(([_, v]) => v.length);

        if (distractorLengths.length > 0) {
            const avgDistractorLen = distractorLengths.reduce((a, b) => a + b, 0) / distractorLengths.length;
            if (avgDistractorLen > 10 && keyText.length > avgDistractorLen * 2.8) {
                issues.push({
                    type: 'LENGTH_BIAS',
                    field: 'opsi',
                    message: `Opsi kunci (${keyText.length} char) mencolok jauh lebih panjang dari rata-rata pengecoh (${Math.round(avgDistractorLen)} char)`,
                    autoFixable: true
                });
            }
        }
    }

    // 6. Pembersihan Debris Prompt & Deteksi Referensi Stimulus Yatim (Orphan Stimulus)
    if (healed.soal && typeof healed.soal === 'string') {
        // 6a. Bersihkan segala kebocoran instruksi AI di dalam kurung siku atau kurung biasa
        healed.soal = healed.soal
            .replace(/\[(?:visual_stimulus|stimulus|visual|gambar|foto|diagram|ilustrasi|deskripsi|keterangan|bagan)[^\]]*\]/gi, '')
            .replace(/\((?:visual_stimulus|stimulus|visual|gambar|foto|diagram|ilustrasi|deskripsi|keterangan|bagan)[^)]*\)/gi, '')
            .replace(/[ \t]+/g, ' ')
            .trim();

        const hasTable = /\|[\s\S]*?\|[\s\S]*?\|/.test(healed.soal);

        // Tabel Markdown sudah menjadi stimulus; permintaan gambar tambahan dibuang.
        if (hasTable) {
            delete healed.visual_stimulus;
            delete healed.gambar_keyword;
            delete healed.gambar_prompt_en;
            delete healed.gambar;
            delete healed.svg;
            delete healed.imageUnavailable;
            delete healed.visual_required;
            if (healed.imageRequired === true) healed.imageRequired = false;
        }

        // Jika soal bilang "perhatikan tabel" padahal tidak ada tabel
        if (!hasTable && /^(?:perhatikan|amatilah)\s+(?:tabel|data\s+tabel)\s+(?:berikut|di\s+bawah\s+ini)[\s!.,:]*/i.test(healed.soal)) {
            issues.push({
                type: 'ORPHAN_STIMULUS',
                field: 'soal',
                message: 'Teks soal merujuk pada tabel, namun tabel tidak ditemukan',
                autoFixable: false
            });
        }
    }

    // 7. Deteksi Ketidaksesuaian Gambar Stok vs Soal Berlabel Presisi & Pembersihan Stock Polluter
    if (healed.gambar && (healed.gambar.type === 'photo' || healed.gambar.type === 'ai')) {
        const textLower = (healed.soal || '').toLowerCase();
        const creditLower = (healed.gambar.credit || '').toLowerCase();
        const urlLower = (healed.gambar.url || '').toLowerCase();

        // 7a. Blocklist Andrey Sizov / Cyrillic textbook pages / generic circuit stock photo
        const isAndreySizovOrRussian = creditLower.includes('Ð°Ð½Ð´Ñ€ÐµÐ¹') || creditLower.includes('ÑÐ¸Ð·Ð¾Ð²') || 
                                       creditLower.includes('andrey sizov') || creditLower.includes('asizov') || 
                                       urlLower.includes('1532094349884');
        const isGenericCircuitStock = (urlLower.includes('circuit') || creditLower.includes('circuit')) && 
                                      !textLower.includes('rangkaian listrik') && !textLower.includes('baterai') && !textLower.includes('sakelar');

        const requiresPrecisionDiagram = /tanda\s+panah|panah\s+menunjuk|huruf\s+[a-z]|bagian\s+[a-z]|tanda\s+[a-z]|pola\s+warna|pola\s+bilangan|pola\s+gambar|diagram\s+alur|pohon\s+faktor|skema\s+alur|bernomor|tanda\s+tanya|\(\?\)|kotak\s+(?:kosong|berikut)|urutan\s+(?:gambar|pola)|simbol\s+sila|lambang\s+sila/i.test(textLower);

        if ((healed.gambar.type === 'photo' && requiresPrecisionDiagram) || isAndreySizovOrRussian || isGenericCircuitStock) {
            // Prioritas 1: Cek apakah bisa diselamatkan dengan SVG generator otomatis menggunakan fullContext (soal + opsi)
            let fullContext = (item.soal || '') + ' ' + (healed.soal || '');
            if (healed.opsi && typeof healed.opsi === 'object') {
                fullContext += ' ' + Object.entries(healed.opsi).map(([k, v]) => `${k}. ${v}`).join(' ');
            }

            const detectedSvg = detectStimulusFromSoalText(healed.soal || '', '') || detectStimulusFromSoalText(fullContext, '');
            if (detectedSvg && detectedSvg.type) {
                const svgRes = renderKnownVisual(detectedSvg);
                if (svgRes) {
                    healed.gambar = {
                        url: svgRes.dataUri,
                        svg: svgRes.svg,
                        credit: svgRes.credit,
                        title: svgRes.title,
                        type: 'svg'
                    };
                    healed.visual_stimulus = detectedSvg;
                    issues.push({
                        type: 'MISMATCHED_IMAGE',
                        field: 'gambar',
                        message: `Foto stok tidak sesuai digantikan dengan diagram SVG presisi (${detectedSvg.type})`,
                        autoFixable: true
                    });
                } else {
                    delete healed.gambar;
                    delete healed.visual_stimulus;
                    issues.push({
                        type: 'MISMATCHED_IMAGE',
                        field: 'gambar',
                        message: 'Foto stok tidak sesuai dihapus agar tidak membingungkan murid',
                        autoFixable: true
                    });
                }
            } else {
                delete healed.gambar;
                delete healed.visual_stimulus;

                const reasonMsg = isAndreySizovOrRussian
                    ? 'Foto stok generik buku Rusia/sirkuit (Andrey Sizov) dihapus karena tidak relevan dengan kurikulum dan membingungkan murid'
                    : 'Foto stok tidak sesuai dihapus karena soal menuntut diagram berlabel presisi';

                issues.push({
                    type: 'MISMATCHED_IMAGE',
                    field: 'gambar',
                    message: reasonMsg,
                    autoFixable: true
                });
            }
        }
    }

    // Missing figures remain a content failure; deleting their references cannot repair them.
    if (isImageUnavailable(healed) || (!hasUsableVisual(healed) && requiresVisual(healed))) {
        issues.push({
            type: 'ORPHAN_STIMULUS',
            field: 'gambar',
            message: 'Stimulus visual yang diperlukan tidak tersedia; pulihkan gambar sebelum butir diverifikasi',
            autoFixable: false
        });
    }

    return {
        isValid: issues.filter(i => !i.autoFixable).length === 0,
        issues,
        healedItem: healed
    };
}

/**
 * Prompt Builder untuk AI Pedagogical Verifier & Critic (LLM-as-a-Judge)
 */
export function buildAuditPrompt(
    items: any[],
    context: {
        mataPelajaran: string;
        topik: string;
        jenjangKelas: string;
        semester?: string;
    }
): string {
    const itemsFormatted = items.map((q, idx) => ({
        index: idx,
        no: q.no || (idx + 1),
        bentuk: q.bentuk || 'Pilihan Ganda',
        soal: q.soal,
        opsi: q.opsi || null,
        kunci: q.kunci,
        level: q.level || 'L1',
        indikator: q.indikator || '',
        stimulus_visual_available: hasUsableVisual(q),
        stimulus_visual: hasUsableVisual(q)
            ? (q.gambar?.desc || q.gambar_keyword || 'Sumber gambar atau spesifikasi diagram tersedia')
            : (isImageUnavailable(q) || requiresVisual(q) ? 'Stimulus visual tidak tersedia; perlu dipulihkan sebelum verifikasi' : undefined)
    }));

    return `
Bertindaklah sebagai "Auditor & Pakar Penilaian Asesmen Puspendik Kemendikbudristek".
TUGAS ANDA: Melakukan audit forensik mutu, memverifikasi kebenaran kunci jawaban, serta menelaah setiap butir soal berikut secara ketat sebelum diterbitkan ke guru dan murid.

KONTEKS ASESMEN:
- Mata Pelajaran : ${context.mataPelajaran}
- Topik / Materi : ${context.topik}
- Jenjang Kelas  : ${context.jenjangKelas}
- Semester       : ${context.semester || '-'}

STANDAR AUDIT MUTU (PUSPENDIK):
1. KEBENARAN FAKTUAL & KUNCI JAWABAN (SANGAT KRUSIAL):
   - Uji mandiri setiap butir soal. Apakah kunci yang tertera adalah SATU-SATUNYA jawaban yang benar secara ilmu pengetahuan & kurikulum?
   - Jika kunci salah atau keliru, Anda WAJIB memberikan koreksi kunci jawaban yang tepat pada field "corrected_kunci".
   - Jika ada beberapa opsi yang ambigu atau sama-sama benar, perbaiki opsi yang rancu pada "repaired_opsi".

2. KAIDAH PENULISAN SOAL BAKU:
   - Tidak boleh ada petunjuk/bocoran kunci jawaban pada pokok soal (stem clueing).
   - Opsi distraktor (pengecoh) harus homogen, logis, dan berfungsi dengan baik (tidak konyol/asal-asalan).
   - DILARANG menggunakan opsi "Semua benar", "Semua salah", atau sejenisnya.
   - Panjang opsi jawaban relatif seimbang (tidak ada opsi kunci yang mencolok panjang sendirian).

3. PENALARAN & LEVEL KOGNITIF (L1, L2, L3):
   - Jika berlabel L3 (HOTS), soal WAJIB menuntut analisis/evaluasi kontekstual, bukan sekadar ingatan definisi.

4. KESESUAIAN JENJANG KELAS:
   - Kosakata dan tingkat kesulitan kalimat harus ramah anak sesuai ${context.jenjangKelas}.

5. STIMULUS GAMBAR / DIAGRAM VISUAL (SANGAT PENTING):
    - "stimulus_visual_available" menyatakan apakah sumber gambar atau spesifikasi renderer diagram tersedia. Deskripsi dan kata kunci saja tidak membuktikan ketersediaan gambar.
    - Jika stimulus visual yang diperlukan tidak tersedia, laporkan pada "notes" dan tetapkan "key_verified": false. Gambar tersebut perlu dipulihkan sebelum soal dapat dinyatakan lolos audit.
    - Pertahankan referensi gambar/tabel yang diperlukan dalam teks soal; jangan menghapusnya untuk menyembunyikan stimulus yang hilang. Verifikasi keselarasan materi hanya sejauh informasi yang tersedia.

DAFTAR BUTIR SOAL YANG DIAUDIT:
${JSON.stringify(itemsFormatted, null, 2)}

INSTRUKSI OUTPUT:
Berikan output JSON murni tanpa markdown pembuka/penutup, dengan format struktur:
{
  "summary": {
    "total_reviewed": ${items.length},
    "valid_count": number,
    "repaired_count": number,
    "overall_quality_score": number
  },
  "verifications": [
    {
      "index": number,
      "no": number,
      "verdict": "PASS" | "REPAIR",
      "quality_score": number,
      "key_verified": boolean,
      "kaidah_puspendik": boolean,
      "hots_valid": boolean,
      "distraktor_homogen": boolean,
      "corrected_kunci": "A" | "B" | "C" | "D",
      "repaired_soal": "string perbaikan jika diperlukan",
      "repaired_opsi": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "notes": "Catatan telaah verifikator (maks 1 kalimat)"
    }
  ]
}
`;
}

/**
 * Auto-healing & Merge: Menerapkan koreksi dari AI Verifier ke daftar butir soal
 */
export function applyVerificationRepairs(
    originalItems: any[],
    verificationResults: any[],
    jenjangKelas?: string
): {
    healedItems: any[];
    repairedCount: number;
} {
    let repairedCount = 0;
    const verificationMap = new Map<number, any>();

    if (Array.isArray(verificationResults)) {
        for (const v of verificationResults) {
            if (v && v.index != null) {
                verificationMap.set(v.index, v);
            }
        }
    }

    const healedItems = originalItems.map((item, idx) => {
        const v = verificationMap.get(idx);
        const copy = { ...item };
        const repairedFields: string[] = [];

        if (v) {
            // Terapkan koreksi kunci jika disarankan
            if (v.corrected_kunci && typeof v.corrected_kunci === 'string' && copy.opsi && copy.opsi[v.corrected_kunci]) {
                if (String(copy.kunci || '').trim().toUpperCase() !== v.corrected_kunci) {
                    copy.kunci = v.corrected_kunci;
                    repairedFields.push('kunci');
                }
            }

            // Terapkan koreksi redaksi soal jika ada (abaikan jika berupa keluhan/penolakan meta)
            if (v.repaired_soal && typeof v.repaired_soal === 'string' && v.repaired_soal.trim().length > 10) {
                const trimmed = v.repaired_soal.trim();
                const isMetaComplaint = /(?:tidak dapat diverifikasi|tanpa gambar|perlu disertai gambar|gambar tidak ditemukan|tidak ada gambar|tidak dapat dijawab tanpa|deskripsi verbal yang jelas|kurang informasi gambar)/i.test(trimmed);
                if (!isMetaComplaint) {
                    if (trimmed !== String(copy.soal || '').trim()) {
                        copy.soal = trimmed;
                        repairedFields.push('soal');
                    }
                } else {
                    console.warn(`[QualityGate] Ignored meta-rejection in repaired_soal for Q#${copy.no || idx + 1}:`, trimmed);
                }
            }

            // Terapkan koreksi opsi jika ada
            if (v.repaired_opsi && typeof v.repaired_opsi === 'object' && Object.keys(v.repaired_opsi).length >= 3) {
                const merged = { ...copy.opsi, ...v.repaired_opsi };
                if (!equalValues(merged, copy.opsi || {})) {
                    copy.opsi = merged;
                    repairedFields.push('opsi');
                }
            }

            const hasCompleteVerifierChecks = (v.verdict === 'PASS' || v.verdict === 'REPAIR') &&
                v.key_verified === true && v.kaidah_puspendik === true &&
                v.hots_valid === true && v.distraktor_homogen === true &&
                typeof v.quality_score === 'number' && Number.isFinite(v.quality_score);

            // The healed item is authoritative: a field it deleted must not be
            // restored by merging into the stale copy.
            const firstPass = validateQuestionHeuristics(copy, jenjangKelas).healedItem;
            const finalValidation = validateQuestionHeuristics(firstPass, jenjangKelas);
            const healed = finalValidation.healedItem;

            for (const field of changedQuestionFields(copy, healed)) {
                if (!repairedFields.includes(field)) repairedFields.push(field);
            }

            const beforeReconcile = { ...healed };
            reconcileRepairedVisual(healed, item);
            for (const field of changedQuestionFields(beforeReconcile, healed)) {
                if (!repairedFields.includes(field)) repairedFields.push(field);
            }

            const postRepairValidation = validateQuestionHeuristics(healed, jenjangKelas);
            const isBlocked = postRepairValidation.issues.some(issue => !issue.autoFixable)
                || isImageUnavailable(postRepairValidation.healedItem)
                || (!hasUsableVisual(postRepairValidation.healedItem) && requiresVisual(postRepairValidation.healedItem));
            const isVerified = hasCompleteVerifierChecks && !isBlocked;
            const meaningful = meaningfulRepairFields(repairedFields);
            const isRepaired = meaningful.length > 0;
            if (isRepaired) repairedCount++;

            // Suntikkan audit metadata
            const auditDetail: QuestionAuditDetail = {
                status: !isVerified ? 'flagged' : (isRepaired ? 'repaired' : 'verified'),
                quality_score: isVerified ? Math.max(0, Math.min(100, v.quality_score)) : 0,
                key_verified: isVerified && v.key_verified === true,
                kaidah_puspendik: isVerified && v.kaidah_puspendik === true,
                hots_valid: isVerified && v.hots_valid === true,
                distraktor_homogen: isVerified && v.distraktor_homogen === true,
                notes: isVerified
                    ? (v.notes || (isRepaired ? 'Diselaraskan secara otomatis oleh Quality Gate' : 'Lolos uji mutu Puspendik'))
                    : `${v.notes || 'Verifikasi tidak lengkap atau pemeriksaan deterministik gagal.'} Perlu tinjauan guru.`,
                repaired_fields: meaningful.length > 0 ? meaningful : undefined
            };

            healed.audit = auditDetail;
            return healed;
        } else {
            // No verifier row means no AI checks have been confirmed.
            copy.audit = {
                status: 'flagged',
                quality_score: 0,
                key_verified: false,
                kaidah_puspendik: false,
                hots_valid: false,
                distraktor_homogen: false,
                notes: 'Butir tidak memiliki hasil verifier; perlu tinjauan guru.'
            };
        }

        return copy;
    });

    return { healedItems, repairedCount };
}

/**
 * Unified Quality Gate Pipeline:
 * Menjalankan Tier 1 (Heuristik) -> Tier 2 (AI Verifier) -> Tier 3 (Auto-Healing)
 */
export async function runAssessmentQualityGate(
    ai: AIService,
    finalData: any,
    context: {
        mataPelajaran: string;
        topik: string;
        jenjangKelas: string;
        semester?: string;
    },
    options?: {
        preferredSlug?: string;
        onProgress?: (msg: string, percent: number) => Promise<void>;
    }
): Promise<{
    finalData: any;
    summary: AssessmentAuditSummary;
}> {
    const pgItems = Array.isArray(finalData.pg) ? finalData.pg : [];
    const totalItems = pgItems.length;

    // Default summary
    let auditSummary: AssessmentAuditSummary = {
        total_reviewed: totalItems,
        passed_count: 0,
        repaired_count: 0,
        flagged_count: totalItems,
        overall_quality_score: 0,
        verified_at: new Date().toISOString()
    };

    if (totalItems === 0) {
        return { finalData, summary: auditSummary };
    }

    if (options?.onProgress) {
        await options.onProgress('Menjalankan inspeksi heuristik kaidah baku Puspendik...', 86);
    }

    // Tier 1: Deterministic Heuristic Gate. Image diversity belongs to the route
    // resolver; the audit must not delete a required figure or rewrite its stem.
    const preHealedPG: any[] = [];
    const heuristicFields: string[][] = [];
    let heuristicRepairs = 0;

    for (const item of pgItems) {
        const { healedItem, issues } = validateQuestionHeuristics(item, context.jenjangKelas);
        const changed = meaningfulRepairFields(changedQuestionFields(item, healedItem));
        if (changed.length > 0) heuristicRepairs++;
        heuristicFields.push(changed);
        preHealedPG.push(healedItem);
    }

    // Tier 2: AI Pedagogical Verifier & Critic (LLM-as-a-Judge)
    let verifications: any[] = [];
    let verifierModel = options?.preferredSlug || 'ai-verifier';

    try {
        if (options?.onProgress) {
            await options.onProgress('AI Verifikator sedang menguji kebenaran kunci jawaban & homogenitas distraktor...', 90);
        }

        const auditPrompt = buildAuditPrompt(preHealedPG, context);
        const auditResult = await ai.generateJSON(auditPrompt, options?.preferredSlug);

        if (auditResult?._ai_meta?.model) {
            verifierModel = `${auditResult._ai_meta.provider || ''} (${auditResult._ai_meta.model})`.trim();
        }

        if (auditResult?.verifications && Array.isArray(auditResult.verifications)) {
            verifications = auditResult.verifications;
        }

        if (auditResult?.summary?.overall_quality_score) {
            auditSummary.overall_quality_score = Math.min(100, Math.max(0, auditResult.summary.overall_quality_score));
        }
    } catch (auditErr: any) {
        console.warn('[QualityGate] AI Verifier call failed or timed out, gracefully using Heuristics Tier:', auditErr.message);
        // Graceful degradation: tetap lolos dengan hasil Tier 1
    }

    // Tier 3: Apply Repairs and Merge
    if (options?.onProgress) {
        await options.onProgress('Menerapkan auto-healing dan menyematkan sertifikat audit mutu...', 93);
    }

    const { healedItems, repairedCount } = applyVerificationRepairs(preHealedPG, verifications, context.jenjangKelas);

    // Heuristic repairs happen before the verifier and must remain visible in the
    // final certificate instead of being silently folded into the pre-audit state.
    healedItems.forEach((item: any, index: number) => {
        const extra = heuristicFields[index] || [];
        if (!extra.length || !item?.audit) return;
        const fields = [...new Set([...(item.audit.repaired_fields || []), ...extra])];
        item.audit.repaired_fields = fields;
        if (item.audit.status === 'verified') item.audit.status = 'repaired';
    });

    // Hard gate: butir PG dengan opsi kosong/duplikat atau kunci hilang tidak boleh
    // masuk ke paket. Audit sebelumnya hanya memberi flag tanpa menahan butir rusak.
    const optionKeys = ['A', 'B', 'C', 'D'];
    const completePgOptions = (item: any): { ok: boolean; reason?: string } => {
        const opsi = item?.opsi;
        if (!opsi || typeof opsi !== 'object') return { ok: false, reason: 'missing_options' };
        const values = optionKeys.map(key => String(opsi[key] ?? '').trim());
        if (values.some(value => !value)) return { ok: false, reason: 'empty_option' };
        if (new Set(values.map(value => value.toLowerCase())).size < 2) return { ok: false, reason: 'duplicate_options' };
        const kunci = String(item.kunci || '').trim().toUpperCase();
        if (!optionKeys.includes(kunci) || !String(opsi[kunci] ?? '').trim()) return { ok: false, reason: 'missing_key' };
        return { ok: true };
    };
    const gateDropped: Array<{ no: unknown; reason: string }> = [];
    const validItems = healedItems.filter((item: any) => {
        const verdict = completePgOptions(item);
        if (verdict.ok) return true;
        gateDropped.push({ no: item?.no, reason: verdict.reason || 'invalid_options' });
        return false;
    });

    finalData.pg = validItems;
    if (gateDropped.length) finalData._qualityGateDropped = gateDropped;

    // Update summary
    // Count each question once, even when heuristic cleanup and verifier repairs both apply.
    auditSummary.repaired_count = healedItems.filter((item: any) => (item?.audit?.repaired_fields || []).length > 0).length;
    auditSummary.passed_count = healedItems.filter((item: any) => item.audit?.status === 'verified').length;
    auditSummary.flagged_count = healedItems.filter((item: any) => item.audit?.status === 'flagged').length;
    auditSummary.overall_quality_score = totalItems
        ? Math.round(healedItems.reduce((total: number, item: any) => total + (item.audit?.quality_score || 0), 0) / totalItems)
        : 0;
    auditSummary.verifier_model = verifierModel;
    auditSummary.flagged_count += gateDropped.length;
    finalData._audit = auditSummary;

    return { finalData, summary: auditSummary };
}
