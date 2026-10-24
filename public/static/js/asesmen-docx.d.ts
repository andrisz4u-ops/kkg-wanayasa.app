import type { AssessmentData, AssessmentImagePreflightResult } from './assessment-image-preflight.js';

export function preloadAsesmenImages(data: AssessmentData | null | undefined): void;
export function prepareAssessmentExportImages(data: AssessmentData | null | undefined): Promise<AssessmentImagePreflightResult>;
export function sanitizeAssessmentSvg(source: string, maxBytes: number): string;
export function selectOptionColumns(opsi: Record<string, unknown> | null | undefined): 1 | 2 | 4;
export function assessmentImageDisplaySize(image: { width?: number; height?: number } | null | undefined): { width: number; height: number };
export function generateAsesmenDocx(
  data: AssessmentData,
  formData: Record<string, unknown>,
  kopSuratUrl?: string,
  options?: { preparedImages?: AssessmentImagePreflightResult },
): Promise<Blob>;
