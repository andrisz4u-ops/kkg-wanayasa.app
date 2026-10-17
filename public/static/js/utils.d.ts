export function showToast(message: string, type?: string, duration?: number): void;
export function parseDate(dateStr: string | Date | null | undefined): Date | null;
export function formatDate(dateStr: string | Date | null | undefined): string;
export function formatDateTime(dateStr: string | Date | null | undefined): string;
export function formatRelativeTime(dateStr: string | Date | null | undefined): string;
export function escapeHtml(value: unknown): string;
export function nl2br(value: string): string;
export function truncate(value: string, length?: number): string;
export function debounce<T extends (...args: never[]) => unknown>(func: T, wait?: number): (...args: Parameters<T>) => void;
export function createSpinner(size?: string): string;
export function showLoading(message?: string, subtitle?: string, options?: { scope?: string }): void;
export function hideLoading(): void;
export function emptyState(icon?: string, title?: string, subtitle?: string): string;
export function skeletonList(count?: number): string;
export function skeletonCards(count?: number): string;
export function skeletonTable(cols?: number, rows?: number): string;
export function confirm(message: string, title?: string): Promise<boolean>;
export function copyToClipboard(text: string): Promise<boolean>;
export function formatFileSize(bytes: number): string;
export function getInitials(name: string): string;
export function getAvatarColor(name: string): string;
export function avatar(name: string, size?: string, imageUrl?: string | null): string;
export function badge(text: string, type?: string): string;
export function moduleToast(section: string, message: string, type?: string): void;
export function getQueryParams(): Record<string, string>;
export interface ActiveAiProvider {
  slug: string;
  name: string;
  model: string;
}
export function getActiveAiProviders(forceRefresh?: boolean): Promise<ActiveAiProvider[]>;
export function populateAiModelSelect(selector: string | HTMLSelectElement, preferredDefault?: string): Promise<void>;
export function getActiveTahunAjaran(fallback?: string): string;
export function renderTahunAjaranOptions(selectedVal?: string): string;
export interface UserDefaultProfile {
  kelas?: string | number;
  jenjang_kelas?: string | number;
  mata_pelajaran?: string;
  role_label?: string;
  role?: string;
  jabatan?: string;
}
export function detectUserDefaultKelas(user: UserDefaultProfile | null): number;
export function detectUserDefaultMapel(user: UserDefaultProfile | null, defaultKelas?: number): string;

export { openAiLiveMonitor, closeAiLiveMonitor, isAiJobRunning, hasActiveAiJob, getActiveAiJobSignal } from './ai-live-monitor.js';
export { streamPost } from './ai-stream.js';
