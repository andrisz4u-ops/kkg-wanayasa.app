export interface CpQualityAudit {
  summary: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
}

export interface CpQualityGateResult {
  data: Record<string, unknown>;
  audit: CpQualityAudit;
}

export function replacePesertaDidik(data: unknown): unknown;
export interface CpChapterInput {
  cp?: string;
  bab?: string;
  materi_list?: string[];
  items?: Array<{ materi_pokok?: string; tp?: string; atp?: string }>;
}
export interface CpFormMeta {
  namaSekolah?: string;
  mataPelajaran?: string;
  mata_pelajaran?: string;
  fase?: string;
  jenjangKelas?: string;
  kelas?: string | number;
  tahunAjaran?: string;
  targetSemester?: string | number;
  bookCoverage?: string | number;
  baseCP?: string;
}
export function repairAndEnrichIpasBabCp(bab: CpChapterInput, fase?: string): string;
export function repairAndEnrichMatematikaBabCp(bab: CpChapterInput, fase?: string): string;
export function validateAndRepairAnalysisData(rawData: unknown, inputChapters?: unknown[], formMeta?: CpFormMeta): unknown;
export declare const FORBIDDEN_VERBS: Readonly<Record<string, string>>;
export declare const BLOOM_KKO: Readonly<Record<string, { level: string; verbs: readonly string[] }>>;
export interface KkoResult {
  kko: string;
  bloomCode: string;
  bloomLabel: string;
  isOperasional: boolean;
}
export interface BloomLevelResult {
  matches: boolean;
  recommendation?: string;
}
export function extractKkoFromTp(tpText: string): KkoResult;
export function checkBloomLevelFase(bloomCode: string, fase: string): BloomLevelResult;
export function runCpQualityGate(analysisData: unknown, inputChapters?: unknown[], formMeta?: CpFormMeta): CpQualityGateResult;
