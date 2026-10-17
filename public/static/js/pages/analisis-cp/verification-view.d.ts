export interface VerificationViewCallbacks {
  onChange?: (analysisData: unknown) => void;
  onBack?: () => void;
  onValidate?: (analysisData: unknown) => void;
}

export interface VerificationViewInput {
  chapters?: unknown[];
  mataPelajaran?: string;
  jenjangKelas?: string | number;
  fase?: string;
  [field: string]: unknown;
}

export function renderVerificationView(container: HTMLElement, analysisData: unknown, inputData?: VerificationViewInput, callbacks?: VerificationViewCallbacks): void;
