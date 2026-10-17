/**
 * Capaian Pembelajaran (CP) deterministic structure and heuristic quality gate.
 * 
 * Pipeline 3-Tier:
 * Tier 1: Deterministic Rule-Based Sanitizer & KKO Checker (Zero Latency)
 * Structural checks are deterministic; CP alignment remains unassessed except for
 * the explicitly narrow IPAS mismatch heuristic. This is not teacher approval.
 */

import { getAlokasiWaktuResmi, balanceSemesterJpItems } from './alokasi-waktu';
import { AIService } from '../services/ai';

export interface CpAuditItem {
  kode_tp: string;
  bab_no: number;
  bab_title: string;
  materi_pokok: string;
  tp: string;
  atp: string;
  alokasi_waktu: string;
  status: 'needs_review' | 'repaired' | 'flagged';
  structural_status: 'passed' | 'repaired' | 'flagged';
  quality_score: number; // 0 - 100
  kko: string;
  bloom_level: string; // e.g. "C2 (Memahami)", "C3 (Menerapkan)", "C4 (Menganalisis)"
  kko_operasional: boolean;
  cp_aligned: boolean | null;
  alignment_status: 'not_assessed' | 'suspected_mismatch';
  verification_scope: 'deterministic';
  review_status: 'needs_teacher_review';
  jp_valid: boolean;
  notes?: string;
  repaired_fields?: string[];
  suggestions?: string[];
}

export interface CpAuditSummary {
  total_tp: number;
  total_babs: number;
  passed_count: number;
  structure_passed_count: number;
  needs_review_count: number;
  repaired_count: number;
  flagged_count: number;
  overall_quality_score: number; // 0 - 100
  grade: 'A' | 'B' | 'C' | 'D';
  grade_label: string;
  kko_compliance_pct: number;
  cp_alignment_pct: number | null;
  alignment_warning_count?: number;
  jp_compliance_pct: number;
  terminology_clean: boolean;
  target_jp_per_semester: number;
  actual_jp_per_semester: { semester: number; total_jp: number }[];
  verification_scope: 'deterministic';
  review_status: 'needs_teacher_review';
  audited_at: string;
  verified_at: null;
}

export interface CpQualityGateResult {
  summary: CpAuditSummary;
  items: CpAuditItem[];
}

// Kata Kerja Pasif / Non-Operasional yang dilarang dalam kaidah penulisan TP Kurikulum Merdeka
const FORBIDDEN_VERBS: Record<string, string> = {
  'memahami': 'menjelaskan',
  'mengetahui': 'mengidentifikasi',
  'mengerti': 'menerangkan',
  'mempelajari': 'mengeksplorasi',
  'mendalami': 'menganalisis',
  'menyadari': 'merefleksikan',
  'menguasai': 'menerapkan'
};

// Taksonomi Bloom Terkini (KKO Operasional)
const BLOOM_KKO: Record<string, { level: string; verbs: string[] }> = {
  'C1': {
    level: 'C1 (Mengingat)',
    verbs: ['menyebutkan', 'menuliskan', 'mengingat', 'melafalkan', 'membilang', 'menunjukkan', 'mendaftar', 'mencocokkan', 'mengenali', 'menamai']
  },
  'C2': {
    level: 'C2 (Memahami)',
    verbs: ['menjelaskan', 'mengidentifikasi', 'mengklasifikasikan', 'membedakan', 'memperkirakan', 'menerangkan', 'merangkum', 'menguraikan', 'mendeskripsikan', 'mencontohkan', 'menyimpulkan']
  },
  'C3': {
    level: 'C3 (Mengaplikasikan)',
    verbs: ['menerapkan', 'menghitung', 'mendemonstrasikan', 'mempraktikkan', 'menggunakan', 'menentukan', 'memecahkan', 'melakukan', 'mengukur', 'mengoperasikan', 'mengilustrasikan', 'menyelidiki']
  },
  'C4': {
    level: 'C4 (Menganalisis)',
    verbs: ['menganalisis', 'membandingkan', 'menelaah', 'menginvestigasi', 'mengaitkan', 'memeriksa', 'menguji', 'memisahkan', 'mendiagnosis', 'menguraikan', 'menemukan pola']
  },
  'C5': {
    level: 'C5 (Mengevaluasi)',
    verbs: ['menilai', 'mengkritisi', 'merefleksikan', 'memvalidasi', 'membuktikan', 'memutuskan', 'mempertahankan', 'mengevaluasi', 'memilih alternatif']
  },
  'C6': {
    level: 'C6 (Mencipta)',
    verbs: ['merancang', 'memproduksi', 'menghasilkan', 'mengonstruksi', 'menyusun', 'membuat', 'memodifikasi', 'memformulasikan', 'mengembangkan', 'mengkreasikan']
  }
};

/**
 * Deteksi KKO dari kalimat rumusan TP
 */
export function extractKkoFromTp(tpText: string): { kko: string; bloomCode: string; bloomLabel: string; isOperasional: boolean } {
  const clean = (tpText || '').toLowerCase().replace(/^(murid\s+(?:mampu|dapat)\s+|peserta\s+didik\s+(?:mampu|dapat)\s+)/i, '').trim();
  const words = clean.split(/\s+/);
  const firstWord = words[0] || '';
  const twoWords = `${words[0] || ''} ${words[1] || ''}`.trim();

  // Cek apakah termasuk kata kerja terlarang
  if (FORBIDDEN_VERBS[firstWord]) {
    return {
      kko: firstWord,
      bloomCode: 'C2-Passive',
      bloomLabel: 'C2 (Non-Operasional)',
      isOperasional: false
    };
  }

  // Cari di tabel Bloom
  for (const [code, info] of Object.entries(BLOOM_KKO)) {
    for (const v of info.verbs) {
      if (firstWord === v || twoWords === v || clean.startsWith(v)) {
        return {
          kko: v,
          bloomCode: code,
          bloomLabel: info.level,
          isOperasional: true
        };
      }
    }
  }

  // Jika kata kerja berawalan me-/ber-
  if (/^(me|ber|meng|meny|mem|men)/.test(firstWord)) {
    return {
      kko: firstWord,
      bloomCode: 'C3',
      bloomLabel: 'C3 (Aplikatif)',
      isOperasional: true
    };
  }

  return {
    kko: firstWord || 'umum',
    bloomCode: 'C2',
    bloomLabel: 'C2 (Dasar)',
    isOperasional: true
  };
}

/**
 * Periksa kesesuaian level Bloom dengan Fase perkembangan murid
 */
export function checkBloomLevelFase(bloomCode: string, fase: string): { matches: boolean; recommendation?: string } {
  const f = (fase || 'C').toUpperCase().replace('FASE', '').trim();
  if (f === 'A') {
    // Fase A ideal: C1 - C2 (C3 awal)
    if (bloomCode === 'C4' || bloomCode === 'C5' || bloomCode === 'C6') {
      return {
        matches: false,
        recommendation: 'Level kognitif terlalu tinggi untuk Fase A (Kelas 1-2). Direkomendasikan C1-C2 (Menyebutkan/Menjelaskan/Menunjukkan).'
      };
    }
    return { matches: true };
  } else if (f === 'B') {
    // Fase B ideal: C2 - C3 (C4 awal)
    if (bloomCode === 'C5' || bloomCode === 'C6') {
      return {
        matches: false,
        recommendation: 'Level kognitif terlalu abstrak untuk Fase B (Kelas 3-4). Direkomendasikan C2-C3 (Menjelaskan/Menerapkan/Mempraktikkan).'
      };
    }
    return { matches: true };
  } else {
    // Fase C ideal: C3 - C4 / C5
    if (bloomCode === 'C1') {
      return {
        matches: false,
        recommendation: 'Level kognitif terlalu rendah untuk Fase C (Kelas 5-6). Tingkatkan ke C3-C4 (Menerapkan/Menganalisis/Menyelidiki).'
      };
    }
    return { matches: true };
  }
}

/**
 * Pembersih kata Peserta Didik -> Murid
 */
export function sanitizeTerminology(text: string): { text: string; replaced: boolean } {
  if (!text || typeof text !== 'string') return { text: text || '', replaced: false };
  let replaced = false;
  const newText = text
    .replace(/lembar\s+kerja\s+peserta\s+didik\s*\((?:lkpd|lkm)\)/gi, () => { replaced = true; return 'Lembar Kerja Murid (LKM)'; })
    .replace(/lembar\s+kerja\s+peserta\s+didik/gi, () => { replaced = true; return 'Lembar Kerja Murid'; })
    .replace(/peserta\s+didik/gi, (m) => {
      replaced = true;
      if (m === 'PESERTA DIDIK') return 'MURID';
      if (m === 'peserta didik') return 'murid';
      return 'Murid';
    });
  return { text: newText, replaced };
}

function buildCpAuditPrompt(items: any[], context: any): string {
  return `Anda membantu menyarankan perbaikan redaksi Tujuan Pembelajaran (TP) berdasarkan kaidah kebahasaan dan KKO operasional.
Respons Anda adalah saran otomatis, bukan verifikasi keselarasan CP, bukti kepatuhan regulasi, atau persetujuan guru. Hasil harus ditinjau guru.
Mata Pelajaran: ${context.mapel}
Jenjang/Fase: Kelas ${context.kelasNum} (${context.fase})

Kaidah Baku:
1. Wajib menggunakan Kata Kerja Operasional (KKO) aktif & terukur Taksonomi Bloom.
2. Dilarang menggunakan kata kerja pasif/abstrak ("memahami", "mengetahui", "mengerti").
3. Format standar: "Murid mampu [KKO Operasional] [Lingkup Materi] [Konteks/Metode]".
4. Sebutan wajib menggunakan "Murid".

Daftar TP:
${JSON.stringify(items.map(it => ({ kode_tp: it.kode_tp, materi_pokok: it.materi_pokok, tp: it.tp, kko: it.kko })), null, 2)}

Keluarkan HANYA JSON valid:
{
  "verifications": [
    {
      "kode_tp": "string",
      "refined_tp": "string",
      "kko": "string",
      "bloom_level": "string",
      "notes": "string"
    }
  ]
}`;
}

/**
 * ENGINE QUALITY GATE UTAMA: runCpQualityGate
 * Mengevaluasi seluruh struktur Analisis CP, memberikan scoring objektif, audit per TP, dan auto-repair
 */
export async function runCpQualityGate(
  analysisData: any,
  inputChapters: any[] = [],
  meta: any = {},
  options?: {
    ai?: AIService;
    preferredSlug?: string;
    onProgress?: (msg: string, percent: number) => Promise<void>;
  }
): Promise<{ data: any; audit: CpQualityGateResult }> {
  const data = (analysisData && typeof analysisData === 'object') ? JSON.parse(JSON.stringify(analysisData)) : {};

  if (options?.onProgress) {
    await options.onProgress('Memulai pemeriksaan struktur TP dan KKO secara deterministik...', 80);
  }

  // 1. Ekstraksi Context Metadata
  const mapel = String(data.metadata?.mata_pelajaran || meta.mataPelajaran || meta.mata_pelajaran || '');
  const rawKelas = String(data.metadata?.kelas || meta.jenjangKelas || '5');
  const kelasNum = parseInt(rawKelas.replace(/\D/g, '') || '5', 10);
  const fase = String(data.metadata?.fase || meta.fase || (kelasNum <= 2 ? 'Fase A' : kelasNum <= 4 ? 'Fase B' : 'Fase C'));
  const quota = getAlokasiWaktuResmi(mapel, kelasNum);

  const auditItems: CpAuditItem[] = [];
  let totalTp = 0;
  let passedCount = 0;
  let repairedCount = 0;
  let flaggedCount = 0;
  let kkoCompliantCount = 0;
  let jpValidCount = 0;
  let totalScoreAccumulator = 0;
  let anyTerminologyReplaced = false;

  const semesters = Array.isArray(data.semesters) ? data.semesters : [];
  const actualJpPerSemester: { semester: number; total_jp: number }[] = [];

  let globalTpCounter = 1;

  for (const sem of semesters) {
    const semNum = sem.semester || 1;
    let semJpSum = 0;
    const babs = Array.isArray(sem.babs) ? sem.babs : [];

    for (const bab of babs) {
      const babNo = bab.no || 1;
      const babTitle = bab.bab || `Bab ${babNo}`;
      const items = Array.isArray(bab.items) ? bab.items : [];

      for (const item of items) {
        totalTp++;
        const repairedFields: string[] = [];
        const suggestions: string[] = [];
        let itemScore = 100;
        let structuralStatus: 'passed' | 'repaired' | 'flagged' = 'passed';

        // A. Cek Kode TP Sekuensial
        const expectedCode = `${kelasNum}.${globalTpCounter++}`;
        if (!item.kode_tp || item.kode_tp !== expectedCode) {
          item.kode_tp = expectedCode;
          repairedFields.push('kode_tp');
        }

        // B. Cek Terminologi "Peserta Didik" -> "Murid"
        const tpClean = sanitizeTerminology(item.tp || '');
        if (tpClean.replaced) {
          item.tp = tpClean.text;
          repairedFields.push('tp_terminologi');
          anyTerminologyReplaced = true;
        }

        const atpClean = sanitizeTerminology(item.atp || '');
        if (atpClean.replaced) {
          item.atp = atpClean.text;
          repairedFields.push('atp_terminologi');
          anyTerminologyReplaced = true;
        }

        // C. KKO & Taksonomi Bloom Verification
        let kkoInfo = extractKkoFromTp(item.tp || '');
        let kkoOperasional = kkoInfo.isOperasional;

        // Auto-heal kata kerja terlarang: misal "memahami" -> ubah jadi KKO operasional terukur
        if (!kkoOperasional) {
          const replacement = (fase.includes('C')) ? 'menganalisis dan menerapkan' : 'menjelaskan dan mempraktikkan';
          const healedTp = (item.tp || '').replace(/^Murid\s+(?:mampu|dapat)\s+memahami/i, `Murid mampu ${replacement}`);
          if (healedTp !== item.tp) {
            item.tp = healedTp;
            repairedFields.push('kko_operasional');
            kkoInfo = extractKkoFromTp(item.tp);
            kkoOperasional = true;
            suggestions.push(`KKO non-operasional '${kkoInfo.kko}' diperbaiki otomatis menjadi '${replacement}'.`);
          } else {
            itemScore -= 25;
            structuralStatus = 'flagged';
            suggestions.push(`Kata kerja '${kkoInfo.kko}' belum operasional. Ganti dengan KKO terukur (contoh: menjelaskan, menganalisis, mempraktikkan).`);
          }
        }

        if (kkoOperasional) {
          kkoCompliantCount++;
        }

        // Cek kesesuaian level Bloom dengan Fase
        const faseCheck = checkBloomLevelFase(kkoInfo.bloomCode, fase);
        if (!faseCheck.matches && faseCheck.recommendation) {
          suggestions.push(faseCheck.recommendation);
          itemScore -= 10;
        }

        // D. Keselarasan Materi Pokok & Elemen CP
        let cpAligned: boolean | null = null;
        let alignmentStatus: 'not_assessed' | 'suspected_mismatch' = 'not_assessed';
        const materiLower = (item.materi_pokok || '').toLowerCase();
        const babLower = babTitle.toLowerCase();
        const cpLower = (bab.cp || '').toLowerCase();

        if (materiLower && cpLower && !cpLower.includes(materiLower.slice(0, 4)) && !babLower.includes(materiLower.slice(0, 4))) {
          if (mapel.toLowerCase().includes('ipas') && (cpLower.includes('geografis') && materiLower.includes('ekosistem'))) {
            cpAligned = false;
            alignmentStatus = 'suspected_mismatch';
            itemScore -= 20;
            structuralStatus = 'flagged';
            suggestions.push('Heuristik mengindikasikan kemungkinan ketidakselarasan materi dengan elemen CP; perlu tinjauan guru.');
          }
        }

        // E. Alokasi Waktu (JP)
        let jpNum = 4;
        if (item.alokasi_waktu) {
          const m = String(item.alokasi_waktu).match(/\d+/);
          if (m) jpNum = parseInt(m[0], 10);
        } else {
          item.alokasi_waktu = '4 JP';
          repairedFields.push('alokasi_waktu');
        }

        semJpSum += jpNum;

        const jpValid = jpNum >= 2 && jpNum <= 8;
        if (jpValid) {
          jpValidCount++;
        } else {
          itemScore -= 10;
          suggestions.push(`Alokasi waktu (${jpNum} JP) di luar rentang standar normal (2-8 JP).`);
        }

        if (repairedFields.length > 0 && structuralStatus !== 'flagged') {
          structuralStatus = 'repaired';
        }

        itemScore = Math.max(40, Math.min(100, itemScore));
        totalScoreAccumulator += itemScore;

        auditItems.push({
          kode_tp: item.kode_tp,
          bab_no: babNo,
          bab_title: babTitle,
          materi_pokok: item.materi_pokok || babTitle,
          tp: item.tp,
          atp: item.atp || `Mempelajari materi ${item.materi_pokok}, berlatih kompetensi, dan evaluasi formatif.`,
          alokasi_waktu: `${jpNum} JP`,
          status: structuralStatus === 'flagged' ? 'flagged' : structuralStatus === 'repaired' ? 'repaired' : 'needs_review',
          structural_status: structuralStatus,
          quality_score: itemScore,
          kko: kkoInfo.kko,
          bloom_level: kkoInfo.bloomLabel,
          kko_operasional: kkoOperasional,
          cp_aligned: cpAligned,
          alignment_status: alignmentStatus,
          verification_scope: 'deterministic',
          review_status: 'needs_teacher_review',
          jp_valid: jpValid,
          notes: suggestions.join(' | ') || 'Pemeriksaan struktur deterministik selesai; tinjauan guru tetap diperlukan.',
          repaired_fields: repairedFields,
          suggestions
        });
      }
    }

    actualJpPerSemester.push({
      semester: semNum,
      total_jp: semJpSum
    });
  }

  if (options?.onProgress) {
    await options.onProgress('Memeriksa indikator struktur; keselarasan CP belum diverifikasi...', 86);
  }

  const preRepairScores = new Map(auditItems.map(item => [item.kode_tp, item.quality_score]));

  // Optional AI-assisted wording repair for structurally flagged items; never approval.
  const itemsNeedingRefinement = auditItems.filter(ai => ai.status === 'flagged');
  if (options?.ai && options?.preferredSlug && itemsNeedingRefinement.length > 0) {
    try {
      if (options?.onProgress) {
        await options.onProgress('AI membantu menyarankan perbaikan rumusan TP; hasil tetap perlu ditinjau guru...', 92);
      }
      const prompt = buildCpAuditPrompt(itemsNeedingRefinement, { mapel, kelasNum, fase });
      const aiCriticRes = await options.ai.generateJSON(prompt, options.preferredSlug);

      if (aiCriticRes?.verifications && Array.isArray(aiCriticRes.verifications)) {
        for (const v of aiCriticRes.verifications) {
          if (!v || typeof v !== 'object') continue;
          const refinedTp = typeof v.refined_tp === 'string' ? v.refined_tp.trim() : '';
          if (!refinedTp) continue;

          const matchItem = auditItems.find(ai => ai.kode_tp === v.kode_tp);
          if (matchItem) {
            matchItem.tp = refinedTp;
            matchItem.repaired_fields = matchItem.repaired_fields || [];
            matchItem.repaired_fields.push('ai_critic_refined');
            matchItem.notes = typeof v.notes === 'string' && v.notes.trim()
              ? v.notes
              : 'Rumusan dibantu diperbaiki oleh AI; belum mendapat persetujuan guru.';

            // Sinkronkan ke data utama
            for (const sem of semesters) {
              for (const b of (sem.babs || [])) {
                for (const it of (b.items || [])) {
                  if (it.kode_tp === v.kode_tp) {
                    it.tp = refinedTp;
                    break;
                  }
                }
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('[QualityGate] AI Verifier critic call failed, proceeding with heuristic tier:', e.message);
    }
  }

  // Re-run deterministic checks against the final text. AI output never creates
  // semantic alignment or teacher approval and never increases the score.
  for (const item of auditItems) {
    const kkoInfo = extractKkoFromTp(item.tp || '');
    const faseCheck = checkBloomLevelFase(kkoInfo.bloomCode, fase);
    const matchedItem = semesters.flatMap((sem: any) => (sem.babs || []).flatMap((bab: any) => bab.items || []))
      .find((it: any) => it.kode_tp === item.kode_tp);
    if (matchedItem) {
      matchedItem.tp = item.tp;
    }
    item.kko = kkoInfo.kko;
    item.bloom_level = kkoInfo.bloomLabel;
    item.kko_operasional = kkoInfo.isOperasional;
    const checksPass = kkoInfo.isOperasional && faseCheck.matches && item.jp_valid && item.cp_aligned !== false;
    const aiRepaired = item.repaired_fields?.includes('ai_critic_refined') === true;
    const finalCheckPenalty = (kkoInfo.isOperasional ? 0 : 25)
      + (faseCheck.matches ? 0 : 10)
      + (item.jp_valid ? 0 : 10)
      + (item.cp_aligned === false ? 20 : 0);
    item.quality_score = Math.max(40, Math.min(
      preRepairScores.get(item.kode_tp) ?? item.quality_score,
      100 - finalCheckPenalty
    ));
    if (!checksPass) item.structural_status = 'flagged';
    else if (aiRepaired || (item.repaired_fields?.length ?? 0) > 0) item.structural_status = 'repaired';
    else item.structural_status = 'passed';
    item.status = item.structural_status === 'flagged' ? 'flagged' : item.structural_status === 'repaired' ? 'repaired' : 'needs_review';
    item.review_status = 'needs_teacher_review';
    if (!checksPass) item.notes = `${item.notes || ''} Pemeriksaan struktur deterministik pascaperbaikan belum lolos; perlu tinjauan guru.`.trim();
  }

  // Counts and compliance rates must describe the final post-repair result.
  totalScoreAccumulator = auditItems.reduce((sum, item) => sum + item.quality_score, 0);
  passedCount = 0;
  repairedCount = auditItems.filter(item => item.status === 'repaired').length;
  flaggedCount = auditItems.filter(item => item.status === 'flagged').length;
  const structurePassedCount = auditItems.filter(item => item.structural_status === 'passed').length;
  kkoCompliantCount = auditItems.filter(item => item.kko_operasional).length;
  jpValidCount = auditItems.filter(item => item.jp_valid).length;

  if (options?.onProgress) {
    await options.onProgress('Menguji keseimbangan alokasi waktu Permendikdasmen No. 13 Tahun 2025...', 96);
  }

  // 2. Kalkulasi Ringkasan Audit (Summary)
  const safeTotalTp = Math.max(1, totalTp);
  const overallQualityScore = Math.round(totalScoreAccumulator / safeTotalTp);

  let grade: 'A' | 'B' | 'C' | 'D' = 'A';
  let gradeLabel = 'Struktur baik — perlu tinjauan guru';
  if (overallQualityScore < 70) {
    grade = 'D';
    gradeLabel = 'Struktur perlu banyak perbaikan — perlu tinjauan guru';
  } else if (overallQualityScore < 80) {
    grade = 'C';
    gradeLabel = 'Struktur cukup — perlu tinjauan guru';
  } else if (overallQualityScore < 90) {
    grade = 'B';
    gradeLabel = 'Struktur baik — perlu tinjauan guru';
  }

  const summary: CpAuditSummary = {
    total_tp: totalTp,
    total_babs: (inputChapters && inputChapters.length > 0) ? inputChapters.length : semesters.reduce((acc: number, s: any) => acc + (s.babs?.length || 0), 0),
    passed_count: passedCount,
    structure_passed_count: structurePassedCount,
    needs_review_count: totalTp,
    repaired_count: repairedCount,
    flagged_count: flaggedCount,
    overall_quality_score: overallQualityScore,
    grade,
    grade_label: gradeLabel,
    kko_compliance_pct: Math.round((kkoCompliantCount / safeTotalTp) * 100),
    cp_alignment_pct: null,
    alignment_warning_count: auditItems.filter(item => item.alignment_status === 'suspected_mismatch').length,
    jp_compliance_pct: Math.round((jpValidCount / safeTotalTp) * 100),
    terminology_clean: true,
    target_jp_per_semester: quota.intrakurikulerPerSemester,
    actual_jp_per_semester: actualJpPerSemester,
    verification_scope: 'deterministic',
    review_status: 'needs_teacher_review',
    audited_at: new Date().toISOString(),
    verified_at: null
  };

  if (options?.onProgress) {
    await options.onProgress(`Pemeriksaan struktur selesai: ${summary.overall_quality_score}/100 (${summary.grade_label})`, 98);
  }

  const auditResult: CpQualityGateResult = {
    summary,
    items: auditItems
  };

  data._audit = auditResult;

  return {
    data,
    audit: auditResult
  };
}
