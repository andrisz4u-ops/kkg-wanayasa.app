export interface WorkspaceActivity {
  id?: string | number;
  tanggal?: string;
  waktu?: string;
  [key: string]: unknown;
}

export function getWorkspaceAccess(role: string): { management: boolean; approvals: boolean };
export function getUpcomingActivities<T extends WorkspaceActivity>(items: T[], now?: Date): T[];
export function getRecentWorkspaceDocuments(): Array<{ id: string; title: string; createdAt: string; [key: string]: unknown }>;
export function renderEducatorDashboard(): string;
export function initEducatorDashboard(): Promise<void>;
