export type AssessmentImageSection = 'pg' | 'isian' | 'uraian';
export type AssessmentImageFailureCategory = 'missing-source' | 'load-failed' | 'decode-failed' | 'invalid-image' | 'budget-exceeded' | 'timeout' | 'source-changed';

export interface AssessmentImageSource {
  url: string | undefined;
  svg: string | undefined;
}

export interface AssessmentImageQuestion {
  no?: number | string;
  gambar?: unknown;
  visual_stimulus?: { type: string; params?: Record<string, unknown> } | null;
  soal?: string;
  [key: string]: unknown;
}

export interface AssessmentData {
  pg?: AssessmentImageQuestion[];
  isian?: { type?: string; data?: AssessmentImageQuestion[]; crossword?: unknown } | null;
  uraian?: AssessmentImageQuestion[];
}

export interface AssessmentImageExpectation {
  section: AssessmentImageSection;
  number: number | string;
  question: AssessmentImageQuestion;
  image: AssessmentImageSource;
  /** Image source metadata frozen when the assessment's expected images are collected. */
  sourceSnapshot: { gambar: unknown; visual_stimulus: unknown };
}

export interface LoadedAssessmentImage {
  buffer: ArrayBuffer;
  type: 'png' | 'jpeg';
  width: number;
  height: number;
  /** Opaque SHA-256 identity for source fields, not a URL or source string. */
  sourceFingerprint: string;
  /** SHA-256 of the binary bytes that were decoded. */
  bytesFingerprint: string;
}

export interface AssessmentImageFailure {
  section: AssessmentImageSection;
  number: number | string;
  category: AssessmentImageFailureCategory;
}

export interface AssessmentImagePreflightResult {
  ready: boolean;
  images: Map<AssessmentImageQuestion, LoadedAssessmentImage>;
  failures: AssessmentImageFailure[];
}

export interface AssessmentImageLimits {
  readonly maxConcurrency: 2;
  readonly maxImageBytes: 524288;
  readonly maxTotalBytes: 4194304;
  readonly loadTimeoutMs: 10000;
  readonly decodeTimeoutMs: 5000;
  readonly maxPixels: 8000000;
  readonly maxCacheEntries: 32;
}

export declare const ASSESSMENT_IMAGE_LIMITS: AssessmentImageLimits;

export class AssessmentImagePreflightError extends Error {
  readonly failures: AssessmentImageFailure[];
  constructor(failures: AssessmentImageFailure[]);
}

export function collectExpectedAssessmentImages(data: AssessmentData | null | undefined): AssessmentImageExpectation[];
export function preflightAssessmentImages(
  data: AssessmentData | null | undefined,
  options: {
    loadImage: (image: AssessmentImageSource, expectation: AssessmentImageExpectation, options: { signal: AbortSignal; maxImageBytes: number }) => Promise<{ buffer: ArrayBuffer; type: 'png' | 'jpeg' }>;
    decodeImage?: (buffer: ArrayBuffer, type: 'png' | 'jpeg', options: { signal: AbortSignal }) => Promise<{ width: number; height: number }>;
    maxConcurrency?: number;
    maxImageBytes?: number;
    maxTotalBytes?: number;
    loadTimeoutMs?: number;
    decodeTimeoutMs?: number;
  },
): Promise<AssessmentImagePreflightResult>;

export function validatePreparedAssessmentImages(
  data: AssessmentData | null | undefined,
  prepared: AssessmentImagePreflightResult,
  options?: {
    decodeImage?: false | ((buffer: ArrayBuffer, type: 'png' | 'jpeg', options: { signal: AbortSignal }) => Promise<{ width: number; height: number }>);
    decodeTimeoutMs?: number;
  },
): Promise<AssessmentImageFailure[]>;
