export interface WorkspaceMeta {
  title?: string;
  [key: string]: string | undefined;
}

export interface WorkspaceOptions {
  content: string;
  page: string;
  meta?: WorkspaceMeta;
  name?: string;
  topNav?: string;
  sidebarNav?: string;
  mobileNav?: string;
  bottomNav?: string;
  aiSheet?: string;
  notificationBell?: string;
}

export function mountWorkspaceLayout(root: HTMLElement | null, options: WorkspaceOptions): void;
export interface WorkspaceSection {
  id: string;
  title?: string;
  admin?: boolean;
  items: Array<{ page: string; label: string; public?: boolean; admin?: boolean; auth?: boolean }>;
}
export function renderWorkspaceNavigation(sections: WorkspaceSection[], page: string, expandedSections: Record<string, boolean>, surface?: string): string;
export function renderWorkspaceTopNavigation(sections: WorkspaceSection[], page: string): string;
export function renderWorkspaceSidebarNavigation(sections: WorkspaceSection[], page: string): string;
export function renderWorkspaceLayout(options: WorkspaceOptions): string;
export function getWorkspaceSidebarCompact(): boolean;
export function revealWorkspaceSidebarActive(): void;
