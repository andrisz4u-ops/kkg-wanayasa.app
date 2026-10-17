import type { AssessmentData, AssessmentImagePreflightResult } from './assessment-image-preflight.js';

export function preloadAsesmenImages(data: AssessmentData | null | undefined): void;
export function prepareAssessmentExportImages(data: AssessmentData | null | undefined): Promise<AssessmentImagePreflightResult>;
export function generateAsesmenDocx(
  data: AssessmentData,
  formData: Record<string, unknown>,
  kopSuratUrl?: string,
  options?: { preparedImages?: AssessmentImagePreflightResult },
): Promise<Blob>;
