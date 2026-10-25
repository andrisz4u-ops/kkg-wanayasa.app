export type AssessmentPackageSaveStatus = 'unsaved' | 'saving' | 'saved' | 'failed' | 'conflict';
export declare const ASSESSMENT_PACKAGE_IMAGE_MAX_BYTES: 1572864;
export interface AssessmentPackageContext {
  packageId: number | string | null;
  revision: number | null;
  owner: string | number | null;
  token: string;
  clientDocumentId: string;
  copyClientDocumentId?: string;
  foreign: boolean;
  visibility: string | null;
}
export interface AssessmentPackageSyncOptions {
  request?: (path: string, options?: Record<string, unknown>) => Promise<any>;
  fetcher?: typeof fetch;
  csrfToken?: () => string | null;
  ownerProvider?: () => number | string | null;
  debounceMs?: number;
  setTimer?: typeof setTimeout;
  clearTimer?: typeof clearTimeout;
  onStatus?: (event: { status: AssessmentPackageSaveStatus; label: string; error: unknown; context: AssessmentPackageContext | null; imageWarnings: string[] }) => void;
  onSaved?: (context: AssessmentPackageContext, draft: { content: unknown; metadata: Record<string, unknown>; serverCanonical: boolean; version: number }) => void;
  onConflict?: (event: { error: unknown; context: AssessmentPackageContext; local: { content: unknown; metadata: Record<string, unknown> } }) => void;
}
export function canonicalAssessmentContent(content: unknown): any;
export function createAssessmentAssetId(): string;
export class AssessmentPackageSync {
  constructor(options?: AssessmentPackageSyncOptions);
  context: AssessmentPackageContext | null;
  snapshot: { content: unknown; metadata: Record<string, unknown> } | null;
  status: AssessmentPackageSaveStatus;
  error: unknown;
  imageWarnings: string[];
  setContext(context?: Partial<AssessmentPackageContext>): AssessmentPackageContext;
  current(token?: string): boolean;
  edit(content: unknown, metadata?: Record<string, unknown>): number;
  flush(): Promise<{ status?: AssessmentPackageSaveStatus; context?: AssessmentPackageContext; stale?: boolean }>;
  retry(): Promise<{ status?: AssessmentPackageSaveStatus; context?: AssessmentPackageContext; stale?: boolean }>;
  loadServer(): Promise<any>;
  uploadImage(blob: Blob, options?: { assetId?: string; name?: string; type?: string }): Promise<any>;
  uploadImageUrl(url: string, options?: { assetId?: string; name?: string }): Promise<any>;
}
export function createAssessmentPackageSync(options?: AssessmentPackageSyncOptions): AssessmentPackageSync;
