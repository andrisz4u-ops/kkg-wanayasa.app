export {};

declare global {
  interface Window {
    navigate: (page: string) => void | Promise<void>;
    toggleWorkspaceSidebar: () => void;
    toggleWorkspaceTopMenu: (sectionId: string, event?: Event) => void;
  }
}
